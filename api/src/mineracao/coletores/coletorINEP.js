const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { normalizarUF } = require('../normalizadores/normalizarInstituicao')
const log = require('../log/execucoesMineracao')
const banco = require('../../configuracoes/conexaoBanco')

const PASTA_MICRODADOS = path.resolve(__dirname, '../../../temp/microdados_2023/microdados_censo_da_educacao_superior_2023/dados')
const CAMINHO_IES = path.join(PASTA_MICRODADOS, 'MICRODADOS_ED_SUP_IES_2023.CSV')
const CAMINHO_CURSOS = path.join(PASTA_MICRODADOS, 'MICRODADOS_CADASTRO_CURSOS_2023.CSV')

const MAPA_ORG_ACADEMICA = { 1: 'universidade', 2: 'centro_universitario', 3: 'faculdade', 4: 'instituto_federal', 5: 'cefet', 9: 'outra' }
const MAPA_CATEGORIA = { 1: 'federal', 2: 'estadual', 3: 'municipal', 4: 'privada', 5: 'privada', 9: 'especial' }
const MAPA_MODALIDADE = { 1: 'presencial', 2: 'ead', 3: 'semipresencial' }
const MAPA_GRAU = { 1: 'Bacharelado', 2: 'Licenciatura', 3: 'Tecnologico', 4: 'Bacharelado' }

async function lerCSVEmLinhas(caminho) {
  const rl = readline.createInterface({ input: fs.createReadStream(caminho, { encoding: 'latin1' }), crlfDelay: Infinity })
  const linhas = []
  for await (const linha of rl) {
    linhas.push(linha)
  }
  return linhas
}

