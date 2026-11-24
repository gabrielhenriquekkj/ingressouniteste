const crypto = require('crypto')
const validator = require('validator')

function segredoObrigatorio(nome, valorPadrao) {
  const valor = process.env[nome]
  if (valor && valor.length >= 16) return valor
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Variável obrigatória ausente ou curta: ${nome} (mínimo 16 caracteres)`)
  }
  return valorPadrao
}

const SEGREGO_SESSAO = segredoObrigatorio('ADMIN_SESSION_SECRET', 'desenvolvimento-troque-admin-session-secret-2026')
const SAL_IP = segredoObrigatorio('IP_HASH_SALT', 'desenvolvimento-troque-ip-hash-salt-2026')
const Fuso = 'America/Sao_Paulo'

const NOME_COOKIE_SESSAO = 'admin_session'
const NOME_COOKIE_CSRF = 'admin_csrf'
const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000

function gerarHashSenha(senha) {
  const sal = crypto.randomBytes(16)
  const hash = crypto.scryptSync(String(senha), sal, 64)
  return `scrypt$${sal.toString('base64')}$${hash.toString('base64')}`
}

function verificarSenha(senha, armazenado) {
  try {
    const [algoritmo, salBase64, hashBase64] = String(armazenado || '').split('$')
    if (algoritmo !== 'scrypt' || !salBase64 || !hashBase64) return false
    const esperado = Buffer.from(hashBase64, 'base64')
    const recebido = crypto.scryptSync(String(senha), Buffer.from(salBase64, 'base64'), esperado.length)
    return esperado.length === recebido.length && crypto.timingSafeEqual(esperado, recebido)
  } catch {
    return false
  }
}

function gerarToken() {
  return crypto.randomBytes(32).toString('base64url')
}

function hashToken(token) {
  return crypto.createHmac('sha256', SEGREGO_SESSAO).update(token).digest('hex')
}

function tokenValido(token) {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token)
}

function lerCookies(req) {
  const cookies = {}
  const cabecalho = req.headers.cookie || ''
  for (const parte of cabecalho.split(';')) {
    const indice = parte.indexOf('=')
    if (indice < 0) continue
    const chave = parte.slice(0, indice).trim()
    const valor = parte.slice(indice + 1).trim()
    if (chave) cookies[chave] = decodeURIComponent(valor)
  }
  return cookies
}

function cookieSeguro(req) {
  if (process.env.ADMIN_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production') return true
  return Boolean(req.secure || req.get('x-forwarded-proto') === 'https')
}

function atributosCookie(nome, valor, req, opcoes = {}) {
  const partes = [
    `${nome}=${valor}`,
    `Path=${opcoes.path || '/'}`,
    `Max-Age=${opcoes.maxAge ?? Math.floor(DURACAO_SESSAO_MS / 1000)}`,
    'HttpOnly',
    'SameSite=Strict'
  ]
  if (cookieSeguro(req)) partes.push('Secure')
  return partes.join('; ')
}

function atributosCookieCsrf(valor, req) {
  return [
    `${NOME_COOKIE_CSRF}=${valor}`,
    'Path=/',
    `Max-Age=${Math.floor(DURACAO_SESSAO_MS / 1000)}`,
    'SameSite=Strict',
    cookieSeguro(req) ? 'Secure' : ''
  ].filter(Boolean).join('; ')
}

function limparCookie(nome, req) {
  const partes = [`${nome}=`, 'Path=/', 'Max-Age=0', 'HttpOnly', 'SameSite=Strict']
  if (cookieSeguro(req)) partes.push('Secure')
  return partes.join('; ')
}

function origemPermitida(req) {
  const origem = req.get('origin')
  const referer = req.get('referer')
  const valor = origem || referer
  const host = `${req.protocol}://${req.get('host')}`

  if (!valor) {
    const fetchSite = req.get('sec-fetch-site')
    return fetchSite === 'same-origin' || fetchSite === 'same-site'
  }

  let origemRecebida
  try {
    origemRecebida = new URL(valor).origin
  } catch {
    return false
  }
  if (origemRecebida === host) return true

  const configuradas = (process.env.ORIGEM_PERMITIDA || '')
    .split(',')
    .map(item => item.trim())
    .filter(item => item && item !== '*')
  return configuradas.some(item => {
    try {
      return new URL(item).origin === origemRecebida
    } catch {
      return false
    }
  })
}

