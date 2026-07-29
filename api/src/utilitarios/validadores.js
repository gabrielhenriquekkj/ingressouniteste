const validator = require('validator')

// Remove espaços extras e escapa caracteres especiais
function sanitizar(texto) {
  return validator.trim(validator.escape(texto || ''))
}

// Valida e sanitiza os dados recebidos do formulário de lead
function validarLead(dados) {
  const erros = []
  const nome = sanitizar(dados.nome_completo)
  const email = sanitizar(dados.email)
  const telefone = sanitizar(dados.telefone_whatsapp)
  const mensagem = sanitizar(dados.mensagem || '')

  if (!nome || nome.length < 3 || nome.length > 150)
    erros.push('Nome completo deve ter entre 3 e 150 caracteres.')

  if (!validator.isEmail(email))
    erros.push('E-mail inválido.')

  const apenasDigitos = telefone.replace(/\D/g, '')
  if (apenasDigitos.length < 10 || apenasDigitos.length > 15)
    erros.push('Telefone WhatsApp inválido. Informe um número com DDD.')

  if (mensagem.length > 500)
    erros.push('Mensagem deve ter no máximo 500 caracteres.')

  return {
    valido: erros.length === 0,
    erros,
    dados: { nome_completo: nome, email, telefone_whatsapp: apenasDigitos, mensagem }
  }
}

module.exports = { sanitizar, validarLead }
