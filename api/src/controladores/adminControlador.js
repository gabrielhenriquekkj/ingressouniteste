const validator = require('validator')
const adminModelo = require('../modelos/adminModelo')
const acessoModelo = require('../modelos/acessoModelo')
const relatorioModelo = require('../modelos/relatorioModelo')
const { erroHttp } = require('../intermediarios/adminAuth')
const { exportar, nomeArquivo } = require('../utilitarios/exportadorRelatorio')
const {
  gerarToken,
  hashToken,
  verificarSenha,
  analisarAgente,
  DURACAO_SESSAO_MS,
  NOME_COOKIE_SESSAO,
  NOME_COOKIE_CSRF,
  atributosCookie,
  atributosCookieCsrf,
  limparCookie,
  anonimizarIp,
  diaLocal,
  deslocarDia,
  periodoFiltros,
  sanitizarTexto,
  sanitizarRota
} = require('../utilitarios/segurancaAdmin')

function ctrl(funcao) {
  return (req, res, next) => {
    try {
      funcao(req, res, next)
    } catch (erro) {
      next(erro)
    }
  }
}

function parseId(valor) {
  const id = Number(valor)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function respostaUsuario(usuario) {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role }
}

function definirCookies(req, res, token, csrfToken) {
  res.append('Set-Cookie', atributosCookie(NOME_COOKIE_SESSAO, token, req))
  res.append('Set-Cookie', atributosCookieCsrf(csrfToken, req))
  res.set('Cache-Control', 'no-store')
}

const login = ctrl((req, res) => {
  const emailBruto = String(req.body?.email || '').trim().toLowerCase()
  const senha = String(req.body?.senha || '')
  if (!validator.isEmail(emailBruto) || !senha || senha.length > 128) {
    throw erroHttp(422, 'Informe um e-mail válido e uma senha.')
  }

  const usuario = adminModelo.buscarPorEmail(emailBruto)
  if (!usuario) {
    const { registrarTentativaLogin } = require('../intermediarios/adminAuth')
    registrarTentativaLogin(req, emailBruto)
    throw erroHttp(401, 'Credenciais inválidas.')
  }
  if (Number(usuario.ativo) !== 1) throw erroHttp(403, 'Usuário administrativo inativo.')
  if (adminModelo.usuarioBloqueado(usuario)) {
    throw erroHttp(429, 'Conta temporariamente bloqueada por tentativas falhas.')
  }
  if (!verificarSenha(senha, usuario.senha_hash)) {
    const { registrarTentativaLogin } = require('../intermediarios/adminAuth')
    adminModelo.registrarFalha(usuario.id)
    registrarTentativaLogin(req, emailBruto)
    throw erroHttp(401, 'Credenciais inválidas.')
  }
  if (usuario.role !== 'admin') throw erroHttp(403, 'Permissão insuficiente para esta área.')

  const token = gerarToken()
  const csrfToken = gerarToken()
  adminModelo.criarSessao({
    usuarioId: usuario.id,
    tokenHash: hashToken(token),
    csrfToken,
    ipHash: anonimizarIp(req),
    userAgent: req.get('user-agent'),
    duracaoMs: DURACAO_SESSAO_MS
  })
  adminModelo.registrarSucesso(usuario.id)
  const { limparTentativaLogin } = require('../intermediarios/adminAuth')
  limparTentativaLogin(req, emailBruto)
  definirCookies(req, res, token, csrfToken)

  res.json({
    sucesso: true,
    mensagem: 'Sessão iniciada com sucesso.',
    dados: {
      usuario: respostaUsuario(usuario),
      csrfToken,
      expiraEm: new Date(Date.now() + DURACAO_SESSAO_MS).toISOString()
    }
  })
})

const sessao = ctrl((req, res) => {
  res.json({
    sucesso: true,
    dados: {
      usuario: respostaUsuario(req.admin.usuario),
      csrfToken: req.admin.csrfToken,
      expiraEm: req.admin.sessao.expira_em
    }
  })
})

const logout = ctrl((req, res) => {
  adminModelo.revogarSessao(req.admin.tokenHash)
  res.append('Set-Cookie', limparCookie(NOME_COOKIE_SESSAO, req))
  res.append('Set-Cookie', limparCookie(NOME_COOKIE_CSRF, req))
  res.set('Cache-Control', 'no-store')
  res.json({ sucesso: true, mensagem: 'Sessão encerrada com sucesso.' })
})

const dashboard = ctrl((req, res) => {
  const periodo = [7, 30, 90, 365].includes(Number(req.query.periodo)) ? Number(req.query.periodo) : 30
  const fim = diaLocal()
  const inicio = deslocarDia(fim, -(periodo - 1))
  const anteriorFim = deslocarDia(inicio, -1)
  const anteriorInicio = deslocarDia(anteriorFim, -(periodo - 1))
  const kpis = acessoModelo.contarKpis()
  const totalPeriodo = acessoModelo.listar({ inicio, fim, limite: 1 }).total
  const totalAnterior = acessoModelo.listar({ inicio: anteriorInicio, fim: anteriorFim, limite: 1 }).total
  const variacao = totalAnterior ? Math.round(((totalPeriodo - totalAnterior) / totalAnterior) * 1000) / 10 : null

  res.set('Cache-Control', 'no-store')
  res.json({
    sucesso: true,
    dados: {
      kpis,
      periodo: { inicio, fim, dias: periodo, total: totalPeriodo, variacao },
      serie: acessoModelo.serieDiaria(inicio, fim),
      ranking: acessoModelo.ranking(inicio, fim, '', 10),
      dispositivos: acessoModelo.distribuicao('dispositivo', inicio, fim),
      navegadores: acessoModelo.distribuicao('navegador', inicio, fim),
      sistemas: acessoModelo.distribuicao('sistema', inicio, fim),
      recentes: acessoModelo.recentes(6),
      atualizadoEm: new Date().toISOString()
    }
  })
})

