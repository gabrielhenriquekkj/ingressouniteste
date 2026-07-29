const { Router } = require('express')
const { cadastrarLead, listarLeads } = require('../controladores/leadControlador')

const rotas = Router()
rotas.post('/leads', cadastrarLead)
rotas.get('/leads', listarLeads)

module.exports = rotas
