const coletorInstituicoes = require('./coletorInstituicoes')
const coletorINEP = require('./coletorINEP')
const coletorSisu = require('./coletorSisu')

async function coletar() {
  console.log('=== COLETOR DE CATÁLOGO ===')
  console.log('Etapa 1/3: Instituições (GitHub CSV)')
  const instStats = await coletorInstituicoes.coletar()

  console.log('Etapa 2/3: Campi + Cursos (INEP Microdados)')
  const inepStats = await coletorINEP.coletar()

  console.log('Etapa 3/3: Notas de Corte (SiSU)')
  const sisuStats = await coletorSisu.coletar()

  const stats = {
    processados: instStats.processados + (inepStats.processados || 0),
    inseridos: instStats.inseridos + (inepStats.instituicoes?.inseridos || 0) + (inepStats.campi?.inseridos || 0) + (inepStats.cursos?.inseridos || 0) + (sisuStats.inseridos || 0),
    atualizados: instStats.atualizados + (inepStats.instituicoes?.atualizados || 0) + (inepStats.campi?.atualizados || 0) + (inepStats.cursos?.atualizados || 0) + (sisuStats.atualizados || 0),
    erros: instStats.erros + (inepStats.erros || 0) + (sisuStats.erros || 0),
    ignorados: instStats.ignorados || 0,
    observacoes: [instStats.observacoes, inepStats.observacoes, sisuStats.observacoes].filter(Boolean).join(' | ')
  }

  console.log('=== CATÁLOGO CONCLUÍDO ===')
  console.log(`Total: ${stats.inseridos} inseridos, ${stats.atualizados} atualizados, ${stats.erros} erros`)
  return stats
}

module.exports = { coletar }
