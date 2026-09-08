const { sugestoes } = require('../modelos/sugestaoModelo')

function listar(req, res, next) {
  try {
    const termo = (req.query.q || '').trim()
    const limite = Math.min(20, Math.max(1, parseInt(req.query.limite) || 8))

    const dados = sugestoes(termo, limite)

    res.json({
      sucesso: true,
      dados
    })
  } catch (erro) {
    next(erro)
  }
}

module.exports = { listar }
