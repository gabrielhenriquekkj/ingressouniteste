const validator = require('validator')
const banco = require('./conexaoBanco')
const { gerarHashSenha, verificarSenha } = require('../utilitarios/segurancaAdmin')

function garantirAdminInicial({ silencioso = false } = {}) {
  const emailBruto = process.env.ADMIN_EMAIL || 'admin@ingressouniversitario.local'
  const email = validator.normalizeEmail(emailBruto) || String(emailBruto).trim().toLowerCase()
  if (!validator.isEmail(email)) throw new Error('ADMIN_EMAIL inválido.')

  const producao = process.env.NODE_ENV === 'production'
  const senhaExplicita = Boolean(process.env.ADMIN_SENHA)
  let senha = process.env.ADMIN_SENHA || ''
  let senhaGerada = false

  if (!senha && producao) throw new Error('Defina ADMIN_SENHA (mínimo 12 caracteres) em produção.')
  if (!senha) {
    senha = require('crypto').randomBytes(12).toString('base64url')
    senhaGerada = true
  }
  if (senha.length < 12 && producao) throw new Error('ADMIN_SENHA deve ter no mínimo 12 caracteres.')

  const agora = new Date().toISOString()
  const existente = banco.prepare('SELECT id, senha_hash FROM admin_usuarios WHERE email = ?').get(email)

  if (existente) {
    if (senhaExplicita && !verificarSenha(senha, existente.senha_hash)) {
      banco.prepare(`
        UPDATE admin_usuarios
        SET senha_hash = ?, role = 'admin', ativo = 1, tentativas = 0, bloqueado_ate = NULL
        WHERE id = ?
      `).run(gerarHashSenha(senha), existente.id)
    }
    if (!silencioso) console.log(`[ADMIN] Conta administrativa verificada: ${email}`)
    return { email, criado: false, senhaGerada: false }
  }

  banco.prepare(`
    INSERT INTO admin_usuarios (nome, email, senha_hash, role, ativo, criado_em)
    VALUES (?, ?, ?, 'admin', 1, ?)
  `).run('Administrador', email, gerarHashSenha(senha), agora)

  if (!silencioso) {
    console.log(`[ADMIN] Conta criada: ${email}`)
    if (senhaGerada) {
      console.log(`[ADMIN] Senha provisória (troque via ADMIN_SENHA): ${senha}`)
    }
  }
  return { email, criado: true, senhaGerada, senha: senhaGerada ? senha : undefined }
}

module.exports = { garantirAdminInicial }
