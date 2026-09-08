const { Router } = require('express')
const { listar } = require('../controladores/sugestaoControlador')

const rotas = Router()
rotas.get('/sugestoes', listar)

module.exports = rotas
