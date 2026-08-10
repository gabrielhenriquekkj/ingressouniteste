const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const rotasBusca = require('./rotas/buscaRotas')
const rotasUniversidade = require('./rotas/universidadeRotas')
const rotasFavorito = require('./rotas/favoritoRotas')

const app = express()

// Middlewares de seguranca e parsing
app.use(helmet({
  contentSecurityPolicy: false
}))
app.use(cors({ origin: process.env.ORIGEM_PERMITIDA || '*' }))
app.use(express.json({ limit: '10kb' }))

// Servir arquivos estaticos do frontend
const caminhoFrontend = path.resolve(__dirname, '../../frontend')
app.use(express.static(caminhoFrontend))

// Rotas da API
app.use('/api', rotasBusca)
app.use('/api', rotasUniversidade)
app.use('/api', rotasFavorito)

// Rota de health check
app.get('/api/health', (_, res) => res.json({ sucesso: true, mensagem: 'API do Ingresso Universitario funcionando!' }))

// Fallback para o frontend (SPA)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(caminhoFrontend, 'index.html'))
})

module.exports = app
