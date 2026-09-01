const express = require('express')
const router = express.Router()
const modelo = require('../modelos/groqModelo')

router.post('/groq-chat', async (req, res, next) => {
  try {
    const { mensagem } = req.body
    const resultado = await modelo.gerarResposta(mensagem)
    res.json({ sucesso: true, resposta: resultado })
  } catch (erro) {
    next(erro)
  }
})

module.exports = router