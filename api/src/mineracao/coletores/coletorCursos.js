const axios = require('axios')
const { normalizarModalidade, normalizarGrau, normalizarTurno, normalizarUF } = require('../normalizadores/normalizarInstituicao')
const { validarCurso } = require('../validadores/validarInstituicao')
const log = require('../log/execucoesMineracao')
const banco = require('../../configuracoes/conexaoBanco')

const URL_EMEC_CURSOS = 'https://emec.mec.gov.br/emec/consult-public/list-cursos/json'

async function buscarDado(url, timeout = 30000) {
  const resposta = await axios.get(url, {
    timeout,
    headers: { 'User-Agent': 'IngressoUniversitario/1.0 (projeto-academico)' },
    responseType: 'text'
  })
  return resposta.data
}

function parseCursos(dados) {
  if (!Array.isArray(dados)) return []

  const cursos = []
  const grausGraduacao = ['bacharelado', 'licenciatura', 'tecnologico', 'abi']

  for (const item of dados) {
    const nomeCurso = item.nome_curso || item.nome || ''
    const nomeModalidade = item.modalidade || item.nome_modalidade || ''
    const grau = item.grau || item.grau_academico || ''
    const turno = item.turno || ''
    const duracao = item.duracao || item.carga_horaria || ''
    const codigoIes = item.co_ies || item.codigo_ies || ''
    const codigoCurso = item.co_curso || item.codigo_curso || ''
    const cidade = item.municipio || item.nome_municipio || ''
    const uf = item.uf || item.sigla_uf || ''

    const grauNormalizado = normalizarGrau(grau)
    if (!grausGraduacao.some(g => grauNormalizado.toLowerCase().includes(g))) continue

    const instituicao = banco.prepare('SELECT id FROM instituicoes WHERE codigo_ies = ?').get(String(codigoIes))
    if (!instituicao) continue

    const campus = item.co_campus
      ? banco.prepare('SELECT id FROM campi WHERE codigo_campus = ?').get(String(item.co_campus))
      : null

    cursos.push({
      instituicao_id: instituicao.id,
      campus_id: campus ? campus.id : null,
      codigo_curso: codigoCurso || null,
      nome: nomeCurso.trim(),
      grau: grauNormalizado,
      modalidade: normalizarModalidade(nomeModalidade),
      turno: normalizarTurno(turno),
      duracao_semestres: duracao ? parseInt(duracao) : null,
      codigo_municipio_ibge: item.cod_municipio_ibge || null,
      cidade: cidade.trim() || null,
      uf: normalizarUF(uf),
      fonte_url: URL_EMEC_CURSOS,
      coletado_em: new Date().toISOString()
    })
  }

  return cursos
}

async function coletar() {
  const execucaoId = log.registrarExecucao('cursos')
  const stats = { processados: 0, inseridos: 0, atualizados: 0, erros: 0, ignorados: 0, observacoes: '' }

  console.log('[COLETOR CURSOS] Iniciando coleta...')

  try {
    const dados = await buscarDado(URL_EMEC_CURSOS)
    const json = typeof dados === 'string' ? JSON.parse(dados) : dados
    const cursos = parseCursos(json)

    console.log(`[COLETOR CURSOS] Encontrados ${cursos.length} cursos de graduação`)
    stats.processados = cursos.length

    const { persistirCursos } = require('../persistencia/persistirMineracao')
    const resultado = persistirCursos(cursos)
    stats.inseridos = resultado.inseridos
    stats.atualizados = resultado.atualizados
    stats.erros = resultado.erros

  } catch (erro) {
    console.error(`[COLETOR CURSOS] Erro:`, erro.message)
    stats.erros++
    stats.observacoes = `Erro: ${erro.message}`
    log.registrarErro(execucaoId, `Erro: ${erro.message}`)
  }

  const status = stats.erros === 0 ? 'sucesso' : (stats.inseridos > 0 || stats.atualizados > 0) ? 'parcial' : 'erro'
  log.finalizarExecucao(execucaoId, status, stats)

  console.log(`[COLETOR CURSOS] Concluído: ${stats.inseridos} inseridos, ${stats.atualizados} atualizados`)
  return stats
}

module.exports = { coletar }
