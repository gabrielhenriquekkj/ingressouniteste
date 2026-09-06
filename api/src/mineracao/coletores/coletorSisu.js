const fs = require('fs')
const path = require('path')
const readline = require('readline')
const https = require('https')
const log = require('../log/execucoesMineracao')
const banco = require('../../configuracoes/conexaoBanco')

const TEMP_DIR = path.resolve(__dirname, '../../../temp')

const FONTES_SISU = {
  2023: {
    url: 'https://raw.githubusercontent.com/maiakanegae/sisu-data/main/data/2023/scraping/grades.csv',
    tipo: 'secundaria',
    descricao: 'SiSU 2023 - Dados abertos GitHub (maiakanegae)'
  },
  2024: {
    url: 'https://raw.githubusercontent.com/maiakanegae/sisu-data/main/data/2024/scraping/grades.csv',
    tipo: 'secundaria',
    descricao: 'SiSU 2024 - Dados abertos GitHub (maiakanegae)'
  },
  2025: { url: null, tipo: 'oficial', descricao: 'SiSU 2025 - Fonte oficial pendente' },
  2026: { url: null, tipo: 'oficial', descricao: 'SiSU 2026 - Fonte oficial pendente' }
}

const MAPA_MODALIDADE_CURTO = {
  'ampla': 'ampla', 'lii': 'cota_ppi_renda', 'liii': 'cota_ppi_deficiencia',
  'liv': 'cota_renda', 'lv': 'cota_deficiencia', 'lvi': 'cota_ppi',
  'lvii': 'cota_ppi_deficiencia', 'lviii': 'cota_escola_publica', 'lix': 'cota_deficiencia',
}

function normalizarNome(nome) {
  if (!nome) return ''
  return nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')
}

function extrairModalidades(linha) {
  const modalidades = []
  const campos = linha.split(';')
  if (campos.length < 22) return modalidades
  for (let i = 21; i <= campos.length - 5; i += 7) {
    const desc = campos[i] ? campos[i].replace(/"/g, '').trim() : ''
    const numInscritos = campos[i + 1] ? campos[i + 1].replace(/"/g, '').trim() : '0'
    const notaCorte = campos[i + 2] ? campos[i + 2].replace(/"/g, '').trim() : '0'
    if (desc && desc.length > 5) {
      let modalidade = null
      if (desc.includes('Ampla concorr')) modalidade = 'ampla'
      else if (desc.includes('defici') && desc.includes('pretos')) modalidade = 'cota_ppi_deficiencia'
      else if (desc.includes('renda') && desc.includes('pretos')) modalidade = 'cota_ppi_renda'
      else if (desc.includes('defici') && desc.includes('renda')) modalidade = 'cota_deficiencia_renda'
      else if (desc.includes('pretos') || desc.includes('pardos') || desc.includes('ind')) modalidade = 'cota_ppi'
      else if (desc.includes('defici')) modalidade = 'cota_deficiencia'
      else if (desc.includes('renda') || desc.includes('publica')) modalidade = 'cota_escola_publica'
      else if (desc.includes('Escola') || desc.includes('regi')) modalidade = 'regional'
      if (modalidade) {
        const nota = parseFloat(notaCorte.replace(',', '.'))
        if (nota > 0) modalidades.push({ modalidade, nota_corte: nota, inscritos: parseInt(numInscritos) || 0 })
      }
    }
  }
  for (let i = 10; i <= 20 && i < campos.length; i++) {
    const nota = parseFloat(campos[i].replace(',', '.'))
    if (nota > 0) {
      const modalidadesNum = ['ampla', 'cota_ppi_renda', 'cota_ppi_deficiencia', 'cota_renda', 'cota_deficiencia', 'cota_ppi', 'cota_ppi_deficiencia', 'cota_escola_publica', 'regional', 'cota_deficiencia_renda', 'cota_renda']
      const idx = i - 10
      if (idx < modalidadesNum.length) {
        const exists = modalidades.find(m => m.modalidade === modalidadesNum[idx])
        if (!exists) modalidades.push({ modalidade: modalidadesNum[idx], nota_corte: nota, inscritos: 0 })
      }
    }
  }
  return modalidades
}

function baixarArquivo(url, caminhoDestino) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(caminhoDestino)
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res2) => { res2.pipe(file); file.on('finish', () => { file.close(); resolve() }) }).on('error', reject)
      } else {
        response.pipe(file); file.on('finish', () => { file.close(); resolve() })
      }
    }).on('error', (err) => { fs.unlink(caminhoDestino, () => {}); reject(err) })
  })
}

