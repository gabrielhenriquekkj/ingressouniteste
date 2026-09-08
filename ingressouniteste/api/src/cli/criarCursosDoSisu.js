const fs = require('fs')
const path = require('path')
const readline = require('readline')
const Database = require('better-sqlite3')

const db = new Database('./db/ingresso.db')
const TEMP_DIR = path.resolve(__dirname, '../../temp')

function normalizarSigla(s) { return (s || '').trim().toUpperCase() }
function normalizarUF(u) { return (u || '').trim().toUpperCase() }

async function main() {
  const mapaInst = new Map()
  const todasInst = db.prepare('SELECT id, sigla, estado FROM instituicoes').all()
  for (const inst of todasInst) { mapaInst.set(normalizarSigla(inst.sigla) + '|' + normalizarUF(inst.estado), inst.id) }

  const campusSet = new Map()
  const cursosSet = new Map()

  for (const ano of [2023, 2024]) {
    const caminho = path.join(TEMP_DIR, `sisu_grades_${ano}.csv`)
    if (!fs.existsSync(caminho)) { console.log(`[${ano}] Sem arquivo`); continue }
    console.log(`[${ano}] Lendo...`)
    const rl = readline.createInterface({ input: fs.createReadStream(caminho, { encoding: 'utf-8' }), crlfDelay: Infinity })
    let count = 0
    for await (const linha of rl) {
      count++
      const c = linha.split(';')
      if (c.length < 11) continue
      const uf = c[7] ? c[7].replace(/"/g, '').trim() : ''
      const sigla = c[9] ? c[9].replace(/"/g, '').trim() : ''
      const campus = c[5] ? c[5].replace(/"/g, '').trim() : ''
      const cidade = c[6] ? c[6].replace(/"/g, '').trim() : ''
      const nomeCurso = c[1] ? c[1].replace(/"/g, '').trim() : ''
      if (!nomeCurso || !sigla || !campus || !cidade || !uf) continue
      const instId = mapaInst.get(normalizarSigla(sigla) + '|' + normalizarUF(uf))
      if (!instId) continue
      const ck = `${instId}_${campus}`
      if (!campusSet.has(ck)) campusSet.set(ck, { instituicao_id: instId, nome: campus, codigo_municipio_ibge: null, cidade, uf, fonte_url: `sisu_${ano}` })
      const nk = `${instId}_${nomeCurso}`
      if (!cursosSet.has(nk)) cursosSet.set(nk, { instituicao_id: instId, nome: nomeCurso, grau: c[2] ? c[2].replace(/"/g, '').trim() : '', turno: c[3] ? c[3].replace(/"/g, '').trim() : '', cidade, uf })
    }
    console.log(`[${ano}] ${count} linhas, ${campusSet.size} campi únicos, ${cursosSet.size} cursos únicos`)
  }

  const stmtCampusExiste = db.prepare('SELECT id FROM campi WHERE instituicao_id = ? AND nome = ?')
  const stmtCampusInserir = db.prepare('INSERT INTO campi (instituicao_id,nome,codigo_municipio_ibge,cidade,uf,fonte_url,coletado_em) VALUES (?,?,?,?,?,?,datetime(\'now\',\'localtime\'))')
  const stmtCursoExiste = db.prepare('SELECT id FROM cursos WHERE nome = ? AND instituicao_id = ?')
  const stmtCursoInserir = db.prepare('INSERT INTO cursos (instituicao_id,campus_id,nome,grau,modalidade,turno,cidade,uf,fonte_url,coletado_em) VALUES (?,?,?,?,?,?,?,?,?,datetime(\'now\',\'localtime\'))')

  const campusArr = Array.from(campusSet.values())
  const cursoArr = Array.from(cursosSet.values())

  let campusInseridos = 0
  let cursoInseridos = 0

  const txCampus = db.transaction(() => {
    for (const c of campusArr) {
      const ex = stmtCampusExiste.get(c.instituicao_id, c.nome)
      if (!ex) { stmtCampusInserir.run(c.instituicao_id, c.nome, c.codigo_municipio_ibge, c.cidade, c.uf, c.fonte_url); campusInseridos++ }
    }
  })
  txCampus()

  const campusPorInst = new Map()
  const campiTodos = db.prepare('SELECT id, instituicao_id, nome FROM campi').all()
  for (const cp of campiTodos) {
    if (!campusPorInst.has(cp.instituicao_id)) campusPorInst.set(cp.instituicao_id, [])
    campusPorInst.get(cp.instituicao_id).push({ id: cp.id, nome: cp.nome })
  }

  const txCursos = db.transaction(() => {
    for (const curso of cursoArr) {
      const ex = stmtCursoExiste.get(curso.nome, curso.instituicao_id)
      if (ex) continue
      const campusList = campusPorInst.get(curso.instituicao_id) || []
      const campusMatch = campusList.find(c => c.nome.toLowerCase().includes(normalizarSigla(curso.cidade).substring(0, 20)))
      const campusId = campusMatch ? campusMatch.id : (campusList.length > 0 ? campusList[0].id : null)
      stmtCursoInserir.run(curso.instituicao_id, campusId, curso.nome, curso.grau, '', curso.turno || null, curso.cidade, curso.uf, 'sisu_final')
      cursoInseridos++
    }
  })
  txCursos()

  const tc = db.prepare('SELECT COUNT(*) as n FROM cursos').get()
  const tp = db.prepare('SELECT COUNT(*) as n FROM campi').get()
  console.log(`Cursos criados: ${cursoInseridos}, Campi criados: ${campusInseridos}`)
  console.log(`Total: ${tp.n} campi, ${tc.n} cursos`)
  db.close()
}

main().catch(e => { console.error(e); process.exit(1) })
