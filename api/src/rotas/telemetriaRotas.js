const express = require('express')
const controlador = require('../controladores/telemetriaControlador')
const { origemPermitida } = require('../utilitarios/segurancaAdmin')
const limitarTelemetria = require('../intermediarios/telemetriaLimite')

const roteador = express.Router()

function exigirOrigem(requisicao, resposta, proximo) {
  if (!origemPermitida(requisicao)) {
    resposta.status(403).json({ sucesso: false, mensagem: 'Origem da requisição não permitida.' })
    return
  }
  proximo()
}

roteador.post('/telemetria', exigirOrigem, limitarTelemetria, controlador.registrar)

module.exports = roteador
