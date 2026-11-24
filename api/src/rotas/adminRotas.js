const express = require('express')
const adminControlador = require('../controladores/adminControlador')
const {
  limitarLogin,
  registrarTentativaLogin,
  requireAdmin,
  exigirCsrf
} = require('../intermediarios/adminAuth')

const router = express.Router()

router.post('/login', limitarLogin, adminControlador.login)
router.get('/session', requireAdmin, adminControlador.sessao)
router.post('/logout', requireAdmin, exigirCsrf, adminControlador.logout)

router.get('/dashboard', requireAdmin, adminControlador.dashboard)
router.get('/acessos', requireAdmin, adminControlador.acessos)
router.get('/rotas', requireAdmin, adminControlador.rotas)
router.post('/evento', requireAdmin, exigirCsrf, adminControlador.registrarEventoPainel)

router.post('/relatorios', requireAdmin, exigirCsrf, adminControlador.criarRelatorio)
router.get('/relatorios', requireAdmin, adminControlador.listarRelatorios)
router.get('/relatorios/:id', requireAdmin, adminControlador.buscarRelatorio)
router.get('/relatorios/:id/download', requireAdmin, adminControlador.baixarRelatorio)
router.delete('/relatorios/:id', requireAdmin, exigirCsrf, adminControlador.removerRelatorio)

module.exports = router
module.exports.registrarTentativaLogin = registrarTentativaLogin
