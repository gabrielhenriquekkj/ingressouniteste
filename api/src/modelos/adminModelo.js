const banco = require('../configuracoes/conexaoBanco')

const LIMITES = {
  tentativas: 5,
  bloqueioMs: 15 * 60 * 1000
}

function buscarPorEmail(email) {
  return banco.prepare('SELECT * FROM admin_usuarios WHERE email = ? COLLATE NOCASE').get(email) || null
}

function buscarPorId(id) {
  return banco.prepare(`
    SELECT id, nome, email, role, ativo, criado_em, ultimo_login FROM admin_usuarios WHERE id = ?
  `).get(id) || null
}

function registrarFalha(id) {
  const usuario = banco.prepare('SELECT tentativas FROM admin_usuarios WHERE id = ?').get(id)
  if (!usuario) return
  const tentativas = Number(usuario.tentativas) + 1
  const bloqueadoAte = tentativas >= LIMITES.tentativas
    ? new Date(Date.now() + LIMITES.bloqueioMs).toISOString()
    : null
  banco.prepare('UPDATE admin_usuarios SET tentativas = ?, bloqueado_ate = ? WHERE id = ?')
    .run(bloqueadoAte ? 0 : tentativas, bloqueadoAte, id)
}

function registrarSucesso(id) {
  banco.prepare(`
    UPDATE admin_usuarios SET tentativas = 0, bloqueado_ate = NULL, ultimo_login = ? WHERE id = ?
  `).run(new Date().toISOString(), id)
}

function usuarioBloqueado(usuario) {
  if (!usuario?.bloqueado_ate) return false
  const até = new Date(usuario.bloqueado_ate).getTime()
  if (Number.isNaN(até)) return false
  if (até > Date.now()) return true
  banco.prepare('UPDATE admin_usuarios SET bloqueado_ate = NULL, tentativas = 0 WHERE id = ?').run(usuario.id)
  return false
}

function criarSessao({ usuarioId, tokenHash, csrfToken, ipHash, userAgent, duracaoMs }) {
  const agora = Date.now()
  const resultado = banco.prepare(`
    INSERT INTO admin_sessoes (token_hash, csrf_token, usuario_id, ip_hash, user_agent, criado_em, expira_em)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    tokenHash,
    csrfToken,
    usuarioId,
    ipHash,
    String(userAgent || '').slice(0, 400),
    new Date(agora).toISOString(),
    new Date(agora + duracaoMs).toISOString()
  )
  return Number(resultado.lastInsertRowid)
}

function buscarSessao(tokenHash) {
  return banco.prepare(`
    SELECT s.*, u.nome, u.email, u.role, u.ativo
    FROM admin_sessoes s
    JOIN admin_usuarios u ON u.id = s.usuario_id
    WHERE s.token_hash = ?
  `).get(tokenHash) || null
}

function revogarSessao(tokenHash) {
  banco.prepare(`
    UPDATE admin_sessoes SET revogado_em = ? WHERE token_hash = ? AND revogado_em IS NULL
  `).run(new Date().toISOString(), tokenHash)
}

function revogarTodas(usuarioId) {
  banco.prepare(`
    UPDATE admin_sessoes SET revogado_em = ? WHERE usuario_id = ? AND revogado_em IS NULL
  `).run(new Date().toISOString(), usuarioId)
}

function limparExpiradas() {
  banco.prepare('DELETE FROM admin_sessoes WHERE expira_em < ? OR revogado_em IS NOT NULL')
    .run(new Date().toISOString())
}

module.exports = {
  LIMITES,
  buscarPorEmail,
  buscarPorId,
  registrarFalha,
  registrarSucesso,
  usuarioBloqueado,
  criarSessao,
  buscarSessao,
  revogarSessao,
  revogarTodas,
  limparExpiradas
}
