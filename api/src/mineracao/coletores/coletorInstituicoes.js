const axios = require('axios')
const { normalizarCategoria, normalizarTipoInstituicao, normalizarSigla, normalizarUF } = require('../normalizadores/normalizarInstituicao')
const log = require('../log/execucoesMineracao')

const URL_CSV = 'https://raw.githubusercontent.com/gustavofidelisc/BrasilUniversidades/main/PDA_Lista_Instituicoes_Ensino_Superior_do_Brasil_EMEC.csv'

function parseCSVLinha(linha) {
  const resultado = []
  let atual = ''
  let entreAspas = false
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"') { entreAspas = !entreAspas; continue }
    if (c === ',' && !entreAspas) { resultado.push(atual.trim()); atual = ''; continue }
    atual += c
  }
  resultado.push(atual.trim())
  return resultado
}

function parseCSV(csv) {
  const linhas = csv.split('\n').filter(l => l.trim())
  if (linhas.length < 2) return []

  const cabecalho = parseCSVLinha(linhas[0]).map(h => h.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
  const instituicoes = []
  const mapaIndices = {}

  cabecalho.forEach((h, i) => { mapaIndices[h] = i })

  for (let i = 1; i < linhas.length; i++) {
    const colunas = parseCSVLinha(linhas[i])
    if (colunas.length < 3) continue

    const get = (chaves) => {
      for (const k of chaves) {
        const idx = mapaIndices[k]
        if (idx !== undefined && colunas[idx]) return colunas[idx].trim()
      }
      return ''
    }

    const nome = get(['nome_da_ies', 'nome ies', 'nomeies'])
    if (!nome) continue

    const situacao = get(['situacao_ies', 'situacao'])
    if (situacao && situacao.toLowerCase() !== 'ativa') continue

    const uf = get(['uf', 'sigla uf'])
    const cidade = get(['municipio', 'nome municipio'])
    const codigo = get(['codigo_da_ies', 'cod ies', 'codies'])
    const tipoOrg = get(['organizacao_academica', 'organizacao academica'])
    const sigla = get(['sigla'])

    const cat = normalizarCategoria('')
    const catBruta = tipoOrg || ''

    let tipoInstituicao = ''
    if (catBruta.toLowerCase().includes('instituto federal')) tipoInstituicao = 'instituto_federal'
    else if (catBruta.toLowerCase().includes('cefet')) tipoInstituicao = 'cefet'
    else if (catBruta.toLowerCase().includes('universidade')) tipoInstituicao = 'universidade'
    else if (catBruta.toLowerCase().includes('centro universit')) tipoInstituicao = 'centro_universitario'
    else if (catBruta.toLowerCase().includes('faculdade')) tipoInstituicao = 'faculdade'
    else tipoInstituicao = 'faculdade'

    const nomeUpper = nome.toUpperCase()
    let catAdmin = ''
    if (nomeUpper.includes('UNIVERSIDADE FEDERAL') || nomeUpper.includes('INSTITUTO FEDERAL') || nomeUpper.includes('CEFET') || nomeUpper.includes('CENTRO FEDERAL')) catAdmin = 'federal'
    else if (nomeUpper.includes('UNIVERSIDADE ESTADUAL') || nomeUpper.includes('ESTADUAL')) catAdmin = 'estadual'
    else if (nomeUpper.includes('UNIVERSIDADE MUNICIPAL') || nomeUpper.includes('MUNICIPAL')) catAdmin = 'municipal'
    else if (tipoOrg && tipoOrg.toLowerCase().includes('instituto federal')) catAdmin = 'federal'
    else if (tipoOrg && tipoOrg.toLowerCase().includes('cefet')) catAdmin = 'federal'
    else if (tipoOrg && tipoOrg.toLowerCase().includes('centro federal')) catAdmin = 'federal'
    else if (tipoOrg && tipoOrg.toLowerCase().includes('escola de governo')) catAdmin = 'federal'
    else if (catBruta.toLowerCase().includes('instituto federal')) catAdmin = 'federal'
    else catAdmin = 'outra'

    if (uf && uf.length === 2) {
      instituicoes.push({
        nome: nome.trim(),
        sigla: normalizarSigla(sigla),
        cidade: cidade.trim(),
        estado: normalizarUF(uf),
        site: null,
        codigo_ies: codigo || null,
        categoria_administrativa: catAdmin || 'federal',
        tipo_instituicao: tipoInstituicao || 'universidade',
        fonte_url: URL_CSV,
        coletado_em: new Date().toISOString()
      })
    }
  }

  return instituicoes
}

async function coletar() {
  const execucaoId = log.registrarExecucao('instituicoes')
  const stats = { processados: 0, inseridos: 0, atualizados: 0, erros: 0, ignorados: 0, observacoes: '' }

  console.log('[COLETOR INSTITUIÇÕES] Iniciando coleta...')

  try {
    console.log(`[COLETOR INSTITUIÇÕES] Acessando: MEC Dados Abertos`)
    const resposta = await axios.get(URL_CSV, {
      timeout: 60000,
      headers: { 'User-Agent': 'IngressoUniversitario/1.0 (projeto-academico)' },
      responseType: 'text'
    })

    const instituicoes = parseCSV(resposta.data)
    console.log(`[COLETOR INSTITUIÇÕES] Encontradas ${instituicoes.length} instituições públicas`)
    stats.processados = instituicoes.length

    const { persistirInstituicoes } = require('../persistencia/persistirMineracao')
    const resultado = persistirInstituicoes(instituicoes)
    stats.inseridos = resultado.inseridos
    stats.atualizados = resultado.atualizados
    stats.erros = resultado.erros

  } catch (erro) {
    console.error(`[COLETOR INSTITUIÇÕES] Erro:`, erro.message)
    stats.erros++
    stats.observacoes = `Erro: ${erro.message}`
    log.registrarErro(execucaoId, `Erro: ${erro.message}`)
  }

  const status = stats.erros === 0 ? 'sucesso' : (stats.inseridos > 0 || stats.atualizados > 0) ? 'parcial' : 'erro'
  log.finalizarExecucao(execucaoId, status, stats)

  console.log(`[COLETOR INSTITUIÇÕES] Concluído: ${stats.inseridos} inseridos, ${stats.atualizados} atualizados, ${stats.erros} erros`)
  return stats
}

module.exports = { coletar }
