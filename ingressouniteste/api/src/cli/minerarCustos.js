#!/usr/bin/env node
const coletorCustoVida = require('../mineracao/coletores/coletorCustoVida')

console.log('=== MINERAR: CUSTOS ===')
console.log('Coletando custo de vida por cidade...')
console.log('')

coletorCustoVida.coletar()
  .then(stats => {
    console.log('')
    console.log('=====================================')
    console.log('MINERAÇÃO DE CUSTOS CONCLUÍDA')
    console.log('=====================================')
    console.log(`Processados: ${stats.processados}`)
    console.log(`Inseridos:   ${stats.inseridos}`)
    console.log(`Atualizados: ${stats.atualizados}`)
    console.log(`Ignorados:   ${stats.ignorados}`)
    console.log(`Erros:       ${stats.erros}`)
    console.log('=====================================')
    process.exit(0)
  })
  .catch(erro => {
    console.error('Erro fatal na mineração de custos:', erro.message)
    process.exit(1)
  })
