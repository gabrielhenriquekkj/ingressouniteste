const { Router } = require('express')
const { adicionarFavorito, listarFavoritos, removerFavorito } = require('../controladores/favoritoControlador')

const rotas = Router()
rotas.post('/favoritos', adicionarFavorito)
rotas.get('/favoritos', listarFavoritos)
rotas.delete('/favoritos/:id', removerFavorito)

module.exports = rotas
