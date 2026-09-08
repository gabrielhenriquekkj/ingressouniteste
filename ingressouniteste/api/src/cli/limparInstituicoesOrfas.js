const db = require('../configuracoes/conexaoBanco')
const path = require('path')
const fs = require('fs')

const args = process.argv.slice(2)
const confirmar = args.includes('--confirmar')
const dryRun = !confirmar

const SELECT_ORFAS = `
  SELECT i.id, i.nome, i.sigla
  FROM instituicoes i
  WHERE NOT EXISTS (
    SELECT 1 FROM cursos c WHERE c.instituicao_id = i.id
  )
`

const orfas = db.prepare(SELECT_ORFAS).all()

console.log(`\n=== Limpeza de Instituicoes Orfas ===`)
console.log(`Modo: ${dryRun ? 'DRY-RUN (nenhum dado sera alterado)' : 'CONFIRMAR (exclusao real)'}`)
console.log(`Instituicoes candidatas a exclusao: ${orfas.length}\n`)

if (orfas.length === 0) {
  console.log('Nenhuma instituicao orfa encontrada. Nada a fazer.')
  process.exit(0)
}

console.log('--- Amostra (primeiras 20) ---')
orfas.slice(0, 20).forEach((inst, i) => {
  console.log(`  ${i + 1}. [${inst.id}] ${inst.nome} (${inst.sigla || 's/ sigla'})`)
})

if (orfas.length > 20) {
  console.log(`  ... e mais ${orfas.length - 20} instituicoes.\n`)
}

if (dryRun) {
  console.log('\nNenhuma exclusao realizada (dry-run).')
  console.log('Para confirmar a exclusao, execute:')
  console.log('  node src/cli/limparInstituicoesOrfas.js --confirmar')
  process.exit(0)
}

// Backup do banco
const dbDir = path.resolve(__dirname, '../../db')
const backupDir = path.join(dbDir, 'backup')
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })

const arquivos = fs.readdirSync(dbDir).filter(f => f.endsWith('.db') || f.endsWith('.db-wal') || f.endsWith('.db-shm'))
arquivos.forEach(arq => {
  const src = path.join(dbDir, arq)
  const dst = path.join(backupDir, arq)
  fs.copyFileSync(src, dst)
  console.log(`Backup: ${arq} -> backup/${arq}`)
})

// Excluir em cascata (respeitar foreign keys)
const deletarAuxilios = db.prepare('DELETE FROM auxilios_bolsas WHERE instituicao_id = ?')
const deletarInstituicao = db.prepare('DELETE FROM instituicoes WHERE id = ?')

const excluir = db.transaction(() => {
  let count = 0
  for (const inst of orfas) {
    deletarAuxilios.run(inst.id)
    deletarInstituicao.run(inst.id)
    count++
  }
  return count
})

const excluidas = excluir()
console.log(`\n${excluidas} instituicoes orfas excluidas com sucesso.`)
console.log('Backup do banco salvo em: api/db/backup/')