function csrfValido(req, tokenEsperado) {
  const tokenEnviado = req.get('x-csrf-token')
  if (!tokenValido(tokenEnviado) || !tokenValido(tokenEsperado)) return false
  const a = Buffer.from(tokenEnviado)
  const b = Buffer.from(tokenEsperado)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function anonimizarIp(req) {
  const encaminhado = req.get('x-forwarded-for')
  let endereco = (encaminhado ? encaminhado.split(',')[0].trim() : req.socket?.remoteAddress) || ''
  if (endereco.startsWith('::ffff:')) endereco = endereco.slice(7)

  let reduzido = 'desconhecido'
  if (validator.isIP(endereco, 4)) {
    reduzido = `${endereco.split('.').slice(0, 3).join('.')}.0`
  } else if (validator.isIP(endereco, 6)) {
    reduzido = `${endereco.toLowerCase().split(':').filter(Boolean).slice(0, 3).join(':')}::`
  }
  return crypto.createHmac('sha256', SAL_IP).update(reduzido).digest('hex').slice(0, 20)
}

function analisarAgente(agenteTexto = '') {
  const agente = String(agenteTexto || '').slice(0, 400)
  let navegador = 'Outro'
  if (/Edg\//i.test(agente)) navegador = 'Edge'
  else if (/OPR\/|Opera/i.test(agente)) navegador = 'Opera'
  else if (/Firefox\//i.test(agente)) navegador = 'Firefox'
  else if (/Chrome\//i.test(agente)) navegador = 'Chrome'
  else if (/Safari\//i.test(agente)) navegador = 'Safari'

  let sistema = 'Outro'
  if (/Windows/i.test(agente)) sistema = 'Windows'
  else if (/iPad|iPhone|iPod/i.test(agente)) sistema = 'iOS'
  else if (/Android/i.test(agente)) sistema = 'Android'
  else if (/CrOS/i.test(agente)) sistema = 'ChromeOS'
  else if (/Mac OS X|Macintosh/i.test(agente)) sistema = 'macOS'
  else if (/Linux/i.test(agente)) sistema = 'Linux'

  let dispositivo = 'desktop'
  if (/iPad|Tablet|Galaxy Tab|SM-T\w+|PlayBook|Kindle|Silk/i.test(agente)) dispositivo = 'tablet'
  else if (/Mobi|iPhone|Android|Windows Phone|BlackBerry/i.test(agente)) dispositivo = 'smartphone'

  if (/bot|crawler|spider|slurp|facebookexternalhit|curl|axios|node-fetch/i.test(agente)) {
    dispositivo = 'bot'
  }

  return { dispositivo, navegador, sistema }
}

function diaLocal(data = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: Fuso, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(data)
}

function deslocarDia(dia, quantidade) {
  const data = new Date(`${dia}T12:00:00Z`)
  data.setUTCDate(data.getUTCDate() + quantidade)
  return data.toISOString().slice(0, 10)
}

function sanitizarTexto(valor, tamanho = 120) {
  return validator.escape(validator.trim(String(valor ?? ''))).slice(0, tamanho)
}

function sanitizarRota(valor) {
  const bruto = validator.trim(String(valor ?? '')).slice(0, 200)
  if (!bruto) return ''
  const limpo = bruto.replace(/[^A-Za-z0-9\-_./?=&%:]/g, '')
  return limpo.slice(0, 200)
}

function validarData(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null
  const data = new Date(`${valor}T00:00:00Z`)
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== valor) return null
  return valor
}

function periodoFiltros(inicio, fim, maxDias = 366) {
  const hoje = diaLocal()
  const dataFim = validarData(fim) || hoje
  const dataInicio = validarData(inicio) || deslocarDia(dataFim, -29)
  const inicioMs = new Date(`${dataInicio}T00:00:00Z`).getTime()
  const fimMs = new Date(`${dataFim}T00:00:00Z`).getTime()
  if (inicioMs > fimMs) return { erro: 'A data inicial deve ser menor ou igual à data final.' }
  if (fimMs - inicioMs > maxDias * 86400000) {
    return { erro: `O período não pode ultrapassar ${maxDias} dias.` }
  }
  return { inicio: dataInicio, fim: dataFim }
}

module.exports = {
  Fuso,
  NOME_COOKIE_SESSAO,
  NOME_COOKIE_CSRF,
  DURACAO_SESSAO_MS,
  gerarHashSenha,
  verificarSenha,
  gerarToken,
  hashToken,
  tokenValido,
  lerCookies,
  cookieSeguro,
  atributosCookie,
  atributosCookieCsrf,
  limparCookie,
  origemPermitida,
  csrfValido,
  anonimizarIp,
  analisarAgente,
  diaLocal,
  deslocarDia,
  sanitizarTexto,
  sanitizarRota,
  validarData,
  periodoFiltros
}