async function coletar(ano = 2023) {
  const execucaoId = log.registrarExecucao('sisu_notas_corte_' + ano)
  const stats = { inseridos: 0, atualizados: 0, erros: 0, cursos_encontrados: 0, cursos_nao_encontrados: 0, ano }

  const fonte = FONTES_SISU[ano]
  if (!fonte || !fonte.url) {
    console.log(`[COLETOR SISU] Ano ${ano}: fonte não disponível ainda.`)
    log.finalizarExecucao(execucaoId, 'indisponivel', { processados: 0, inseridos: 0, atualizados: 0, erros: 0, observacoes: `Fonte para ${ano} não encontrada` })
    return stats
  }

  const nomeArquivo = `sisu_grades_${ano}.csv`
  const caminhoArquivo = path.join(TEMP_DIR, nomeArquivo)
  if (!fs.existsSync(caminhoArquivo)) {
    console.log(`[COLETOR SISU] Baixando dados do SiSU ${ano}...`)
    try {
      if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
      await baixarArquivo(fonte.url, caminhoArquivo)
    } catch (e) {
      console.error(`[COLETOR SISU] Erro ao baixar SiSU ${ano}:`, e.message)
      log.finalizarExecucao(execucaoId, 'erro', { processados: 0, inseridos: 0, atualizados: 0, erros: 1, observacoes: e.message })
      return stats
    }
  }

  console.log(`[COLETOR SISU] Lendo notas de corte SiSU ${ano}...`)

  // Pre-carregar mapa de instituicoes por sigla+estado para eliminar N+1
  const todasInstituicoes = banco.prepare('SELECT id, sigla, estado FROM instituicoes').all()
  const mapaInstituicoes = new Map()
  for (const inst of todasInstituicoes) {
    const chave = (inst.sigla || '').toUpperCase() + '|' + (inst.estado || '').toUpperCase()
    mapaInstituicoes.set(chave, inst.id)
  }

  // Pre-carregar mapa de cursos por instituicao_id para eliminar N+1
  const todosCursos = banco.prepare('SELECT id, nome, instituicao_id FROM cursos').all()
  const cursosPorInstituicao = new Map()
  for (const curso of todosCursos) {
    if (!cursosPorInstituicao.has(curso.instituicao_id)) cursosPorInstituicao.set(curso.instituicao_id, [])
    cursosPorInstituicao.get(curso.instituicao_id).push(curso)
  }

  const stmtExisteNota = banco.prepare('SELECT id FROM notas_corte WHERE curso_id = ? AND modalidade_acesso = ? AND ano = ? AND chamada = ?')
  const stmtInserirNota = banco.prepare(`
    INSERT INTO notas_corte (curso_id, modalidade_acesso, processo, ano, chamada, nota_corte, tipo_nota, fonte_url, fonte_tipo, coletado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
  `)
  const stmtAtualizarNota = banco.prepare(`
    UPDATE notas_corte SET nota_corte = ?, fonte_tipo = ?, coletado_em = datetime('now','localtime'), updated_at = datetime('now','localtime')
    WHERE id = ?
  `)

  const rl = readline.createInterface({ input: fs.createReadStream(caminhoArquivo, { encoding: 'utf-8' }), crlfDelay: Infinity })

  let contadorLinhas = 0
  let batchNotas = []

  const processarBatch = banco.transaction(() => {
    for (const nota of batchNotas) {
      try {
        const existente = stmtExisteNota.get(nota.curso_id, nota.modalidade, ano, 1)
        if (existente) {
          stmtAtualizarNota.run(nota.nota_corte, fonte.tipo, existente.id)
          stats.atualizados++
        } else {
          stmtInserirNota.run(nota.curso_id, nota.modalidade, 'sisu', ano, 1, nota.nota_corte, 'final', fonte.url, fonte.tipo)
          stats.inseridos++
        }
      } catch (e) { stats.erros++ }
    }
    batchNotas = []
  })

  for await (const linha of rl) {
    contadorLinhas++

    const campos = linha.split(';')
    if (campos.length < 11) continue

    const nomeCurso = campos[1] ? campos[1].replace(/"/g, '').trim() : ''
    const uf = campos[7] ? campos[7].replace(/"/g, '').trim() : ''
    const siglaIes = campos[9] ? campos[9].replace(/"/g, '').trim() : ''

    if (!nomeCurso || !siglaIes) continue

    const instId = mapaInstituicoes.get(siglaIes.toUpperCase() + '|' + uf.toUpperCase())
    if (!instId) { stats.cursos_nao_encontrados++; continue }

    const cursos = cursosPorInstituicao.get(instId) || []
    const nomeNormalizado = normalizarNome(nomeCurso)
    const cursosFiltrados = cursos.filter(c => normalizarNome(c.nome).includes(nomeNormalizado.substring(0, 15)) || nomeNormalizado.includes(normalizarNome(c.nome).substring(0, 15)))
    if (!cursosFiltrados || cursosFiltrados.length === 0) { stats.cursos_nao_encontrados++; continue }

    stats.cursos_encontrados++

    const modalidades = extrairModalidades(linha)
    for (const modalidade of modalidades) {
      for (const curso of cursosFiltrados) {
        batchNotas.push({ curso_id: curso.id, modalidade: modalidade.modalidade, nota_corte: modalidade.nota_corte })
      }
    }

    if (batchNotas.length >= 5000) { processarBatch() }
  }

  if (batchNotas.length > 0) { processarBatch() }

  console.log(`[COLETOR SISU] Ano ${ano} - Linhas: ${contadorLinhas}, Encontrados: ${stats.cursos_encontrados}, Não encontrados: ${stats.cursos_nao_encontrados}`)
  console.log(`[COLETOR SISU] Notas: ${stats.inseridos} inseridas, ${stats.atualizados} atualizadas, ${stats.erros} erros`)

  const status = stats.erros === 0 ? 'sucesso' : 'parcial'
  log.finalizarExecucao(execucaoId, status, { processados: contadorLinhas, inseridos: stats.inseridos, atualizados: stats.atualizados, erros: stats.erros, observacoes: `SiSU ${ano}` })
  return stats
}

async function coletarTodosAnos() {
  console.log('[COLETOR SISU] Coletando notas de corte de todos os anos disponíveis...')
  const resultados = {}
  const anos = Object.keys(FONTES_SISU).map(Number).sort()
  for (const ano of anos) { resultados[ano] = await coletar(ano) }
  const totalInseridos = Object.values(resultados).reduce((s, r) => s + (r.inseridos || 0), 0)
  const totalErros = Object.values(resultados).reduce((s, r) => s + (r.erros || 0), 0)
  console.log(`[COLETOR SISU] Total: ${totalInseridos} inseridos, ${totalErros} erros`)
  return resultados
}

module.exports = { coletar, coletarTodosAnos, FONTES_SISU }
