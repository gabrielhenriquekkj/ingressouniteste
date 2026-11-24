const estadoAdmin = {
  autenticado: false,
  usuario: null,
  csrf: '',
  periodo: '30',
  rota: '',
  pagina: 1,
  ordem: 'criado_em',
  direcao: 'desc',
  carregando: false,
  ultimaCarga: 0,
  modalAberto: false,
  ultimoFoco: null,
  eventoPainelRegistrado: false
}

const eventosPublicos = new Set([
  'busca',
  'sugestao-curso',
  'notas-corte',
  'custos-cidade',
  'bolsas-auxilios',
  'mercado-estagios',
  'favoritos',
  'detalhes'
])

const ultimoEventoPublico = new Map()

function adminSel(seletor, raiz) {
  return (raiz || document).querySelector(seletor)
}

function adminSelTodos(seletor, raiz) {
  return Array.from((raiz || document).querySelectorAll(seletor))
}

function adminEsc(valor) {
  return escapeHTML(valor)
}

function adminNumero(valor) {
  return new Intl.NumberFormat('pt-BR').format(Number(valor) || 0)
}

function adminDataHora(valor) {
  if (!valor) return '\u2014'
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(valor))
}

function adminDataISO(data) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(data || new Date())
      .filter(parte => parte.type !== 'literal')
      .map(parte => [parte.type, parte.value])
  )
  return `${partes.year}-${partes.month}-${partes.day}`
}

function adminSomarDias(iso, quantidade) {
  const [ano, mes, dia] = String(iso).split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  data.setUTCDate(data.getUTCDate() + quantidade)
  return data.toISOString().slice(0, 10)
}

function adminDefinirTexto(id, valor) {
  const elemento = document.getElementById(id)
  if (elemento) elemento.textContent = valor
}

function adminSalvarCsrf(token) {
  if (!token) return
  estadoAdmin.csrf = token
  try { sessionStorage.setItem('admin_csrf', token) } catch (erro) {}
}

function adminObterCsrf() {
  if (!estadoAdmin.csrf) {
    try { estadoAdmin.csrf = sessionStorage.getItem('admin_csrf') || '' } catch (erro) {}
  }
  return estadoAdmin.csrf
}

function adminLimparCsrf() {
  estadoAdmin.csrf = ''
  try { sessionStorage.removeItem('admin_csrf') } catch (erro) {}
}

async function adminRequisicao(caminho, opcoes) {
  const config = opcoes || {}
  const metodo = config.metodo || 'GET'
  const cabecalhos = { Accept: 'application/json' }
  let corpo

  if (config.corpo !== undefined) {
    cabecalhos['Content-Type'] = 'application/json'
    corpo = JSON.stringify(config.corpo)
  }
  if (!config.semCsrf && metodo !== 'GET') {
    const csrf = adminObterCsrf()
    if (csrf) cabecalhos['X-CSRF-Token'] = csrf
  }

  const resposta = await fetch('/api/admin' + caminho, {
    method: metodo,
    headers: cabecalhos,
    body: corpo,
    credentials: 'same-origin',
    cache: 'no-store'
  })

  let dados = {}
  try { dados = await resposta.json() } catch (erro) {}

  if (!resposta.ok) {
    if (resposta.status === 401 && !config.silent401 && estadoAdmin.autenticado) adminEncerrarSessao(false)
    const falha = new Error(dados.mensagem || 'Não foi possível concluir a solicitação.')
    falha.status = resposta.status
    throw falha
  }
  return dados
}

async function trackEventoPublico(evento, detalhes) {
  if (!eventosPublicos.has(evento)) return
  const chave = evento + ':' + JSON.stringify(detalhes || {})
  const agora = Date.now()
  if (agora - (ultimoEventoPublico.get(chave) || 0) < 1200) return
  ultimoEventoPublico.set(chave, agora)

  try {
    await fetch('/api/telemetria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ evento: evento, detalhes: detalhes || {} })
    })
  } catch (erro) {}
}

window.trackEvento = trackEventoPublico

