const axios = require('axios')
const { normalizarUF } = require('../normalizadores/normalizarInstituicao')
const log = require('../log/execucoesMineracao')
const banco = require('../../configuracoes/conexaoBanco')

const URL_EMEC_CAMPUS = 'https://emec.mec.gov.br/emec/consult-public/list-campi/json'

async function buscarDado(url, timeout = 30000) {
  const resposta = await axios.get(url, {
    timeout,
    headers: { 'User-Agent': 'IngressoUniversitario/1.0 (projeto-academico)' },
    responseType: 'text'
  })
  return resposta.data
}

function parseCampi(dados, mapaInstituicoes) {
  if (!Array.isArray(dados)) return []

  const campi = []
  for (const item of dados) {
    const nomeCampus = item.nome_campus || item.nome || ''
    const codigoIes = item.co_ies || item.codigo_ies || ''
    const cidade = item.municipio || item.nome_municipio || ''
    const uf = item.uf || item.sigla_uf || ''
    const codigoIbge = item.cod_municipio_ibge || item.codigo_municipio_ibge || ''
    const endereco = item.endereco || ''
    const site = item.site_campus || ''

    if (!nomeCampus || !codigoIes) continue

    const instituicao = mapaInstituicoes.get(String(codigoIes))

    campi.push({
      instituicao_id: instituicao ? instituicao.id : null,
      nome: nomeCampus.trim(),
      codigo_campus: item.co_campus || null,
      codigo_municipio_ibge: codigoIbge || null,
      cidade: cidade.trim(),
      uf: normalizarUF(uf),
      endereco: endereco.trim() || null,
      site_oficial: site.trim() || null,
      fonte_url: URL_EMEC_CAMPUS,
      coletado_em: new Date().toISOString()
    })
  }

  return campi.filter(c => c.instituicao_id !== null)
}

async function coletar() {
  const execucaoId = log.registrarExecucao('campi')
  const stats = { processados: 0, inseridos: 0, atualizados: 0, erros: 0, ignorados: 0, observacoes: '' }

  console.log('[COLETOR CAMPI] Iniciando coleta...')

  try {
    const dados = await buscarDado(URL_EMEC_CAMPUS)
    const json = typeof dados === 'string' ? JSON.parse(dados) : dados

    // Pre-carregar mapa de instituicoes por codigo_ies para eliminar N+1
    const todasInstituicoes = banco.prepare('SELECT codigo_ies, id FROM instituicoes').all()
    const mapaInstituicoes = new Map()
    for (const inst of todasInstituicoes) {
      if (inst.codigo_ies) mapaInstituicoes.set(String(inst.codigo_ies), inst)
    }

    const campi = parseCampi(json, mapaInstituicoes)
    console.log(`[COLETOR CAMPI] Encontrados ${campi.length} campi`)
    stats.processados = campi.length

    const { persistirCampi } = require('../persistencia/persistirMineracao')
    const resultado = persistirCampi(campi)
    stats.inseridos = resultado.inseridos
    stats.atualizados = resultado.atualizados
    stats.erros = resultado.erros

  } catch (erro) {
    console.error(`[COLETOR CAMPI] Erro:`, erro.message)
    stats.erros++
    stats.observacoes = `Erro: ${erro.message}`
    log.registrarErro(execucaoId, `Erro: ${erro.message}`)
  }

  const status = stats.erros === 0 ? 'sucesso' : (stats.inseridos > 0 || stats.atualizados > 0) ? 'parcial' : 'erro'
  log.finalizarExecucao(execucaoId, status, stats)

  console.log(`[COLETOR CAMPI] Concluído: ${stats.inseridos} inseridos, ${stats.atualizados} atualizados`)
  return stats
}

module.exports = { coletar }
