const fs = require('fs')
const path = require('path')
const db = require('../configuracoes/conexaoBanco')

const caminho = path.resolve(__dirname, '../../../doc/Sisu2026.csv.csv')
const conteudo = fs.readFileSync(caminho, 'latin1')
const linhas = conteudo.split('\n').filter(l => l.trim())

console.log(`=== Importar SiSU 2026 ===`)
console.log(`Registros no CSV: ${linhas.length - 1}\n`)

// Parse CSV
function parseLinha(linha) {
  const resultado = []
  let atual = ''
  let entreAspas = false
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"') { entreAspas = !entreAspas; continue }
    if (c === ';' && !entreAspas) { resultado.push(atual.trim()); atual = ''; continue }
    atual += c
  }
  resultado.push(atual.trim())
  return resultado
}

function limparCodigo(str) {
  if (!str) return null
  return str.replace(/\./g, '').trim()
}

function parseNota(str) {
  if (!str || str === '0') return null
  return parseFloat(str.replace(',', '.'))
}

function parseNum(str) {
  if (!str) return 0
  return Number(str.replace(/\./g, '').replace(',', '.')) || 0
}

function normalizarTurno(turno) {
  if (!turno) return null
  const t = turno.toLowerCase()
  if (t.includes('matutino') || t.includes('manha')) return 'Matutino'
  if (t.includes('vespertino') || t.includes('tarde')) return 'Vespertino'
  if (t.includes('noturno')) return 'Noturno'
  if (t.includes('integral') || t.includes('completo')) return 'Integral'
  return turno
}

function normalizarGrau(grau) {
  if (!grau) return 'Bacharelado'
  const g = grau.toLowerCase()
  if (g.includes('tecnolog')) return 'Tecnologico'
  if (g.includes('licenciatura')) return 'Licenciatura'
  if (g.includes('bacharelado')) return 'Bacharelado'
  return grau
}

// IEs existentes no banco
const instBanco = db.prepare('SELECT id, codigo_ies, nome FROM instituicoes').all()
const mapaCodigoIes = {}
instBanco.forEach(i => { if (i.codigo_ies) mapaCodigoIes[i.codigo_ies] = i })

// Preparar statements
const stmtExisteIES = db.prepare('SELECT id FROM instituicoes WHERE codigo_ies = ?')
const stmtInserirIES = db.prepare(`INSERT INTO instituicoes (nome, sigla, cidade, estado, categoria_administrativa, tipo_instituicao, codigo_ies, fonte_url, coletado_em) VALUES (?, ?, ?, ?, ?, ?, ?, 'SiSU_2026', datetime('now','localtime'))`)

const stmtExisteCurso = db.prepare('SELECT id FROM cursos WHERE codigo_curso = ? AND instituicao_id = ?')
const stmtInserirCurso = db.prepare(`INSERT INTO cursos (instituicao_id, codigo_curso, nome, grau, modalidade, turno, cidade, uf, fonte_url, coletado_em) VALUES (?, ?, ?, ?, 'presencial', ?, ?, ?, 'SiSU_2026', datetime('now','localtime'))`)
const stmtAtualizarCurso = db.prepare(`UPDATE cursos SET nome=COALESCE(?,nome), grau=COALESCE(?,grau), turno=COALESCE(?,turno), coletado_em=datetime('now','localtime'), updated_at=datetime('now','localtime') WHERE id=?`)

const stmtExisteNota = db.prepare('SELECT id FROM notas_corte WHERE curso_id = ? AND ano = ? AND modalidade_acesso = ?')
const stmtInserirNota = db.prepare(`INSERT INTO notas_corte (curso_id, modalidade_acesso, nota_corte, ano, chamada, fonte_url, coletado_em) VALUES (?, ?, ?, ?, 1, 'SiSU_2026', datetime('now','localtime'))`)
const stmtAtualizarNota = db.prepare(`UPDATE notas_corte SET nota_corte=COALESCE(?,nota_corte), coletado_em=datetime('now','localtime'), updated_at=datetime('now','localtime') WHERE id=?`)

