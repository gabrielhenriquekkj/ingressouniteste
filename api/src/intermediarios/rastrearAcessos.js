const acessoModelo = require('../modelos/acessoModelo')
const { anonimizarIp, analisarAgente, diaLocal } = require('../utilitarios/segurancaAdmin')

const EXTENSOES_IGNORADAS = /\.(css|js|mjs|json|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|eot|pdf|txt|csv|xml)$/i
const PASTAS_IGNORADAS = /^\/(assets|css|js|fonts|static)(\/|$)/i

function normalizarRota(caminho) {
  try {
    const rota = decodeURIComponent(String(caminho || '/')).trim()
    return rota.length > 200 ? rota.slice(0, 200) : (rota || '/')
  } catch {
    return String(caminho || '/').slice(0, 200)
  }
}

function rastrearAcessos(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()

  const caminho = req.path || '/'
  if (caminho.startsWith('/api') || caminho === '/health' || caminho === '/favicon.ico') return next()
  if (EXTENSOES_IGNORADAS.test(caminho) || PASTAS_IGNORADAS.test(caminho)) return next()

  const agente = analisarAgente(req.get('user-agent'))
  let idAcesso = null

  try {
    idAcesso = acessoModelo.registrar({
      rota: normalizarRota(caminho),
      metodo: req.method,
      criado_em: new Date().toISOString(),
      dia: diaLocal(),
      dispositivo: agente.dispositivo,
      navegador: agente.navegador,
      sistema: agente.sistema,
      ip_hash: anonimizarIp(req),
      status: null,
      area: /^\/admin(\/|$)/i.test(caminho) ? 'admin' : 'publico'
    })
  } catch (erro) {
    console.error('[RASTREAMENTO] Falha ao registrar acesso:', erro.message)
  }

  if (idAcesso) {
    res.once('finish', () => {
      try {
        acessoModelo.atualizarStatus(idAcesso, res.statusCode)
      } catch (erro) {
        console.error('[RASTREAMENTO] Falha ao atualizar status:', erro.message)
      }
    })
  }

  next()
}

module.exports = rastrearAcessos
module.exports.normalizarRota = normalizarRota
