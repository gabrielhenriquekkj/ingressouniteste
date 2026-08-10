const { Router } = require('express')
const { buscar } = require('../controladores/buscaControlador')

const rotas = Router()
rotas.get('/busca', buscar)

module.exports = rotas
