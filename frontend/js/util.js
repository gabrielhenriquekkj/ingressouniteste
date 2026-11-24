const _divEscape = document.createElement('div')

function escapeHTML(texto) {
  if (texto == null) return ''
  _divEscape.textContent = String(texto)
  return _divEscape.innerHTML
}

function gerarUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function debounce(func, atraso) {
  let temporizador
  return function (...args) {
    clearTimeout(temporizador)
    temporizador = setTimeout(() => func.apply(this, args), atraso)
  }
}

function pegarParametroURL(chave) {
  return new URLSearchParams(window.location.search).get(chave)
}

function caminhoBase() {
  const caminho = window.location.pathname
  if (caminho.includes('/paginas/')) return '..'
  return '.'
}

function toast(mensagem, tipo) {
  let elemento = document.getElementById('toast')
  if (!elemento) {
    elemento = document.createElement('div')
    elemento.id = 'toast'
    elemento.setAttribute('role', 'status')
    elemento.setAttribute('aria-live', 'polite')
    document.body.appendChild(elemento)
  }
  elemento.className = 'mostrar'
  elemento.dataset.tipo = tipo || 'info'
  elemento.textContent = mensagem
  clearTimeout(elemento._temporizador)
  elemento._temporizador = setTimeout(() => {
    elemento.classList.remove('mostrar')
  }, 3500)
}

function formatarMoeda(valor) {
  if (valor == null || valor === '' || isNaN(Number(valor))) return '\u2014'
  return Number(valor).toLocaleString(obterLocale(), { style: 'currency', currency: 'BRL' })
}

function badge(texto, classes) {
  let extra = ''
  if (/green|emerald|success/i.test(String(classes || ''))) extra = ' badge-sucesso'
  else if (/yellow|amber|warn/i.test(String(classes || ''))) extra = ' badge-alerta'
  else if (/red|rose|danger|error/i.test(String(classes || ''))) extra = ' badge-erro'
  return '<span class="badge' + extra + '">' + escapeHTML(texto) + '</span>'
}

function corDemanda(demanda) {
  const d = String(demanda).toLowerCase()
  if (d === 'alta') return 'badge-sucesso'
  if (d === 'media' || d === 'm\u00e9dia') return 'badge-alerta'
  return 'badge-erro'
}

function rotuloDemanda(demanda) {
  const d = String(demanda).toLowerCase()
  if (d === 'alta') return t('demanda.alta')
  if (d === 'media' || d === 'm\u00e9dia') return t('demanda.media')
  return t('demanda.baixa')
}

function skeleton(quantidade) {
  return Array.from({ length: quantidade }, () =>
    '<div class="skeleton" style="height:11rem"></div>'
  ).join('')
}

function estadoVazio(mensagem) {
  return '<div class="estado-vazio">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 004 21.5z"/><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/></svg>' +
    '<p>' + escapeHTML(mensagem) + '</p>' +
    '</div>'
}

function estadoErro(mensagem) {
  return '<div class="estado-vazio">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3l9 16H3z"/><path d="M12 9v5M12 17.5h.01"/></svg>' +
    '<p style="color:var(--danger);font-weight:700">' + escapeHTML(mensagem) + '</p>' +
    '</div>'
}

function cardInfo(icone, titulo, valor, destaque) {
  const classes = destaque ? 'kpi-card' : 'app-card'
  return '<div class="' + classes + '">' +
    '<div style="display:flex;align-items:center;gap:.5rem;color:var(--text-muted);font-size:.82rem;margin-bottom:.35rem">' +
    '<span style="color:var(--primary)">' + icone + '</span>' + escapeHTML(titulo) +
    '</div>' +
    '<strong style="font-size:1.15rem;letter-spacing:-.02em">' + escapeHTML(String(valor)) + '</strong>' +
    '</div>'
}

const ICONES = {
  casa: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
  comida: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></svg>',
  onibus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>',
  cartao: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  moeda: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8"/></svg>',
  grafico: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',
  mala: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 00-8 0v2"/></svg>',
  estrela: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  estrelaVazia: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
}

let paginaNavbarAtual = ''

document.addEventListener('idioma:alterado', function () {
  if (document.getElementById('navbar')) montarNavbar(paginaNavbarAtual)
})

function montarNavbar(paginaAtiva) {
  paginaNavbarAtual = paginaAtiva
  const base = caminhoBase()
  const chaveAtiva = paginaAtiva === 'detalhes' ? 'home' : paginaAtiva
  const qtdFavoritos = obterFavoritosLocal().length
  const badgeFav = qtdFavoritos > 0
    ? '<span id="contadorFavoritos" class="badge">' + qtdFavoritos + '</span>'
    : '<span id="contadorFavoritos" class="badge" hidden></span>'
  const tema = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  const iconeTema = tema === 'dark'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/></svg>'
  const links = [
    { chave: 'home', href: base + '/index.html', chaveRotulo: 'nav.busca', rotulo: t('nav.busca'), badge: '' },
    { chave: 'favoritos', href: base + '/paginas/favoritos.html', chaveRotulo: 'nav.favoritos', rotulo: t('nav.favoritos'), badge: badgeFav }
  ]
  const itens = links.map((link) => {
    const ativo = link.chave === chaveAtiva
    return '<a href="' + link.href + '" class="nav-link' + (ativo ? ' ativo' : '') + '"' + (ativo ? ' aria-current="page"' : '') + '>' +
      '<span data-i18n="' + link.chaveRotulo + '">' + link.rotulo + '</span>' + link.badge + '</a>'
  }).join('')

  document.getElementById('navbar').innerHTML =
    '<header class="app-header">' +
    '<div class="app-container-wide navbar">' +
    '<a href="' + base + '/index.html" class="brand" aria-label="' + escapeHTML(t('nav.marca')) + '">' +
    '<span class="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M4 15v4M10 11v8M16 7v12M22 4v16"/></svg></span>' +
    '<span class="brand-text"><span class="sm:hidden" data-i18n="nav.marcaCurta">' + t('nav.marcaCurta') + '</span>' +
    '<span class="hidden sm:inline" data-i18n="nav.marca">' + t('nav.marca') + '</span></span>' +
    '</a>' +
    '<div class="nav-actions">' +
    '<nav class="nav-links" aria-label="Navegação principal">' + itens + '</nav>' +
    '<button type="button" id="btnAbrirAdmin" class="btn btn-quiet" data-abrir-admin aria-label="Abrir área administrativa">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>' +
    '<span data-i18n="nav.admin">Área Admin</span></button>' +
    '<button type="button" class="icon-btn" data-tema-toggle aria-label="' + escapeHTML(t('nav.tema')) + '" aria-pressed="' + (tema === 'dark') + '">' +
    '<span data-tema-icone>' + iconeTema + '</span></button>' +
    montarSeletorIdioma() +
    '</div>' +
    '</div></header>'
}

function atualizarContadorFavoritos() {
  const contador = document.getElementById('contadorFavoritos')
  if (!contador) return
  const qtd = obterFavoritosLocal().length
  contador.textContent = qtd > 0 ? qtd : ''
  contador.hidden = qtd === 0
}
