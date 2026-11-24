const acessoModelo = require('../modelos/acessoModelo')
const { analisarAgente, anonimizarIp, diaLocal } = require('../utilitarios/segurancaAdmin')

const EVENTOS = {
  busca: { rota: '/publico/busca', area: 'publico' },
  'sugestao-curso': { rota: '/publico/busca/sugestao', area: 'publico' },
  'notas-corte': { rota: '/publico/secoes/notas-de-corte', area: 'publico' },
  'custos-cidade': { rota: '/publico/secoes/custos-da-cidade', area: 'publico' },
  'bolsas-auxilios': { rota: '/publico/secoes/bolsas-e-auxilios', area: 'publico' },
  'mercado-estagios': { rota: '/publico/secoes/mercado-e-estagios', area: 'publico' },
  favoritos: { rota: '/publico/favoritos/acao', area: 'publico' },
  detalhes: { rota: '/publico/detalhes/secao', area: 'publico' }
}

const UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
])

const CATEGORIAS = new Set(['', 'todas', 'federal', 'estadual', 'municipal'])
const ORIGENS = new Set(['home', 'detalhes', 'favoritos', 'resultados'])
const ACOES = new Set(['adicionar', 'remover', 'ver'])
const SECOES = new Set(['notas', 'custos', 'bolsas', 'mercado', 'geral'])

function texto(valor, tamanho = 40) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0000-\u001f\u007f<>"'`;]/g, '')
    .trim()
    .slice(0, tamanho)
}

function simNao(valor) {
  return valor ? 'sim' : 'nao'
}

function detalhesSeguros(evento, detalhes) {
  const dados = detalhes && typeof detalhes === 'object' ? detalhes : {}

  if (evento === 'busca' || evento === 'sugestao-curso') {
    const uf = String(dados.uf || '').toUpperCase().trim()
    const categoria = String(dados.categoria || '').toLowerCase().trim()
    return [
      `uf=${UFS.has(uf) ? uf : 'todas'}`,
      `categoria=${CATEGORIAS.has(categoria) ? categoria : 'todas'}`,
      `termo=${simNao(dados.temTermo)}`
    ].join('; ')
  }

  if (evento === 'favoritos') {
    const acao = String(dados.acao || '').toLowerCase().trim()
    return `acao=${ACOES.has(acao) ? acao : 'ver'}`
  }

  if (evento === 'detalhes') {
    const secao = String(dados.secao || '').toLowerCase().trim()
    return `secao=${SECOES.has(secao) ? secao : 'geral'}`
  }

  const origem = String(dados.origem || '').toLowerCase().trim()
  return `origem=${ORIGENS.has(origem) ? origem.trim() : 'home'}`
}

function registrar(requisicao, resposta) {
  const evento = String(requisicao.body?.evento || '').trim().toLowerCase()
  const configuracao = EVENTOS[evento]

  if (!configuracao) {
    resposta.status(400).json({ sucesso: false, mensagem: 'Evento de telemetria inválido.' })
    return
  }

  const agente = analisarAgente(requisicao.headers['user-agent'] || '')
  const detalhes = detalhesSeguros(evento, requisicao.body?.detalhes)
  const agora = new Date()

  acessoModelo.registrar({
    rota: configuracao.rota,
    metodo: 'POST',
    criado_em: agora.toISOString(),
    dia: diaLocal(agora),
    status: 202,
    area: configuracao.area,
    detalhes: texto(detalhes, 120),
    dispositivo: agente.dispositivo,
    navegador: agente.navegador,
    sistema: agente.sistema,
    ip_hash: anonimizarIp(requisicao)
  })

  resposta.status(202).json({ sucesso: true })
}

module.exports = { registrar, EVENTOS }
