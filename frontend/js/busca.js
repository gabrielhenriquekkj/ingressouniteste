// busca.js — Lógica da Home: filtros (RF1), debounce (RNF2), render de cards e skeleton

const POR_PAGINA = 20
let cacheBusca = new Map()
let listaCompleta = []
let paginaAtual = 0
let totalResultados = 0

document.addEventListener('DOMContentLoaded', iniciarPaginaBusca)

function iniciarPaginaBusca() {
  montarNavbar('home')
  vincularEventos()
  executarBusca()
}

function vincularEventos() {
  const formBusca = document.getElementById('formBusca')
  const inputNome = document.getElementById('filtroNome')
  const btnCarregarMais = document.getElementById('btnCarregarMais')
  const btnLimpar = document.getElementById('btnLimparFiltros')

  formBusca.addEventListener('submit', function (evento) {
    evento.preventDefault()
    fecharSugestoes()
    paginaAtual = 0
    executarBusca()
  })

  let temporizadorSugestoes = null
  inputNome.addEventListener('input', debounce(function () {
    paginaAtual = 0
    executarBusca()
    buscarSugestoes(inputNome.value.trim())
  }, 300))

  inputNome.addEventListener('focus', function () {
    if (inputNome.value.trim().length >= 2) {
      buscarSugestoes(inputNome.value.trim())
    }
  })

  inputNome.addEventListener('keydown', function (evento) {
    const lista = document.getElementById('listaSugestoes')
    if (!lista || lista.classList.contains('hidden')) return
    const itens = lista.querySelectorAll('[data-sugestao]')
    const ativo = lista.querySelector('[data-ativo="true"]')
    let indice = Array.from(itens).indexOf(ativo)

    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      if (ativo) ativo.removeAttribute('data-ativo')
      indice = (indice + 1) % itens.length
      itens[indice].setAttribute('data-ativo', 'true')
      itens[indice].scrollIntoView({ block: 'nearest' })
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      if (ativo) ativo.removeAttribute('data-ativo')
      indice = (indice - 1 + itens.length) % itens.length
      itens[indice].setAttribute('data-ativo', 'true')
      itens[indice].scrollIntoView({ block: 'nearest' })
    } else if (evento.key === 'Enter' && ativo) {
      evento.preventDefault()
      ativo.click()
    } else if (evento.key === 'Escape') {
      fecharSugestoes()
    }
  })

  document.addEventListener('click', function (evento) {
    if (!evento.target.closest('#filtroNome') && !evento.target.closest('#areaSugestoes')) {
      fecharSugestoes()
    }
  })

  document.getElementById('filtroEstado').addEventListener('change', function () {
    paginaAtual = 0
    executarBusca()
  })

  document.getElementById('filtroCategoria').addEventListener('change', function () {
    paginaAtual = 0
    executarBusca()
  })

  if (btnLimpar) {
    btnLimpar.addEventListener('click', function () {
      document.getElementById('filtroNome').value = ''
      document.getElementById('filtroEstado').value = ''
      document.getElementById('filtroCategoria').value = ''
      paginaAtual = 0
      executarBusca()
    })
  }

  if (btnCarregarMais) {
    btnCarregarMais.addEventListener('click', function () {
      executarBusca(true)
    })
  }
}

function obterFiltros() {
  return {
    q: document.getElementById('filtroNome').value.trim(),
    uf: document.getElementById('filtroEstado').value,
    categoria: document.getElementById('filtroCategoria').value
  }
}

async function buscarCursos(filtros, adicionar) {
  const params = new URLSearchParams()
  if (filtros.q) params.set('q', filtros.q)
  if (filtros.uf) params.set('estado', filtros.uf)
  if (filtros.categoria) params.set('categoria', filtros.categoria)
  params.set('page', adicionar ? Math.ceil((paginaAtual + POR_PAGINA) / POR_PAGINA) : 1)
  params.set('limit', POR_PAGINA)

  try {
    const resultado = await api('GET', '/busca?' + params.toString())
    if (!resultado.dados || !resultado.dados.instituicoes || !resultado.dados.cursos) {
      return { cursos: [], total: 0 }
    }
    const todosCursos = [...(resultado.dados.cursos || []), ...(resultado.dados.instituicoes || [])]
    return {
      cursos: todosCursos,
      total: (resultado.paginacao ? resultado.paginacao.total_cursos : 0) + (resultado.paginacao ? resultado.paginacao.total_instituicoes : 0)
    }
  } catch (e) {
    throw e
  }
}