// Processar
let iesInseridas = 0, iesAtualizadas = 0
let cursosInseridos = 0, cursosAtualizados = 0
let notasInseridas = 0, notasAtualizadas = 0, notasSkipped = 0
let erros = 0

const importar = db.transaction(() => {
  for (let i = 1; i < linhas.length; i++) {
    try {
      const cols = parseLinha(linhas[i])
      if (cols.length < 21) continue

      const codigoIes = limparCodigo(cols[1])
      const nomeIes = cols[2]
      const siglaIes = cols[3]
      const catAdm = cols[5].includes('stadual') ? 'estadual' : cols[5].includes('unicipal') ? 'municipal' : cols[5].includes('blica') ? 'federal' : 'outra'
      const municipio = cols[7]
      const uf = cols[8]
      const codigoCurso = limparCodigo(cols[10])
      const nomeCurso = cols[11]
      const grau = normalizarGrau(cols[12])
      const turno = normalizarTurno(cols[13])
      const codConcorrencia = cols[16]
      const bonus = parseFloat(cols[17]) || 0
      const vagas = parseNum(cols[18])
      const notaCorte = parseNota(cols[19])
      const inscritos = parseNum(cols[20])

      // 1. Garantir que a IES existe
      let iesId = null
      const existente = stmtExisteIES.get(codigoIes)
      if (existente) {
        iesId = existente.id
        iesAtualizadas++
      } else {
        let tipoInstituicao = 'outra'
        const orgLower = cols[4].toLowerCase()
        if (orgLower.includes('instituto federal')) tipoInstituicao = 'instituto_federal'
        else if (orgLower.includes('cefet') || orgLower.includes('centro federal')) tipoInstituicao = 'cefet'
        else if (orgLower.includes('universidade')) tipoInstituicao = 'universidade'
        else if (orgLower.includes('centro universit')) tipoInstituicao = 'centro_universitario'
        else if (orgLower.includes('faculdade')) tipoInstituicao = 'faculdade'

        const resultado = stmtInserirIES.run(nomeIes, siglaIes, municipio, uf, catAdm, tipoInstituicao, codigoIes)
        iesId = resultado.lastInsertRowid
        iesInseridas++
      }

      if (!iesId || !codigoCurso) continue

      // 2. Garantir que o curso existe
      let cursoId = null
      const existCurso = stmtExisteCurso.get(codigoCurso, iesId)
      if (existCurso) {
        cursoId = existCurso.id
        stmtAtualizarCurso.run(nomeCurso, grau, turno, cursoId)
        cursosAtualizados++
      } else {
        const resultado = stmtInserirCurso.run(iesId, codigoCurso, nomeCurso, grau, turno, municipio, uf)
        cursoId = resultado.lastInsertRowid
        cursosInseridos++
      }

      if (!cursoId) continue

      // 3. Inserir nota de corte
      if (notaCorte && notaCorte > 0) {
        const existNota = stmtExisteNota.get(cursoId, 2026, codConcorrencia)
        if (existNota) {
          stmtAtualizarNota.run(notaCorte, existNota.id)
          notasAtualizadas++
        } else {
          stmtInserirNota.run(cursoId, codConcorrencia, notaCorte, 2026)
          notasInseridas++
        }
      } else {
        notasSkipped++
      }

    } catch (e) {
      erros++
      if (erros <= 5) console.error(`  Erro linha ${i}: ${e.message}`)
    }
  }
})

importar()

console.log(`\n=== Resultado ===`)
console.log(`IES: ${iesInseridas} inseridas, ${iesAtualizadas} atualizadas`)
console.log(`Cursos: ${cursosInseridos} inseridos, ${cursosAtualizados} atualizados`)
console.log(`Notas de corte: ${notasInseridas} inseridas, ${notasAtualizadas} atualizadas, ${notasSkipped} sem nota`)
console.log(`Erros: ${erros}`)
console.log(`\nConcluido!`)