function parseLinhas(linhas) {
  if (linhas.length < 2) return []
  const cabecalho = linhas[0].split(';').map(c => c.trim().replace(/"/g, ''))
  const dados = []
  for (let i = 1; i < linhas.length; i++) {
    const valores = linhas[i].split(';').map(v => v.trim().replace(/"/g, ''))
    const registro = {}
    cabecalho.forEach((campo, idx) => { registro[campo] = valores[idx] || '' })
    dados.push(registro)
  }
  return dados
}

async function coletar() {
  const execucaoId = log.registrarExecucao('inep_microdados')
  const stats = { instituicoes: { inseridos: 0, atualizados: 0 }, campi: { inseridos: 0, atualizados: 0 }, cursos: { inseridos: 0, atualizados: 0 }, erros: 0 }

  console.log('[COLETOR INEP] Lendo IES...')
  const linhasIES = await lerCSVEmLinhas(CAMINHO_IES)
  const dadosIES = parseLinhas(linhasIES)
  console.log(`[COLETOR INEP] ${dadosIES.length} IES encontradas`)

  const stmtExisteIES = banco.prepare('SELECT id FROM instituicoes WHERE codigo_ies = ?')
  const stmtAtualizarIES = banco.prepare(`UPDATE instituicoes SET nome=COALESCE(?,nome), sigla=COALESCE(?,sigla), cidade=COALESCE(?,cidade), estado=COALESCE(?,estado), categoria_administrativa=COALESCE(?,categoria_administrativa), tipo_instituicao=COALESCE(?,tipo_instituicao), coletado_em=datetime('now','localtime'), updated_at=datetime('now','localtime') WHERE codigo_ies=?`)
  const stmtInserirIES = banco.prepare(`INSERT INTO instituicoes (nome,sigla,cidade,estado,categoria_administrativa,tipo_instituicao,codigo_ies,fonte_url,coletado_em) VALUES (?,?,?,?,?,?,?,?,datetime('now','localtime'))`)

  const txIES = banco.transaction(() => {
    for (const ies of dadosIES) {
      const codigoIes = ies.CO_IES
      if (!codigoIes) continue
      const nome = ies.NO_IES || '', sigla = ies.SG_IES || '', cidade = ies.NO_MUNICIPIO_IES || '', uf = normalizarUF(ies.SG_UF_IES)
      const cat = MAPA_CATEGORIA[parseInt(ies.TP_CATEGORIA_ADMINISTRATIVA)] || 'privada'
      const tipo = MAPA_ORG_ACADEMICA[parseInt(ies.TP_ORGANIZACAO_ACADEMICA)] || 'outra'
      const existente = stmtExisteIES.get(String(codigoIes))
      if (existente) { stmtAtualizarIES.run(nome, sigla, cidade, uf, cat, tipo, String(codigoIes)); stats.instituicoes.atualizados++ }
      else { stmtInserirIES.run(nome, sigla, cidade, uf, cat, tipo, String(codigoIes), 'INEP_Microdados_2023'); stats.instituicoes.inseridos++ }
    }
  })
  txIES()

  console.log(`[COLETOR INEP] IES: ${stats.instituicoes.inseridos} inseridas, ${stats.instituicoes.atualizados} atualizadas`)

  console.log('[COLETOR INEP] Lendo cursos (streaming)...')
  const rl = readline.createInterface({ input: fs.createReadStream(CAMINHO_CURSOS, { encoding: 'latin1' }), crlfDelay: Infinity })

  let primeiraLinha = true
  let cabecalho = []
  let mapaIdx = {}
  let contadorCursos = 0
  let batchCampi = []
  let batchCursos = []

  const stmtExisteIES2 = banco.prepare('SELECT id FROM instituicoes WHERE codigo_ies = ?')
  const stmtExisteCurso = banco.prepare('SELECT id FROM cursos WHERE codigo_curso = ? AND instituicao_id = ?')
  const stmtInserirCurso = banco.prepare(`INSERT INTO cursos (instituicao_id,codigo_curso,nome,grau,modalidade,turno,cidade,uf,codigo_municipio_ibge,fonte_url,coletado_em) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now','localtime'))`)
  const stmtAtualizarCurso = banco.prepare(`UPDATE cursos SET nome=COALESCE(?,nome),grau=COALESCE(?,grau),modalidade=COALESCE(?,modalidade),turno=COALESCE(?,turno),cidade=COALESCE(?,cidade),uf=COALESCE(?,uf),codigo_municipio_ibge=COALESCE(?,codigo_municipio_ibge),coletado_em=datetime('now','localtime'),updated_at=datetime('now','localtime') WHERE id=?`)
  const stmtExisteCampus = banco.prepare('SELECT id FROM campi WHERE instituicao_id = ? AND codigo_municipio_ibge = ?')
  const stmtInserirCampus = banco.prepare(`INSERT INTO campi (instituicao_id,nome,codigo_municipio_ibge,cidade,uf,fonte_url,coletado_em) VALUES (?,?,?,?,?,?,datetime('now','localtime'))`)
  const stmtAtualizarCampus = banco.prepare(`UPDATE campi SET nome=COALESCE(?,nome),cidade=COALESCE(?,cidade),uf=COALESCE(?,uf),coletado_em=datetime('now','localtime'),updated_at=datetime('now','localtime') WHERE id=?`)

  const campusMap = new Map()

  const processarBatch = banco.transaction(() => {
    for (const c of batchCursos) {
      try {
        const exIes = stmtExisteIES2.get(String(c.co_ies))
        if (!exIes) { stats.erros++; continue }
        const exCurso = stmtExisteCurso.get(String(c.codigo_curso), exIes.id)
        if (exCurso) { stmtAtualizarCurso.run(c.nome, c.grau, c.modalidade, c.turno, c.cidade, c.uf, c.codigo_municipio_ibge, exCurso.id); stats.cursos.atualizados++ }
        else { stmtInserirCurso.run(exIes.id, String(c.codigo_curso), c.nome, c.grau, c.modalidade, c.turno, c.cidade, c.uf, c.codigo_municipio_ibge, 'INEP_Microdados_2023'); stats.cursos.inseridos++ }
      } catch (e) { stats.erros++ }
    }
    batchCursos = []
  })

  const processarBatchCampi = banco.transaction(() => {
    for (const c of batchCampi) {
      try {
        const exIes = stmtExisteIES2.get(String(c.co_ies))
        if (!exIes) continue
        const exCampus = stmtExisteCampus.get(exIes.id, c.codigo_municipio_ibge)
        if (exCampus) { stmtAtualizarCampus.run(c.nome, c.cidade, c.uf, exCampus.id); stats.campi.atualizados++ }
        else { stmtInserirCampus.run(exIes.id, c.nome, c.codigo_municipio_ibge, c.cidade, c.uf, 'INEP_Microdados_2023'); stats.campi.inseridos++ }
      } catch (e) { stats.erros++ }
    }
    batchCampi = []
  })

  for await (const linha of rl) {
    if (primeiraLinha) {
      cabecalho = linha.split(';').map(c => c.trim().replace(/"/g, ''))
      cabecalho.forEach((c, i) => { mapaIdx[c] = i })
      primeiraLinha = false
      continue
    }

    const v = linha.split(';').map(x => x.trim().replace(/"/g, ''))
    const get = (campo) => v[mapaIdx[campo]] || ''

    const coIes = get('CO_IES')
    const nomeCurso = get('NO_CURSO')
    const coCurso = get('CO_CURSO')
    const modalidade = MAPA_MODALIDADE[parseInt(get('TP_MODALIDADE_ENSINO'))] || 'presencial'
    const grau = MAPA_GRAU[parseInt(get('TP_GRAU_ACADEMICO'))] || 'Bacharelado'
    const uf = normalizarUF(get('SG_UF'))
    const municipio = get('NO_MUNICIPIO')
    const ibge = get('CO_MUNICIPIO')
    const turno = (parseInt(get('QT_VG_TOTAL_DIURNO')) || 0) > 0 && (parseInt(get('QT_VG_TOTAL_NOTURNO')) || 0) > 0 ? 'Integral' : (parseInt(get('QT_VG_TOTAL_NOTURNO')) || 0) > 0 ? 'Noturno' : 'Matutino'

    if (coIes && coCurso && nomeCurso) {
      batchCursos.push({ co_ies: coIes, codigo_curso: coCurso, nome: nomeCurso, grau, modalidade, turno, cidade: municipio, uf, codigo_municipio_ibge: ibge })
      contadorCursos++
    }

    if (coIes && ibge) {
      const chave = `${coIes}_${ibge}`
      if (!campusMap.has(chave)) {
        campusMap.set(chave, { co_ies: coIes, nome: municipio, codigo_municipio_ibge: ibge, cidade: municipio, uf })
      }
    }

    if (batchCursos.length >= 2000) { processarBatch() }
  }

  if (batchCursos.length > 0) { processarBatch() }

  console.log(`[COLETOR INEP] ${contadorCursos} cursos processados`)

  const campiArray = Array.from(campusMap.values())
  for (let i = 0; i < campiArray.length; i += 2000) {
    batchCampi = campiArray.slice(i, i + 2000)
    processarBatchCampi()
  }

  console.log(`[COLETOR INEP] Campi: ${stats.campi.inseridos} inseridos, ${stats.campi.atualizados} atualizados`)
  console.log(`[COLETOR INEP] Cursos: ${stats.cursos.inseridos} inseridos, ${stats.cursos.atualizados} atualizados`)

  const totalInseridos = stats.instituicoes.inseridos + stats.campi.inseridos + stats.cursos.inseridos
  const totalAtualizados = stats.instituicoes.atualizados + stats.campi.atualizados + stats.cursos.atualizados
  const status = stats.erros === 0 ? 'sucesso' : 'parcial'
  log.finalizarExecucao(execucaoId, status, { processados: contadorCursos, inseridos: totalInseridos, atualizados: totalAtualizados, erros: stats.erros, observacoes: '' })

  console.log(`[COLETOR INEP] Concluído: ${totalInseridos} inseridos, ${totalAtualizados} atualizados`)
  return stats
}

module.exports = { coletar }
