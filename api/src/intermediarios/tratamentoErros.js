function tratamentoErros(erro, req, res, next) {
  console.error(`[ERRO] ${req.method} ${req.url}:`, erro.message || erro)

  const status = erro.status || 500
  const mensagem = status === 500 ? 'Erro interno do servidor' : erro.message

  res.status(status).json({ sucesso: false, mensagem })
}

module.exports = tratamentoErros