async function executarBusca(adicionar) {
  const area = document.getElementById('areaResultados')
  const resumo = document.getElementById('resumoResultados')
  const filtros = obterFiltros()

  if (!adicionar) {
    cacheBusca.clear()
    area.innerHTML = skeleton(3)
    resumo.textContent = 'Buscando...'
  }

  try {
    const resultado = await buscarCursos(filtros, adicionar)
    const cursos = resultado.cursos

    if (adicionar) {
      listaCompleta = listaCompleta.concat(cursos)
      paginaAtual = listaCompleta.length
    } else {
      listaCompleta = cursos
      totalResultados = resultado.total
      paginaAtual = cursos.length
    }

    renderizarResultados(cursos, adicionar)
  } catch (erro) {
    if (!adicionar) {
      area.innerHTML = estadoErro(erro.message || 'Não foi possível buscar os cursos.')
      resumo.textContent = ''
    }
    atualizarBotaoCarregarMais()
  }
}

function renderizarResultados(cursos, adicionar) {
  const area = document.getElementById('areaResultados')
  const resumo = document.getElementById('resumoResultados')

  if (!adicionar) {
    if (listaCompleta.length === 0) {
      area.innerHTML = estadoVazio('Nenhum curso encontrado com os filtros selecionados. Tente modificar a busca.')
      resumo.textContent = ''
    } else {
      resumo.textContent = totalResultados + (totalResultados === 1 ? ' resultado encontrado' : ' resultados encontrados')
      area.innerHTML = listaCompleta.map(function (curso) { return cardResultado(curso) }).join('')
    }
  } else if (cursos.length > 0) {
    area.insertAdjacentHTML('beforeend', cursos.map(function (curso) { return cardResultado(curso) }).join(''))
  }

  atualizarBotaoCarregarMais()
}

function atualizarBotaoCarregarMais() {
  const areaCarregarMais = document.getElementById('areaCarregarMais')
  if (!areaCarregarMais) return
  const temMais = listaCompleta.length < totalResultados
  areaCarregarMais.classList.toggle('hidden', !temMais)
}

let sugestoesCache = new Map()

async function buscarSugestoes(termo) {
  const area = document.getElementById('areaSugestoes')
  if (!area) return
  if (!termo || termo.length < 2) { fecharSugestoes(); return }

  if (sugestoesCache.has(termo.toLowerCase())) {
    renderizarSugestoes(sugestoesCache.get(termo.toLowerCase()))
    return
  }

  try {
    const resultado = await api('GET', '/sugestoes?q=' + encodeURIComponent(termo) + '&limite=8')
    const dados = resultado.dados || []
    sugestoesCache.set(termo.toLowerCase(), dados)
    renderizarSugestoes(dados)
  } catch (e) {
    fecharSugestoes()
  }
}

function renderizarSugestoes(dados) {
  const area = document.getElementById('areaSugestoes')
  if (!area) return
  if (!dados || dados.length === 0) { fecharSugestoes(); return }

  const base = caminhoBase()
  let html = ''
  for (const item of dados) {
    const href = item.tipo === 'curso'
      ? base + '/paginas/detalhes.html?id=' + item.id
      : base + '/paginas/detalhes.html?id=' + item.id
    const icone = item.tipo === 'curso'
      ? '<svg class="w-4 h-4 text-indigo-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15v4M10 11v8M16 7v12M22 4v16"/></svg>'
      : '<svg class="w-4 h-4 text-orange-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>'
    const tipoLabel = item.tipo === 'curso'
      ? '<span class="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Curso</span>'
      : '<span class="text-[10px] font-bold uppercase tracking-wider text-orange-500">Institui\u00e7\u00e3o</span>'

    html += '<a href="' + href + '" data-sugestao class="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition cursor-pointer no-underline">' +
      icone +
      '<div class="flex-1 min-w-0">' +
      '<div class="flex items-center gap-2">' +
      tipoLabel +
      '<span class="text-sm font-semibold text-gray-900 truncate">' + escapeHTML(item.texto) + '</span>' +
      '</div>' +
      (item.subtitulo ? '<span class="text-xs text-gray-500 truncate block">' + escapeHTML(item.subtitulo) + '</span>' : '') +
      '</div>' +
      '<svg class="w-4 h-4 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>' +
      '</a>'
  }

  area.innerHTML = html
  area.classList.remove('hidden')
}

function fecharSugestoes() {
  const area = document.getElementById('areaSugestoes')
  if (area) {
    area.classList.add('hidden')
    area.innerHTML = ''
  }
}
