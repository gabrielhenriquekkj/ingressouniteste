// busca.js — Logica da Home: filtros (RF1), debounce (RNF2), render de cards e skeleton

var POR_PAGINA = 6
var cacheBusca = new Map()
var listaCompleta = []
var paginaAtual = 0

document.addEventListener('DOMContentLoaded', iniciarPaginaBusca)

function iniciarPaginaBusca() {
  montarNavbar('home')
  preencherSelects()
  vincularEventos()
  executarBusca()
  sincronizarComAPI()
}

function preencherSelects() {
  var selectEstado = document.getElementById('filtroEstado')
  var selectCidade = document.getElementById('filtroCidade')

  selectEstado.innerHTML = '<option value="">Todos os estados</option>' +
    listarEstadosDemo().map(function (estado) {
      return '<option value="' + escapeHTML(estado) + '">' + escapeHTML(estado) + '</option>'
    }).join('')

  var cidades = listarCidadesDemo()
  selectCidade.innerHTML = '<option value="">Todas as cidades</option>' +
    cidades.map(function (cidade) {
      return '<option value="' + escapeHTML(cidade) + '">' + escapeHTML(cidade) + '</option>'
    }).join('')

  selectEstado.addEventListener('change', function () {
    selectCidade.innerHTML = '<option value="">Todas as cidades</option>' +
      listarCidadesDemo(selectEstado.value).map(function (cidade) {
        return '<option value="' + escapeHTML(cidade) + '">' + escapeHTML(cidade) + '</option>'
      }).join('')
  })
}

function vincularEventos() {
  var formBusca = document.getElementById('formBusca')
  var inputNome = document.getElementById('filtroNome')
  var btnCarregarMais = document.getElementById('btnCarregarMais')

  formBusca.addEventListener('submit', function (evento) {
    evento.preventDefault()
    executarBusca()
  })

  inputNome.addEventListener('input', debounce(executarBusca, 300))

  if (btnCarregarMais) {
    btnCarregarMais.addEventListener('click', function () {
      var area = document.getElementById('areaResultados')
      var proximos = listaCompleta.slice(paginaAtual, paginaAtual + POR_PAGINA)
      area.insertAdjacentHTML('beforeend', proximos.map(function (curso) { return cardResultado(curso) }).join(''))
      paginaAtual += POR_PAGINA
      atualizarBotaoCarregarMais()
    })
  }
}

function obterFiltros() {
  return {
    nome: document.getElementById('filtroNome').value.trim(),
    estado: document.getElementById('filtroEstado').value,
    cidade: document.getElementById('filtroCidade').value
  }
}

async function buscarCursos(filtros) {
  var chaveCache = JSON.stringify(filtros)
  if (cacheBusca.has(chaveCache)) return cacheBusca.get(chaveCache)

  var params = new URLSearchParams(filtros)
  var cursos
  try {
    var resultado = await api('GET', '/cursos?' + params.toString())
    cursos = resultado.dados || []
  } catch (e) {
    cursos = buscarCursosDemo(filtros)
  }
  cacheBusca.set(chaveCache, cursos)
  return cursos
}

async function executarBusca() {
  var area = document.getElementById('areaResultados')
  var resumo = document.getElementById('resumoResultados')
  var filtros = obterFiltros()

  paginaAtual = 0
  area.innerHTML = skeleton(3)
  resumo.textContent = 'Buscando...'

  try {
    listaCompleta = await buscarCursos(filtros)
    renderizarResultados(listaCompleta)
  } catch (erro) {
    area.innerHTML = estadoErro(erro.message || 'Nao foi possivel buscar os cursos.')
    resumo.textContent = ''
    atualizarBotaoCarregarMais()
  }
}

function renderizarResultados(cursos) {
  var area = document.getElementById('areaResultados')
  var resumo = document.getElementById('resumoResultados')

  if (cursos.length === 0) {
    area.innerHTML = estadoVazio('Nenhum curso encontrado com os filtros selecionados. Tente modificar a busca.')
    resumo.textContent = ''
  } else {
    resumo.textContent = cursos.length + (cursos.length === 1 ? ' resultado encontrado' : ' resultados encontrados')
    var iniciais = cursos.slice(paginaAtual, paginaAtual + POR_PAGINA)
    area.innerHTML = iniciais.map(function (curso) { return cardResultado(curso) }).join('')
    paginaAtual += iniciais.length
  }
  atualizarBotaoCarregarMais()
}

function atualizarBotaoCarregarMais() {
  var areaCarregarMais = document.getElementById('areaCarregarMais')
  if (!areaCarregarMais) return
  var temMais = paginaAtual < listaCompleta.length
  areaCarregarMais.classList.toggle('hidden', !temMais)
}
