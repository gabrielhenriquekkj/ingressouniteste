#!/usr/bin/env node
const coletorSisu = require('../mineracao/coletores/coletorSisu')

console.log('=== MINERAR: SISU ===')
console.log('Coletando notas de corte do SiSU...')
console.log('')

coletorSisu.coletar()
  .then(stats => {
    console.log('')
    console.log('=====================================')
    console.log('MINERAÇÃO SISU CONCLUÍDA')
    console.log('=====================================')
    console.log(`Processados: ${stats.processados}`)
    console.log(`Inseridos:   ${stats.inseridos}`)
    console.log(`Atualizados: ${stats.atualizados}`)
    console.log(`Erros:       ${stats.erros}`)
    console.log('=====================================')
    process.exit(0)
  })
  .catch(erro => {
    console.error('Erro fatal na mineração SiSU:', erro.message)
    process.exit(1)
  })
