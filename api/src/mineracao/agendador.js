const cron = require('node-cron')
const coletorCatalogo = require('./coletores/coletorCatalogo')
const coletorSisu = require('./coletores/coletorSisu')
const coletorCustoVida = require('./coletores/coletorCustoVida')

const tarefas = []

function iniciar() {
  if (process.env.MINERACAO_ENABLED !== 'true') {
    console.log('[AGENDADOR] Mineração desabilitada (MINERACAO_ENABLED != true)')
    return
  }

  const cronCatalogo = process.env.MINERACAO_CRON_CATALOGO || '0 3 1 * *'
  const cronSisu = process.env.MINERACAO_CRON_SISU || '0 4 * * 1'
  const cronCustos = process.env.MINERACAO_CRON_CUSTOS || '0 5 1 * *'

  if (cron.validate(cronCatalogo)) {
    const tarefa = cron.schedule(cronCatalogo, async () => {
      console.log('[AGENDADOR] Executando mineração de catálogo...')
      try { await coletorCatalogo.coletar() } catch (e) { console.error('[AGENDADOR] Erro no catálogo:', e.message) }
    })
    tarefas.push(tarefa)
    console.log(`[AGENDADOR] Catálogo agendado: ${cronCatalogo}`)
  }

  if (cron.validate(cronSisu)) {
    const tarefa = cron.schedule(cronSisu, async () => {
      console.log('[AGENDADOR] Executando mineração SiSU...')
      try { await coletorSisu.coletar() } catch (e) { console.error('[AGENDADOR] Erro no SiSU:', e.message) }
    })
    tarefas.push(tarefa)
    console.log(`[AGENDADOR] SiSU agendado: ${cronSisu}`)
  }

  if (cron.validate(cronCustos)) {
    const tarefa = cron.schedule(cronCustos, async () => {
      console.log('[AGENDADOR] Executando mineração de custos...')
      try { await coletorCustoVida.coletar() } catch (e) { console.error('[AGENDADOR] Erro nos custos:', e.message) }
    })
    tarefas.push(tarefa)
    console.log(`[AGENDADOR] Custos agendados: ${cronCustos}`)
  }

  console.log(`[AGENDADOR] ${tarefas.length} tarefas agendadas`)
}

function parar() {
  tarefas.forEach(t => t.stop())
  tarefas.length = 0
  console.log('[AGENDADOR] Tarefas paradas')
}

module.exports = { iniciar, parar }
