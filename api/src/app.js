const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const rotasBusca = require('./rotas/buscaRotas')
const rotasUniversidade = require('./rotas/universidadeRotas')
const rotasFavorito = require('./rotas/favoritoRotas')
const rotasSugestao = require('./rotas/sugestaoRotas')
const rotasAdmin = require('./rotas/adminRotas')
const rotasTelemetria = require('./rotas/telemetriaRotas')
const logger = require('./intermediarios/logger')
const rastrearAcessos = require('./intermediarios/rastrearAcessos')
const tratamentoErros = require('./intermediarios/tratamentoErros')

const app = express()
const caminhoFrontend = path.resolve(__dirname, '../../frontend')
const caminhoAdmin = path.join(caminhoFrontend, 'admin')

app.disable('x-powered-by')

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false
}))

const origensConfiguradas = (process.env.ORIGEM_PERMITIDA || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean)

if (!origensConfiguradas.length || origensConfiguradas.includes('*')) {
  app.use(cors({ origin: false }))
} else {
  app.use(cors({ origin: origensConfiguradas, credentials: true }))
}

app.use(express.json({ limit: '10kb' }))
app.use(logger)

app.use(['/admin', '/api/admin'], (req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

// Registra navegações em páginas (antes de qualquer fallback)
app.use(rastrearAcessos)

// Rotas da área administrativa (autenticação, RBAC, CSRF e auditoria)
app.use('/api/admin', rotasAdmin)

// Rota de health check
app.get('/api/health', (_, res) => res.json({ sucesso: true, mensagem: 'API do Ingresso Universitário funcionando!' }))

// Servir arquivos estáticos do frontend (sem cache em dev)
app.use(express.static(caminhoFrontend, { maxAge: 0, etag: false, index: false }))

app.get('/', (req, res) => res.sendFile(path.join(caminhoFrontend, 'index.html')))
app.get('/admin', (req, res) => res.sendFile(path.join(caminhoAdmin, 'index.html')))

app.get(/^\/admin\/([a-z-]+)\/?$/i, (req, res, next) => {
  const paginas = { dashboard: 'dashboard.html', relatorios: 'relatorios.html', login: 'index.html' }
  const arquivo = paginas[req.params[0].toLowerCase()]
  if (!arquivo) return next()
  res.sendFile(path.join(caminhoAdmin, arquivo))
})

// Rotas da API pública
app.use('/api', rotasTelemetria)
app.use('/api', rotasBusca)
app.use('/api', rotasUniversidade)
app.use('/api', rotasFavorito)
app.use('/api', rotasSugestao)

app.use('/api', (req, res) => {
  res.status(404).json({ sucesso: false, mensagem: 'Endpoint não encontrado.' })
})

// Fallback para o frontend (SPA)
app.get('*', (req, res) => {
  const destino = req.path.startsWith('/admin')
    ? path.join(caminhoAdmin, 'index.html')
    : path.join(caminhoFrontend, 'index.html')
  res.sendFile(destino)
})

// Middleware global de tratamento de erros (DEVE ser o ultimo)
app.use(tratamentoErros)

module.exports = app
