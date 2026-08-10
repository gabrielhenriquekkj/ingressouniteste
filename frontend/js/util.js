// util.js — Funcoes utilitarias compartilhadas por todas as paginas

function escapeHTML(texto) {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(texto || ''))
  return div.innerHTML
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
  const cores = tipo === 'sucesso'
    ? 'bg-green-600 text-white'
    : tipo === 'erro'
      ? 'bg-red-600 text-white'
      : 'bg-gray-800 text-white'
  elemento.className = 'fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold ' + cores + ' mostrar'
  elemento.textContent = mensagem
  clearTimeout(elemento._temporizador)
  elemento._temporizador = setTimeout(() => {
    elemento.classList.remove('mostrar')
  }, 3500)
}

function formatarMoeda(valor) {
  if (valor == null || valor === '') return '\u2014'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function badge(texto, classes) {
  return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ' + classes + '">' + escapeHTML(texto) + '</span>'
}

function corDemanda(demanda) {
  const d = String(demanda).toLowerCase()
  if (d === 'alta') return 'bg-green-100 text-green-800'
  if (d === 'media' || d === 'm\u00e9dia') return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

function rotuloDemanda(demanda) {
  const d = String(demanda).toLowerCase()
  if (d === 'alta') return 'Alta demanda'
  if (d === 'media' || d === 'm\u00e9dia') return 'M\u00e9dia demanda'
  return 'Baixa demanda'
}

function skeleton(quantidade) {
  return Array.from({ length: quantidade }, () =>
    '<div class="skeleton rounded-2xl h-44 w-full"></div>'
  ).join('')
}

function estadoVazio(mensagem) {
  return '<div class="col-span-full text-center py-16">' +
    '<div class="text-5xl mb-4">&#128218;</div>' +
    '<p class="text-gray-500 text-lg max-w-md mx-auto">' + escapeHTML(mensagem) + '</p>' +
    '</div>'
}

function estadoErro(mensagem) {
  return '<div class="col-span-full text-center py-16">' +
    '<div class="text-5xl mb-4">&#9888;&#65039;</div>' +
    '<p class="text-red-600 font-semibold text-lg">' + escapeHTML(mensagem) + '</p>' +
    '</div>'
}

function cardInfo(icone, titulo, valor, destaque) {
  const classes = destaque
    ? 'bg-indigo-50 ring-2 ring-indigo-300 col-span-full'
    : 'bg-white ring-1 ring-gray-200'
  return '<div class="' + classes + ' rounded-2xl p-5">' +
    '<div class="flex items-center gap-2 text-gray-500 text-sm mb-1">' +
    '<span class="text-indigo-600">' + icone + '</span>' +
    escapeHTML(titulo) +
    '</div>' +
    '<p class="text-xl font-bold text-gray-900">' + escapeHTML(String(valor)) + '</p>' +
    '</div>'
}

const ICONES = {
  casa: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
  comida: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></svg>',
  onibus: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>',
  cartao: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  moeda: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8"/></svg>',
  grafico: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',
  mala: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 00-8 0v2"/></svg>',
  estrela: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
}

function montarNavbar(paginaAtiva) {
  const base = caminhoBase()
  const links = [
    { chave: 'home', href: base + '/index.html', rotulo: 'Busca' },
    { chave: 'favoritos', href: base + '/paginas/favoritos.html', rotulo: 'Favoritos' }
  ]
  const itens = links.map((link) => {
    const ativo = link.chave === paginaAtiva
    const cls = ativo
      ? 'text-indigo-700 font-bold border-b-2 border-indigo-700 pb-0.5'
      : 'text-gray-600 hover:text-indigo-600 font-medium'
    return '<a href="' + link.href + '" class="text-sm ' + cls + '">' + link.rotulo + '</a>'
  }).join('')

  document.getElementById('navbar').innerHTML =
    '<header class="fixed top-0 left-0 w-full bg-white/90 backdrop-blur z-50 border-b border-gray-100 shadow-sm">' +
    '<div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">' +
    '<a href="' + base + '/index.html" class="text-lg font-extrabold text-indigo-700 flex items-center gap-2">' +
    '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 15v4M10 11v8M16 7v12M22 4v16"/></svg>' +
    'Ingresso Universit\u00e1rio</a>' +
    '<nav class="flex items-center gap-5">' + itens + '</nav>' +
    '</div></header>'
}

function atualizarContadorFavoritos() {
  const contador = document.getElementById('contadorFavoritos')
  if (!contador) return
  const qtd = obterFavoritosLocal().length
  contador.textContent = qtd > 0 ? qtd : ''
  contador.classList.toggle('hidden', qtd === 0)
}
