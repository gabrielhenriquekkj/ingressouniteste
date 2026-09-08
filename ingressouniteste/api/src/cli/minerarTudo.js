#!/usr/bin/env node
const coletorCatalogo = require('../mineracao/coletores/coletorCatalogo')
const coletorSisu = require('../mineracao/coletores/coletorSisu')
const coletorCustoVida = require('../mineracao/coletores/coletorCustoVida')
const coletorAuxilios = require('../mineracao/coletores/coletorAuxilios')
const coletorMercado = require('../mineracao/coletores/coletorMercado')

async function executar() {
  const inicio = Date.now()
  console.log('=====================================')
  console.log('  MINERAÇÃO COMPLETA - INGRESSO')
  console.log('  UNIVERSITÁRIO')
  console.log('=====================================')
  console.log('')

  const stats = { processados: 0, inseridos: 0, atualizados: 0, erros: 0, ignorados: 0 }

  // Etapa 1: Catalogo
  console.log(' Etapa 1/6: Catálogo (instituições, campi, cursos)')
  try {
    const catalogo = await coletorCatalogo.coletar()
    stats.processados += catalogo.processados
    stats.inseridos += catalogo.inseridos
    stats.atualizados += catalogo.atualizados
    stats.erros += catalogo.erros
  } catch (e) {
    console.error('  Erro no catálogo:', e.message)
    stats.erros++
  }

  // Etapa 2: SiSU (multi-anos)
  console.log('')
  console.log(' Etapa 2/6: Notas de corte SiSU (todos os anos)')
  try {
    const sisu = await coletorSisu.coletarTodosAnos()
    for (const resultado of Object.values(sisu)) {
      stats.inseridos += resultado.inseridos || 0
      stats.atualizados += resultado.atualizados || 0
      stats.erros += resultado.erros || 0
    }
  } catch (e) {
    console.error('  Erro no SiSU:', e.message)
    stats.erros++
  }

  // Etapa 3: Custos
  console.log('')
  console.log(' Etapa 3/6: Indicadores econômicos por cidade')
  try {
    const custos = await coletorCustoVida.coletar()
    stats.processados += custos.processados
    stats.inseridos += custos.inseridos
    stats.atualizados += custos.atualizados
    stats.ignorados += custos.ignorados
    stats.erros += custos.erros
  } catch (e) {
    console.error('  Erro nos custos:', e.message)
    stats.erros++
  }

  // Etapa 4: Auxilios
  console.log('')
  console.log(' Etapa 4/6: Auxílios e bolsas')
  try {
    const auxilios = coletorAuxilios.coletar()
    stats.inseridos += auxilios.inseridos
    stats.erros += auxilios.erros
  } catch (e) {
    console.error('  Erro nos auxílios:', e.message)
    stats.erros++
  }

  // Etapa 5: Mercado
  console.log('')
  console.log(' Etapa 5/6: Mercado de trabalho e estágios')
  try {
    const mercado = coletorMercado.coletar()
    stats.inseridos += mercado.inseridos
    stats.atualizados += mercado.atualizados
    stats.erros += mercado.erros
  } catch (e) {
    console.error('  Erro no mercado:', e.message)
    stats.erros++
  }

  // Etapa 6: Relatorio
  console.log('')
  console.log(' Etapa 6/6: Relatório')
  try {
    const b = require('../configuracoes/conexaoBanco')
    const rel = {
      instituicoes: b.prepare('SELECT COUNT(*) as n FROM instituicoes WHERE ativo = 1').get().n,
      campi: b.prepare('SELECT COUNT(*) as n FROM campi').get().n,
      cursos: b.prepare('SELECT COUNT(*) as n FROM cursos').get().n,
      notas: b.prepare('SELECT COUNT(*) as n FROM notas_corte').get().n,
      custos: b.prepare('SELECT COUNT(*) as n FROM custos_cidade').get().n,
      auxilios: b.prepare('SELECT COUNT(*) as n FROM auxilios_bolsas').get().n,
      mercado: b.prepare('SELECT COUNT(*) as n FROM mercado_estagios').get().n
    }
    console.log(`  Instituições: ${rel.instituicoes}`)
    console.log(`  Campi: ${rel.campi}`)
    console.log(`  Cursos: ${rel.cursos}`)
    console.log(`  Notas de corte: ${rel.notas}`)
    console.log(`  Custos/indicadores: ${rel.custos}`)
    console.log(`  Auxílios/bolsas: ${rel.auxilios}`)
    console.log(`  Mercado/estágios: ${rel.mercado}`)
  } catch (e) {
    console.error('  Erro no relatório:', e.message)
  }

  const duracao = ((Date.now() - inicio) / 1000).toFixed(1)

  console.log('')
  console.log('=====================================')
  console.log('  MINERAÇÃO CONCLUÍDA')
  console.log('=====================================')
  console.log(`  Inseridos:   ${stats.inseridos}`)
  console.log(`  Atualizados: ${stats.atualizados}`)
  console.log(`  Ignorados:   ${stats.ignorados}`)
  console.log(`  Erros:       ${stats.erros}`)
  console.log(`  Duração:     ${duracao}s`)
  console.log(`  Status:      ${stats.erros === 0 ? 'SUCESSO' : 'ERROS'}`)
  console.log('=====================================')

  process.exit(stats.erros > 0 ? 1 : 0)
}

executar()
