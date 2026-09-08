const { Router } = require('express')
const {
  listarInstituicoes,
  detalharInstituicao,
  listarCursos,
  detalharCurso,
  notasCorte,
  custosCidade,
  auxiliosBolsas,
  mercadoEstagios,
  listarCampi
} = require('../controladores/universidadeControlador')

const rotas = Router()

// Instituicoes
rotas.get('/instituicoes', listarInstituicoes)
rotas.get('/instituicoes/:id', detalharInstituicao)

// Campi
rotas.get('/campi', listarCampi)

// Cursos
rotas.get('/cursos', listarCursos)
rotas.get('/cursos/:id', detalharCurso)
rotas.get('/cursos/:id/notas-corte', notasCorte)
rotas.get('/cursos/:id/auxilios-bolsas', auxiliosBolsas)
rotas.get('/cursos/:id/mercado-estagios', mercadoEstagios)

// Custos por cidade
rotas.get('/cidades/:cidade/custos', custosCidade)

module.exports = rotas
