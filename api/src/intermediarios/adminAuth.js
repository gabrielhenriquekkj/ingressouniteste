const adminModelo = require('../modelos/adminModelo')
const {
  NOME_COOKIE_SESSAO,
  NOME_COOKIE_CSRF,
  lerCookies,
  hashToken,
  tokenValido,
  anonimizarIp,
  csrfValido,
  origemPermitida
} = require('../utilitarios/segurancaAdmin')

const LIMITE_LOGIN = 10
const JANELA_LOGIN_MS = 15 * 60 * 1000
const tentativas = new Map()

function erroHttp(status, mensagem, detalhes) {
  const erro = new Error(mensagem)
  erro.status = status
  if (detalhes) erro.detalhes = detalhes
  return erro
}

function chaveLimite(req, email) {
  return `${anonimizarIp(req)}:${String(email || '').trim().toLowerCase().slice(0, 120)}`
}

function verificarLimiteLogin(req, email) {
  const agora = Date.now()
  if (tentativas.size > 5000) {
    for (const [chave, valor] of tentativas) {
      if (valor.resetEm <= agora) tentativas.delete(chave)
    }
  }
  const registro = tentativas.get(chaveLimite(req, email))
  if (!registro || registro.resetEm <= agora || registro.quantidade < LIMITE_LOGIN) return 0
  return Math.ceil((registro.resetEm - agora) / 1000)
}

function registrarTentativaLogin(req, email) {
  const chave = chaveLimite(req, email)
  const agora = Date.now()
  const atual = tentativas.get(chave)
  if (!atual || atual.resetEm <= agora) {
    tentativas.set(chave, { quantidade: 1, resetEm: agora + JANELA_LOGIN_MS })
    return
  }
  atual.quantidade += 1
  if (atual.quantidade >= LIMITE_LOGIN) atual.resetEm = agora + JANELA_LOGIN_MS
}

function limparTentativaLogin(req, email) {
  tentativas.delete(chaveLimite(req, email))
}

function limitarLogin(req, res, next) {
  const email = req.body?.email || ''
  const restante = verificarLimiteLogin(req, email)
  if (!restante) return next()
  res.set('Retry-After', String(restante))
  return next(erroHttp(429, 'Muitas tentativas de login. Tente novamente mais tarde.'))
}

function requireAdmin(req, res, next) {
  const cookies = lerCookies(req)
  const token = cookies[NOME_COOKIE_SESSAO]
  res.set('Cache-Control', 'no-store')

  if (!tokenValido(token)) return next(erroHttp(401, 'Sessão administrativa inválida ou expirada.'))

  const sessao = adminModelo.buscarSessao(hashToken(token))
  if (!sessao || sessao.revogado_em) return next(erroHttp(401, 'Sessão administrativa inválida ou expirada.'))

  if (new Date(sessao.expira_em).getTime() <= Date.now()) {
    adminModelo.revogarSessao(hashToken(token))
    return next(erroHttp(401, 'Sessão administrativa expirada.'))
  }
  if (Number(sessao.ativo) !== 1) return next(erroHttp(403, 'Usuário administrativo inativo.'))
  if (sessao.role !== 'admin') return next(erroHttp(403, 'Permissão insuficiente para esta área.'))

  req.admin = {
    usuario: {
      id: Number(sessao.usuario_id),
      nome: sessao.nome,
      email: sessao.email,
      role: sessao.role
    },
    sessao,
    tokenHash: hashToken(token),
    csrfToken: sessao.csrf_token,
    ipHash: anonimizarIp(req)
  }

  adminModelo.limparExpiradas()
  next()
}

function exigirCsrf(req, res, next) {
  const cookies = lerCookies(req)
  const tokenCookie = cookies[NOME_COOKIE_CSRF]
  if (!csrfValido(req, tokenCookie)) {
    return next(erroHttp(403, 'Falha na verificação de CSRF.'))
  }
  if (!origemPermitida(req)) {
    return next(erroHttp(403, 'Origem da requisição não permitida.'))
  }
  if (!req.admin) return next(erroHttp(401, 'Sessão administrativa inválida ou expirada.'))

  const tokenSessao = req.admin.sessao?.csrf_token
  if (!csrfValido(req, tokenSessao) || tokenCookie !== tokenSessao) {
    return next(erroHttp(403, 'Token de CSRF não corresponde à sessão.'))
  }
  next()
}

module.exports = {
  LIMITE_LOGIN,
  JANELA_LOGIN_MS,
  erroHttp,
  limitarLogin,
  registrarTentativaLogin,
  limparTentativaLogin,
  requireAdmin,
  exigirCsrf,
  NOME_COOKIE_CSRF
}
