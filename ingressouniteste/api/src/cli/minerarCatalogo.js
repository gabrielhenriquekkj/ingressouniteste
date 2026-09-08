#!/usr/bin/env node
const coletorCatalogo = require('../mineracao/coletores/coletorCatalogo')

console.log('=== MINERAR: CATÁLOGO ===')
console.log('Coletando instituições, campi e cursos...')
console.log('')

coletorCatalogo.coletar()
  .then(stats => {
    console.log('')
    console.log('=====================================')
    console.log('MINERAÇÃO DE CATÁLOGO CONCLUÍDA')
    console.log('=====================================')
    console.log(`Processados: ${stats.processados}`)
    console.log(`Inseridos:   ${stats.inseridos}`)
    console.log(`Atualizados: ${stats.atualizados}`)
    console.log(`Erros:       ${stats.erros}`)
    console.log(`Ignorados:   ${stats.ignorados}`)
    console.log('=====================================')
    process.exit(0)
  })
  .catch(erro => {
    console.error('Erro fatal na mineração:', erro.message)
    process.exit(1)
  })