function adminAplicarSessao(dados) {
  if (!dados) return
  estadoAdmin.autenticado = true
  estadoAdmin.usuario = dados.usuario || null
  adminSalvarCsrf(dados.csrfToken)
  adminDefinirTexto('adminSaudacao', 'Olá, ' + (estadoAdmin.usuario?.nome || 'administrador') + '. Dados de navegação, buscas e interações em tempo real.')
  const aba = adminSel('#abaAdmin')
  if (aba) aba.hidden = false
}

function adminEncerrarSessao(notificar) {
  estadoAdmin.autenticado = false
  estadoAdmin.usuario = null
  estadoAdmin.eventoPainelRegistrado = false
  adminLimparCsrf()
  const aba = adminSel('#abaAdmin')
  if (aba) aba.hidden = true
  adminAlternarAba('publica')
  if (notificar) toast('Sessão administrativa encerrada.', 'info')
}

async function adminVerificarSessao() {
  try {
    const resposta = await adminRequisicao('/session', { silent401: true })
    adminAplicarSessao(resposta.dados)
    if (window.location.hash === '#admin') adminAlternarAba('admin')
  } catch (erro) {}
}

function adminAlternarAba(nome) {
  const ehAdmin = nome === 'admin'
  if (ehAdmin && !estadoAdmin.autenticado) {
    adminAbrirModal()
    return
  }

  const publica = adminSel('#viewPublica')
  const administrativa = adminSel('#viewAdmin')
  if (!publica || !administrativa) return

  publica.hidden = ehAdmin
  administrativa.hidden = !ehAdmin

  const abaPublica = adminSel('#abaPublica')
  const abaAdmin = adminSel('#abaAdmin')
  if (abaPublica) {
    abaPublica.setAttribute('aria-selected', String(!ehAdmin))
    abaPublica.tabIndex = ehAdmin ? -1 : 0
  }
  if (abaAdmin) {
    abaAdmin.setAttribute('aria-selected', String(ehAdmin))
    abaAdmin.tabIndex = ehAdmin ? 0 : -1
  }

  const url = window.location.pathname + window.location.search + (ehAdmin ? '#admin' : '')
  window.history.replaceState(null, '', url)

  if (ehAdmin) {
    adminCarregarPainel()
    adminRegistrarEventoPainel()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function adminAbrirModal() {
  const modal = adminSel('#modalAdmin')
  if (!modal) {
    window.location.href = caminhoBase() + '/index.html#admin'
    return
  }
  if (estadoAdmin.autenticado) {
    adminAlternarAba('admin')
    return
  }

  estadoAdmin.ultimoFoco = document.activeElement
  estadoAdmin.modalAberto = true
  modal.hidden = false
  document.body.style.overflow = 'hidden'
  adminLimparErroLogin()
  window.requestAnimationFrame(() => {
    modal.classList.add('aberto')
    const campo = adminSel('#loginAdminEmail')
    if (campo) campo.focus()
  })
}

function adminFecharModal() {
  const modal = adminSel('#modalAdmin')
  if (!modal) return
  estadoAdmin.modalAberto = false
  modal.classList.remove('aberto')
  document.body.style.overflow = ''
  window.setTimeout(() => { modal.hidden = true }, 180)
  if (estadoAdmin.ultimoFoco && typeof estadoAdmin.ultimoFoco.focus === 'function') {
    estadoAdmin.ultimoFoco.focus()
  }
}

function adminMostrarErroLogin(mensagem) {
  const erro = adminSel('#loginAdminErro')
  if (!erro) return
  erro.textContent = mensagem
  erro.hidden = false
}

function adminLimparErroLogin() {
  const erro = adminSel('#loginAdminErro')
  if (!erro) return
  erro.textContent = ''
  erro.hidden = true
}

async function adminEntrar(evento) {
  evento.preventDefault()
  adminLimparErroLogin()

  const email = String(adminSel('#loginAdminEmail')?.value || '').trim()
  const senha = String(adminSel('#loginAdminSenha')?.value || '')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    adminMostrarErroLogin('Informe um e-mail válido.')
    adminSel('#loginAdminEmail')?.focus()
    return
  }
  if (!senha) {
    adminMostrarErroLogin('Informe a senha administrativa.')
    adminSel('#loginAdminSenha')?.focus()
    return
  }

  const botao = adminSel('#btnLoginAdmin')
  if (botao) botao.disabled = true
  try {
    const resposta = await adminRequisicao('/login', {
      metodo: 'POST',
      corpo: { email: email, senha: senha },
      semCsrf: true,
      silent401: true
    })
    adminAplicarSessao(resposta.dados)
    adminFecharModal()
    adminAlternarAba('admin')
    await adminCarregarPainel(true)
    toast('Acesso administrativo liberado.', 'sucesso')
  } catch (erro) {
    adminMostrarErroLogin(erro.message || 'Falha ao entrar. Verifique suas credenciais.')
  } finally {
    if (botao) botao.disabled = false
  }
}

async function adminRegistrarEventoPainel() {
  if (estadoAdmin.eventoPainelRegistrado || !estadoAdmin.autenticado) return
  estadoAdmin.eventoPainelRegistrado = true
  try {
    await adminRequisicao('/evento', { metodo: 'POST', corpo: { evento: 'painel' } })
  } catch (erro) {}
}

function adminIconeTema() {
  const escuro = document.documentElement.dataset.theme === 'dark'
  return escuro
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/></svg>'
}

function adminAtualizarIconesTema() {
  adminSelTodos('[data-tema-toggle]').forEach(botao => {
    const icone = adminSel('[data-tema-icone]', botao)
    if (icone) icone.innerHTML = adminIconeTema()
    botao.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'))
  })
}

function adminDefinirTema(tema) {
  document.documentElement.dataset.theme = tema
  try { localStorage.setItem('ingresso_tema', tema) } catch (erro) {}
  adminAtualizarIconesTema()
}

function adminBarras(lista, limite) {
  const itens = (lista || []).slice(0, limite || 5)
  if (!itens.length) return '<p class="admin-vazio">Sem dados no período.</p>'
  const maximo = Math.max(1, ...itens.map(item => Number(item.total) || 0))
  return itens.map(item => {
    const total = Number(item.total) || 0
    const largura = Math.max(2, (total / maximo) * 100)
    return '<div class="barra-item">' +
      '<div class="barra-item-topo"><span>' + adminEsc(item.nome || item.rotulo || item.rota || 'Outro') + '</span><strong>' + adminNumero(total) + (item.percentual != null ? ' · ' + item.percentual + '%' : '') + '</strong></div>' +
      '<div class="barra-trilha"><div class="barra-preenchimento" style="width:' + largura.toFixed(1) + '%"></div></div>' +
      '</div>'
  }).join('')
}

function adminGrafico(serie, inicio, fim) {
  const mapa = new Map((serie || []).map(item => [item.dia, Number(item.total) || 0]))
  const dias = []
  for (let dia = inicio; dia <= fim; dia = adminSomarDias(dia, 1)) dias.push(dia)
  if (!dias.length) return '<p class="admin-vazio">Sem dados no período.</p>'

  const largura = 720
  const altura = 230
  const esquerda = 42
  const direita = 14
  const topo = 16
  const base = 36
  const maximo = Math.max(1, ...dias.map(dia => mapa.get(dia) || 0))
  const passo = dias.length > 1 ? (largura - esquerda - direita) / (dias.length - 1) : 0
  const pontos = dias.map((dia, indice) => ({
    dia: dia,
    total: mapa.get(dia) || 0,
    x: esquerda + indice * passo,
    y: topo + (altura - topo - base) * (1 - (mapa.get(dia) || 0) / maximo)
  }))

  const linha = pontos.map((ponto, indice) => (indice ? 'L' : 'M') + ponto.x.toFixed(1) + ' ' + ponto.y.toFixed(1)).join(' ')
  const area = linha + ' L' + pontos[pontos.length - 1].x.toFixed(1) + ' ' + (altura - base) + ' L' + pontos[0].x.toFixed(1) + ' ' + (altura - base) + ' Z'
  const grades = [0, 0.5, 1].map(fator => {
    const y = topo + (altura - topo - base) * (1 - fator)
    return '<line class="grade" x1="' + esquerda + '" y1="' + y.toFixed(1) + '" x2="' + (largura - direita) + '" y2="' + y.toFixed(1) + '"></line>' +
      '<text class="rotulo" x="4" y="' + (y + 3).toFixed(1) + '">' + adminNumero(Math.round(maximo * fator)) + '</text>'
  }).join('')

  const intervalo = Math.max(1, Math.ceil(dias.length / 6))
  const rotulosX = pontos.map((ponto, indice) => {
    if (indice % intervalo !== 0 && indice !== pontos.length - 1) return ''
    return '<text class="rotulo" x="' + ponto.x.toFixed(1) + '" y="' + (altura - 10) + '" text-anchor="middle">' + adminEsc(ponto.dia.slice(5)) + '</text>'
  }).join('')

  const circulos = pontos.map(ponto =>
    '<circle class="ponto" cx="' + ponto.x.toFixed(1) + '" cy="' + ponto.y.toFixed(1) + '" r="4" tabindex="0" role="img" aria-label="' + adminEsc(ponto.dia) + ': ' + adminNumero(ponto.total) + ' acessos"><title>' + adminEsc(ponto.dia) + ' — ' + adminNumero(ponto.total) + ' acessos</title></circle>'
  ).join('')

  return '<svg class="grafico-linha" viewBox="0 0 ' + largura + ' ' + altura + '" role="img" aria-label="Acessos diários de ' + adminEsc(inicio) + ' a ' + adminEsc(fim) + '">' +
    grades + '<path class="area" d="' + area + '"></path><path class="linha" d="' + linha + '"></path>' + rotulosX + circulos + '</svg>'
}

function adminRenderizarDashboard(dados) {
  const kpis = dados.kpis || {}
  const periodo = dados.periodo || {}
  adminDefinirTexto('kpiHoje', adminNumero(kpis.hoje))
  adminDefinirTexto('kpi7', adminNumero(kpis.seteDias))
  adminDefinirTexto('kpi30', adminNumero(kpis.trintaDias))
  adminDefinirTexto('kpiTotal', adminNumero(kpis.total))

  const variacao = periodo.variacao
  const rotulo = variacao == null
    ? estadoAdmin.periodo + ' dias'
    : estadoAdmin.periodo + ' dias · ' + (variacao > 0 ? '+' : '') + variacao + '%'
  adminDefinirTexto('kpi30Rotulo', rotulo)

  const contador = adminSel('#graficoAcessos')
  if (contador) contador.innerHTML = adminGrafico(dados.serie, periodo.inicio, periodo.fim)

  const barras = adminSel('#rankingBarras')
  if (barras) barras.innerHTML = adminBarras(dados.ranking, 6)

  const dispositivos = adminSel('#distDispositivos')
  if (dispositivos) dispositivos.innerHTML = adminBarras(dados.dispositivos, 5)

  const navegadores = adminSel('#distNavegadores')
  if (navegadores) navegadores.innerHTML = adminBarras(dados.navegadores, 5)

  const sistemas = adminSel('#distSistemas')
  if (sistemas) sistemas.innerHTML = adminBarras(dados.sistemas, 5)

  adminDefinirTexto('adminAtualizadoEm', 'Atualizado ' + adminDataHora(dados.atualizadoEm))
}

function adminParametrosPeriodo() {
  const fim = adminDataISO(new Date())
  const inicio = adminSomarDias(fim, -(Number(estadoAdmin.periodo) - 1))
  return { inicio: inicio, fim: fim }
}

function adminRenderizarAcessos(resultado) {
  const corpo = adminSel('#tabelaAcessosCorpo')
  if (!corpo) return
  const itens = resultado.dados || []

  if (!itens.length) {
    corpo.innerHTML = '<tr><td colspan="7" class="admin-vazio">Nenhum acesso encontrado para este filtro.</td></tr>'
  } else {
    corpo.innerHTML = itens.map(item =>
      '<tr>' +
      '<td><strong>' + adminEsc(adminDataHora(item.criado_em)) + '</strong></td>' +
      '<td title="' + adminEsc(item.rota) + '">' + adminEsc(item.rota) + '</td>' +
      '<td>' + adminEsc(item.dispositivo || '\u2014') + '</td>' +
      '<td>' + adminEsc(item.navegador || '\u2014') + '</td>' +
      '<td>' + badge(item.status == null ? '\u2014' : String(item.status), item.status >= 400 ? 'badge-erro' : 'badge-sucesso') + '</td>' +
      '<td>' + adminEsc(item.area || '\u2014') + '</td>' +
      '<td title="' + adminEsc(item.detalhes) + '">' + adminEsc(item.detalhes || '\u2014') + '</td>' +
      '</tr>'
    ).join('')
  }

  adminDefinirTexto('paginaInfo', 'Página ' + resultado.pagina + ' de ' + resultado.paginas + ' · ' + adminNumero(resultado.total) + ' registros')
  const anterior = adminSel('#btnPaginaAnterior')
  const proxima = adminSel('#btnPaginaProxima')
  if (anterior) anterior.disabled = resultado.pagina <= 1
  if (proxima) proxima.disabled = resultado.pagina >= resultado.paginas

  adminSelTodos('[data-ordem]').forEach(botao => {
    const chave = botao.getAttribute('data-ordem')
    const seta = adminSel('span', botao)
    if (seta) seta.textContent = chave === estadoAdmin.ordem ? (estadoAdmin.direcao === 'asc' ? '↑' : '↓') : '↕'
    const th = botao.closest('th')
    if (th) th.setAttribute('aria-sort', chave === estadoAdmin.ordem ? (estadoAdmin.direcao === 'asc' ? 'ascending' : 'descending') : 'none')
  })
}

async function adminCarregarAcessos() {
  if (!estadoAdmin.autenticado) return
  const periodo = adminParametrosPeriodo()
  const params = new URLSearchParams({
    inicio: periodo.inicio,
    fim: periodo.fim,
    rota: estadoAdmin.rota,
    pagina: String(estadoAdmin.pagina),
    limite: '12',
    ordem: estadoAdmin.ordem,
    direcao: estadoAdmin.direcao
  })
  try {
    const resposta = await adminRequisicao('/acessos?' + params.toString())
    adminRenderizarAcessos(resposta.dados)
  } catch (erro) {
    if (erro.status !== 401) toast('Não foi possível carregar os acessos.', 'erro')
  }
}

function adminPopularRotas(rotas) {
  const lista = rotas || []
  const destinos = [adminSel('#filtroRotaAdmin'), adminSel('#relatorioRota')].filter(Boolean)
  destinos.forEach(destino => {
    const atual = destino.value
    destino.innerHTML = '<option value="">Todas as rotas</option>' + lista.map(item =>
      '<option value="' + adminEsc(item.rota) + '">' + adminEsc(item.rota) + ' (' + adminNumero(item.total) + ')</option>'
    ).join('')
    destino.value = destino.id === 'filtroRotaAdmin' ? estadoAdmin.rota : atual
  })
}

async function adminCarregarRotas() {
  if (!estadoAdmin.autenticado) return
  try {
    const resposta = await adminRequisicao('/rotas')
    adminPopularRotas(resposta.dados)
  } catch (erro) {}
}

async function adminCarregarPainel(forcar) {
  if (!estadoAdmin.autenticado || estadoAdmin.carregando) return
  if (!forcar && Date.now() - estadoAdmin.ultimaCarga < 15000) return

  estadoAdmin.carregando = true
  const carregando = adminSel('#adminCarregando')
  if (carregando) carregando.hidden = false

  try {
    const [dashboard, rotas] = await Promise.all([
      adminRequisicao('/dashboard?periodo=' + encodeURIComponent(estadoAdmin.periodo)),
      adminRequisicao('/rotas')
    ])
    adminRenderizarDashboard(dashboard.dados)
    adminPopularRotas(rotas.dados)
    await Promise.all([adminCarregarAcessos(), adminCarregarHistorico()])
    estadoAdmin.ultimaCarga = Date.now()
  } catch (erro) {
    if (erro.status !== 401) toast('Não foi possível carregar o painel administrativo.', 'erro')
  } finally {
    estadoAdmin.carregando = false
    if (carregando) carregando.hidden = true
  }
}

function adminRenderizarHistorico(lista) {
  const area = adminSel('#historicoRelatorios')
  if (!area) return
  if (!lista.length) {
    area.innerHTML = '<p class="admin-vazio">Nenhum relatório gerado ainda.</p>'
    return
  }

  area.innerHTML = lista.map(item =>
    '<div class="report-item">' +
    '<div style="min-width:0"><strong>' + adminEsc(item.nome) + '</strong>' +
    '<small>' + adminEsc(String(item.formato).toUpperCase()) + ' · ' + adminNumero(item.total_registros) + ' registros · ' + adminEsc(adminDataHora(item.criado_em)) + '</small></div>' +
    '<div class="report-item-acoes">' +
    '<button type="button" class="btn btn-quiet btn-sm" data-relatorio="' + item.id + '" data-acao="ver">Ver</button>' +
    '<button type="button" class="btn btn-outline btn-sm" data-relatorio="' + item.id + '" data-acao="csv">CSV</button>' +
    '<button type="button" class="btn btn-outline btn-sm" data-relatorio="' + item.id + '" data-acao="json">JSON</button>' +
    '<button type="button" class="btn btn-outline btn-sm" data-relatorio="' + item.id + '" data-acao="pdf">PDF</button>' +
    '<button type="button" class="btn btn-danger btn-sm" data-relatorio="' + item.id + '" data-acao="excluir" aria-label="Excluir ' + adminEsc(item.nome) + '">Excluir</button>' +
    '</div></div>'
  ).join('')
}

async function adminCarregarHistorico() {
  if (!estadoAdmin.autenticado) return
  try {
    const resposta = await adminRequisicao('/relatorios?limite=12')
    adminRenderizarHistorico(resposta.dados || [])
  } catch (erro) {
    if (erro.status !== 401) toast('Não foi possível carregar o histórico.', 'erro')
  }
}

async function adminBaixarRelatorio(id, formato) {
  try {
    const resposta = await fetch('/api/admin/relatorios/' + encodeURIComponent(id) + '/download?formato=' + encodeURIComponent(formato), {
      credentials: 'same-origin',
      cache: 'no-store'
    })
    if (!resposta.ok) throw new Error('Falha ao baixar o relatório.')
    const blob = await resposta.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relatorio-' + id + '.' + formato
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (erro) {
    toast(erro.message || 'Falha ao baixar o relatório.', 'erro')
  }
}

function adminRenderizarDetalhe(relatorio) {
  const area = adminSel('#detalheRelatorio')
  if (!area) return
  const filtros = relatorio.filtros || {}
  const ranking = relatorio.resumo?.ranking || []
  const amostra = (relatorio.dados || []).slice(0, 8)

  area.innerHTML = '<h4>' + adminEsc(relatorio.nome) + '</h4>' +
    '<div class="detalhe-linhas">' +
    '<div class="detalhe-linha"><span>Período</span><strong>' + adminEsc(filtros.inicio || '\u2014') + ' a ' + adminEsc(filtros.fim || '\u2014') + '</strong></div>' +
    '<div class="detalhe-linha"><span>Rota</span><strong>' + adminEsc(filtros.rota || 'Todas') + '</strong></div>' +
    '<div class="detalhe-linha"><span>Registros</span><strong>' + adminNumero(relatorio.total_registros ?? (relatorio.dados || []).length) + '</strong></div>' +
    '</div>' +
    (ranking.length ? '<p style="margin-top:.8rem"><strong>Top rotas:</strong> ' + ranking.map(item => adminEsc(item.rota) + ' (' + adminNumero(item.total) + ')').join(' · ') + '</p>' : '') +
    (amostra.length ? '<p style="margin-top:.8rem"><strong>Amostra recente:</strong></p><div class="detalhe-linhas">' + amostra.map(item =>
      '<div class="detalhe-linha"><span>' + adminEsc(item.rota) + '</span><strong>' + adminEsc(adminDataHora(item.criadoEm)) + '</strong></div>'
    ).join('') + '</div>' : '')
  area.hidden = false
}

function adminMostrarErroRelatorio(mensagem) {
  const erro = adminSel('#relatorioErro')
  if (!erro) return
  erro.textContent = mensagem
  erro.hidden = !mensagem
}

async function adminGerarRelatorio(evento) {
  evento.preventDefault()
  adminMostrarErroRelatorio('')

  const inicio = adminSel('#relatorioInicio')?.value
  const fim = adminSel('#relatorioFim')?.value
  if (!inicio || !fim) {
    adminMostrarErroRelatorio('Informe o período do relatório.')
    return
  }
  if (inicio > fim) {
    adminMostrarErroRelatorio('A data inicial deve ser menor ou igual à final.')
    return
  }

  const botao = adminSel('#btnGerarRelatorio')
  if (botao) botao.disabled = true
  try {
    const resposta = await adminRequisicao('/relatorios', {
      metodo: 'POST',
      corpo: {
        nome: adminSel('#relatorioNome')?.value || undefined,
        inicio: inicio,
        fim: fim,
        rota: adminSel('#relatorioRota')?.value || '',
        formato: adminSel('input[name="formato"]:checked')?.value || 'json'
      }
    })
    toast(resposta.mensagem || 'Relatório gerado.', 'sucesso')
    await adminCarregarHistorico()
  } catch (erro) {
    adminMostrarErroRelatorio(erro.message || 'Falha ao gerar o relatório.')
  } finally {
    if (botao) botao.disabled = false
  }
}

function adminVincularEventos() {
  document.addEventListener('click', function (evento) {
    const abrir = evento.target.closest('[data-abrir-admin]')
    if (abrir) {
      evento.preventDefault()
      if (adminSel('#viewAdmin')) adminAlternarAba(estadoAdmin.autenticado ? 'admin' : 'publica')
      if (!estadoAdmin.autenticado) adminAbrirModal()
      return
    }

    const tema = evento.target.closest('[data-tema-toggle]')
    if (tema) {
      adminDefinirTema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')
      return
    }

    const rastreavel = evento.target.closest('[data-track-event]')
    if (rastreavel) {
      trackEventoPublico(rastreavel.getAttribute('data-track-event'), {
        origem: window.location.pathname.includes('/paginas/') ? 'detalhes' : 'home'
      })
    }

    const secao = evento.target.closest('[data-track-secao]')
    if (secao) {
      trackEventoPublico('detalhes', { secao: secao.getAttribute('data-track-secao') })
    }
  })

  document.addEventListener('keydown', function (evento) {
    if (!estadoAdmin.modalAberto) return
    if (evento.key === 'Escape') {
      adminFecharModal()
      return
    }
    if (evento.key !== 'Tab') return

    const modal = adminSel('#modalAdmin')
    if (!modal) return
    const focaveis = adminSelTodos('button:not([disabled]), input:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex="-1"])', modal)
      .filter(elemento => elemento.offsetParent !== null)
    if (!focaveis.length) return
    const primeiro = focaveis[0]
    const ultimo = focaveis[focaveis.length - 1]
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault()
      primeiro.focus()
    }
  })

  adminSel('#formLoginAdmin')?.addEventListener('submit', adminEntrar)
  adminSel('#btnFecharModal')?.addEventListener('click', adminFecharModal)
  adminSel('#btnCancelarLogin')?.addEventListener('click', adminFecharModal)
  adminSel('#modalAdmin')?.addEventListener('click', function (evento) {
    if (evento.target === adminSel('#modalAdmin')) adminFecharModal()
  })

  adminSel('#btnMostrarSenha')?.addEventListener('click', function () {
    const campo = adminSel('#loginAdminSenha')
    const botao = adminSel('#btnMostrarSenha')
    if (!campo || !botao) return
    const mostrar = campo.type === 'password'
    campo.type = mostrar ? 'text' : 'password'
    botao.setAttribute('aria-pressed', String(mostrar))
    botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha')
    campo.focus()
  })

  adminSel('#abaPublica')?.addEventListener('click', () => adminAlternarAba('publica'))
  adminSel('#abaAdmin')?.addEventListener('click', () => adminAlternarAba('admin'))
  adminSel('#btnLogoutAdmin')?.addEventListener('click', async () => {
    try { await adminRequisicao('/logout', { metodo: 'POST' }) } catch (erro) {}
    adminEncerrarSessao(true)
  })
  adminSel('#btnAtualizarAdmin')?.addEventListener('click', () => adminCarregarPainel(true))

  adminSel('#selectPeriodo')?.addEventListener('change', function (evento) {
    estadoAdmin.periodo = evento.target.value
    estadoAdmin.pagina = 1
    adminCarregarPainel(true)
  })

  adminSel('#btnFiltrarAcessos')?.addEventListener('click', function () {
    estadoAdmin.rota = adminSel('#filtroRotaAdmin')?.value || ''
    estadoAdmin.pagina = 1
    adminCarregarAcessos()
  })

  adminSel('#btnPaginaAnterior')?.addEventListener('click', function () {
    if (estadoAdmin.pagina > 1) {
      estadoAdmin.pagina -= 1
      adminCarregarAcessos()
    }
  })

  adminSel('#btnPaginaProxima')?.addEventListener('click', function () {
    estadoAdmin.pagina += 1
    adminCarregarAcessos()
  })

  adminSelTodos('[data-ordem]').forEach(botao => {
    botao.addEventListener('click', function () {
      const chave = botao.getAttribute('data-ordem')
      if (estadoAdmin.ordem === chave) {
        estadoAdmin.direcao = estadoAdmin.direcao === 'asc' ? 'desc' : 'asc'
      } else {
        estadoAdmin.ordem = chave
        estadoAdmin.direcao = 'asc'
      }
      estadoAdmin.pagina = 1
      adminCarregarAcessos()
    })
  })

  adminSel('#formRelatorio')?.addEventListener('submit', adminGerarRelatorio)

  adminSel('#historicoRelatorios')?.addEventListener('click', async function (evento) {
    const botao = evento.target.closest('[data-relatorio][data-acao]')
    if (!botao) return
    const id = botao.getAttribute('data-relatorio')
    const acao = botao.getAttribute('data-acao')

    if (acao === 'csv' || acao === 'json' || acao === 'pdf') {
      adminBaixarRelatorio(id, acao)
      return
    }
    if (acao === 'ver') {
      try {
        const resposta = await adminRequisicao('/relatorios/' + encodeURIComponent(id))
        adminRenderizarDetalhe(resposta.dados)
      } catch (erro) {
        toast('Não foi possível abrir o relatório.', 'erro')
      }
      return
    }
    if (acao === 'excluir' && window.confirm('Excluir este relatório do histórico?')) {
      try {
        await adminRequisicao('/relatorios/' + encodeURIComponent(id), { metodo: 'DELETE' })
        const detalhe = adminSel('#detalheRelatorio')
        if (detalhe) detalhe.hidden = true
        await adminCarregarHistorico()
        toast('Relatório removido.', 'sucesso')
      } catch (erro) {
        toast('Não foi possível excluir o relatório.', 'erro')
      }
    }
  })

  window.addEventListener('hashchange', function () {
    if (window.location.hash === '#admin' && estadoAdmin.autenticado) adminAlternarAba('admin')
  })

  window.setInterval(function () {
    const painel = adminSel('#viewAdmin')
    if (estadoAdmin.autenticado && painel && !painel.hidden && !document.hidden) adminCarregarPainel()
  }, 30000)
}

function adminIniciar() {
  adminAtualizarIconesTema()
  adminVincularEventos()

  const inicio = adminSel('#relatorioInicio')
  const fim = adminSel('#relatorioFim')
  if (inicio) inicio.value = adminSomarDias(adminDataISO(new Date()), -29)
  if (fim) fim.value = adminDataISO(new Date())

  adminVerificarSessao()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', adminIniciar)
} else {
  adminIniciar()
}