const acessos = ctrl((req, res) => {
  const periodoSolicitado = req.query.inicio || req.query.fim
    ? periodoFiltros(req.query.inicio, req.query.fim)
    : periodoFiltros(deslocarDia(diaLocal(), -29), diaLocal())
  if (periodoSolicitado.erro) throw erroHttp(422, periodoSolicitado.erro)

  const filtros = {
    ...periodoSolicitado,
    rota: sanitizarRota(req.query.rota),
    pagina: Number(req.query.pagina) || 1,
    limite: Number(req.query.limite) || 25,
    ordem: sanitizarTexto(req.query.ordem, 20),
    direcao: sanitizarTexto(req.query.direcao, 4)
  }
  res.json({ sucesso: true, dados: acessoModelo.listar(filtros) })
})

const rotas = ctrl((req, res) => {
  res.json({ sucesso: true, dados: acessoModelo.rotasDisponiveis() })
})

function montarRelatorio(req) {
  const nome = sanitizarTexto(req.body?.nome || `Relatório de acessos ${diaLocal()}`, 80)
  const formato = ['csv', 'json', 'pdf'].includes(req.body?.formato) ? req.body.formato : 'json'
  const filtros = periodoFiltros(req.body?.inicio, req.body?.fim)
  if (filtros.erro) throw erroHttp(422, filtros.erro)
  filtros.rota = sanitizarRota(req.body?.rota)

  const dados = acessoModelo.registrosRelatorio({ ...filtros, maximo: 10000 })
  const resumo = {
    ranking: acessoModelo.ranking(filtros.inicio, filtros.fim, filtros.rota, 5),
    dispositivos: acessoModelo.distribuicao('dispositivo', filtros.inicio, filtros.fim)
  }
  return { nome, formato, filtros, dados, resumo }
}

const criarRelatorio = ctrl((req, res) => {
  const relatorio = montarRelatorio(req)
  const id = relatorioModelo.salvar({
    nome: relatorio.nome,
    formato: relatorio.formato,
    filtros: relatorio.filtros,
    resumo: relatorio.resumo,
    dados: relatorio.dados,
    totalRegistros: relatorio.dados.length,
    usuarioId: req.admin.usuario.id
  })
  res.status(201).json({
    sucesso: true,
    mensagem: 'Relatório gerado e salvo no histórico.',
    dados: {
      id,
      nome: relatorio.nome,
      formato: relatorio.formato,
      filtros: relatorio.filtros,
      totalRegistros: relatorio.dados.length,
      criadoEm: new Date().toISOString()
    }
  })
})

const listarRelatorios = ctrl((req, res) => {
  res.json({ sucesso: true, dados: relatorioModelo.listar(req.query.limite) })
})

const buscarRelatorio = ctrl((req, res) => {
  const id = parseId(req.params.id)
  if (!id) throw erroHttp(400, 'ID de relatório inválido.')
  const relatorio = relatorioModelo.buscarPorId(id)
  if (!relatorio) throw erroHttp(404, 'Relatório não encontrado.')
  res.set('Cache-Control', 'no-store')
  res.json({ sucesso: true, dados: relatorio })
})

const baixarRelatorio = ctrl((req, res) => {
  const id = parseId(req.params.id)
  if (!id) throw erroHttp(400, 'ID de relatório inválido.')
  const relatorio = relatorioModelo.buscarPorId(id)
  if (!relatorio) throw erroHttp(404, 'Relatório não encontrado.')
  if (req.query.formato && !['csv', 'json', 'pdf'].includes(req.query.formato)) {
    throw erroHttp(422, 'Formato de exportação inválido.')
  }

  const arquivo = exportar(relatorio, req.query.formato)
  const nome = nomeArquivo(relatorio, arquivo.extensao)
  res.set({
    'Content-Type': arquivo.tipo,
    'Content-Disposition': `attachment; filename="${nome}"`,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  })
  res.send(arquivo.conteudo)
})

const removerRelatorio = ctrl((req, res) => {
  const id = parseId(req.params.id)
  if (!id) throw erroHttp(400, 'ID de relatório inválido.')
  if (!relatorioModelo.remover(id)) throw erroHttp(404, 'Relatório não encontrado.')
  res.json({ sucesso: true, mensagem: 'Relatório removido do histórico.' })
})

const registrarEventoPainel = ctrl((req, res) => {
  const evento = String(req.body?.evento || '').trim().toLowerCase()
  if (evento !== 'painel') throw erroHttp(400, 'Evento administrativo inválido.')

  const agora = new Date()
  const agente = analisarAgente(req.headers['user-agent'] || '')
  acessoModelo.registrar({
    rota: '/admin/painel-integrado',
    metodo: 'POST',
    criado_em: agora.toISOString(),
    dia: diaLocal(agora),
    dispositivo: agente.dispositivo,
    navegador: agente.navegador,
    sistema: agente.sistema,
    ip_hash: anonimizarIp(req),
    status: 202,
    area: 'admin',
    detalhes: 'origem=home'
  })

  res.status(202).json({ sucesso: true })
})

module.exports = {
  registrarEventoPainel,
  login,
  sessao,
  logout,
  dashboard,
  acessos,
  rotas,
  criarRelatorio,
  listarRelatorios,
  buscarRelatorio,
  baixarRelatorio,
  removerRelatorio
}
