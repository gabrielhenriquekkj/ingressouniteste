// busca.js — Lógica da Home: filtros (RF1), debounce (RNF2), render de cards e skeleton

const POR_PAGINA = 20
let cacheBusca = new Map()
let listaCompleta = []
let paginaAtual = 0
let totalResultados = 0
let buscaCarregada = false

document.addEventListener('DOMContentLoaded', iniciarPaginaBusca)

document.addEventListener('idioma:alterado', function () {
  if (!buscaCarregada) return
  renderizarResultados([], false)
  fecharSugestoes()
})

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
    const lista = document.getElementById('areaSugestoes')
    if (!lista || lista.hidden) return
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

  if (!adicionar && (filtros.q || filtros.uf || filtros.categoria) && typeof trackEvento === 'function') {
    trackEvento('busca', {
      uf: filtros.uf,
      categoria: filtros.categoria,
      temTermo: Boolean(filtros.q)
    })
  }

  if (!adicionar) {
    cacheBusca.clear()
    buscaCarregada = false
    area.innerHTML = skeleton(3)
    resumo.textContent = t('resultados.buscando')
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
      area.innerHTML = estadoErro(erro.message || t('resultados.erro'))
      resumo.textContent = ''
    }
    atualizarBotaoCarregarMais()
  }
}

function renderizarResultados(cursos, adicionar) {
  const area = document.getElementById('areaResultados')
  const resumo = document.getElementById('resumoResultados')

  if (!adicionar) {
    buscaCarregada = true
    if (listaCompleta.length === 0) {
      area.innerHTML = estadoVazio(t('resultados.vazio'))
      resumo.textContent = ''
    } else {
      resumo.textContent = tp('resultados.resumo', totalResultados)
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
  areaCarregarMais.hidden = !temMais
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
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:16px;height:16px;color:var(--primary);flex:0 0 auto"><path d="M4 15v4M10 11v8M16 7v12M22 4v16"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:16px;height:16px;color:var(--warn);flex:0 0 auto"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>'
    const tipoLabel = item.tipo === 'curso'
      ? '<span class="eyebrow">' + escapeHTML(t('resultados.tipoCurso')) + '</span>'
      : '<span class="eyebrow" style="color:var(--warn)">' + escapeHTML(t('resultados.tipoInstituicao')) + '</span>'

    html += '<a href="' + href + '" data-sugestao data-track-event="sugestao-curso" style="display:flex;align-items:center;gap:.75rem;text-decoration:none">' +
      icone +
      '<span style="flex:1;min-width:0">' +
      '<span style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">' +
      tipoLabel +
      '<strong style="font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHTML(item.texto) + '</strong>' +
      '</span>' +
      (item.subtitulo ? '<small style="display:block;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHTML(item.subtitulo) + '</small>' : '') +
      '</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:16px;height:16px;color:var(--text-subtle);flex:0 0 auto"><path d="M9 18l6-6-6-6"/></svg>' +
      '</a>'
  }

  area.innerHTML = html
  area.hidden = false
  document.getElementById('filtroNome')?.setAttribute('aria-expanded', 'true')
}

function fecharSugestoes() {
  const area = document.getElementById('areaSugestoes')
  if (area) {
    area.hidden = true
    area.innerHTML = ''
    document.getElementById('filtroNome')?.setAttribute('aria-expanded', 'false')
  }
}
