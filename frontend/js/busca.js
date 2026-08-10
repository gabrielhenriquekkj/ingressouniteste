// busca.js — Lógica da Home: filtros (RF1), debounce (RNF2), render de cards, skeleton e "carregar mais".

const POR_PAGINA = 6
const cacheBusca = new Map() // cache simples em memória (RNF2)

let listaCompleta = []   // todos os cursos retornados pelo último filtro
let paginaAtual = 0      // quantidade de cards exibidos até agora

document.addEventListener('DOMContentLoaded', iniciarPaginaBusca)

function iniciarPaginaBusca() {
  montarNavbar('home')
  preencherSelects()
  vincularEventos()
  executarBusca()
  sincronizarComAPI()
}

// Preenche os selects de estado e cidade a partir das opções disponíveis
function preencherSelects() {
  const selectEstado = document.getElementById('filtroEstado')
  const selectCidade = document.getElementById('filtroCidade')

  selectEstado.innerHTML = `<option value="">Todos os estados</option>` +
    listarEstadosDemo().map((estado) => `<option value="${escapeHTML(estado)}">${escapeHTML(estado)}</option>`).join('')

  const cidades = listarCidadesDemo()
  selectCidade.innerHTML = `<option value="">Todas as cidades</option>` +
    cidades.map((cidade) => `<option value="${escapeHTML(cidade)}">${escapeHTML(cidade)}</option>`).join('')

  // Estado selecionado filtra as cidades disponíveis
  selectEstado.addEventListener('change', () => {
    selectCidade.innerHTML = `<option value="">Todas as cidades</option>` +
      listarCidadesDemo(selectEstado.value).map((cidade) => `<option value="${escapeHTML(cidade)}">${escapeHTML(cidade)}</option>`).join('')
  })
}

function vincularEventos() {
  const formBusca = document.getElementById('formBusca')
  const inputNome = document.getElementById('filtroNome')
  const btnCarregarMais = document.getElementById('btnCarregarMais')

  formBusca.addEventListener('submit', (evento) => {
    evento.preventDefault()
    executarBusca()
  })

  // Debounce no campo de texto (RNF2): busca automática após pausa de 300ms
  inputNome.addEventListener('input', debounce(executarBusca, 300))

  btnCarregarMais.addEventListener('click', () => {
    const area = document.getElementById('areaResultados')
    const proximos = listaCompleta.slice(paginaAtual, paginaAtual + POR_PAGINA)
    area.insertAdjacentHTML('beforeend', proximos.map((curso) => cardResultado(curso)).join(''))
    paginaAtual += POR_PAGINA
    atualizarBotaoCarregarMais()
  })
}

// Monta o objeto de filtros a partir do formulário
function obterFiltros() {
  return {
    nome: document.getElementById('filtroNome').value.trim(),
    estado: document.getElementById('filtroEstado').value,
    cidade: document.getElementById('filtroCidade').value
  }
}

// Busca cursos na API (com fallback para os dados de demonstração)
async function buscarCursos(filtros) {
  const chaveCache = JSON.stringify(filtros)
  if (cacheBusca.has(chaveCache)) return cacheBusca.get(chaveCache)

  const params = new URLSearchParams(filtros)
  let cursos
  try {
    const resultado = await api('GET', `/cursos?${params.toString()}`)
    cursos = resultado.dados || []
  } catch {
    cursos = buscarCursosDemo(filtros)
  }
  cacheBusca.set(chaveCache, cursos)
  return cursos
}

// Orquestra a busca: skeleton, dados e renderização
async function executarBusca() {
  const area = document.getElementById('areaResultados')
  const resumo = document.getElementById('resumoResultados')
  const filtros = obterFiltros()

  paginaAtual = 0
  area.innerHTML = skeleton(3)
  resumo.textContent = 'Buscando...'

  try {
    listaCompleta = await buscarCursos(filtros)
    renderizarResultados(listaCompleta)
  } catch (erro) {
    area.innerHTML = estadoErro(erro.message || 'Não foi possível buscar os cursos.')
    resumo.textContent = ''
    atualizarBotaoCarregarMais()
  }
}

function renderizarResultados(cursos) {
  const area = document.getElementById('areaResultados')
  const resumo = document.getElementById('resumoResultados')

  if (cursos.length === 0) {
    area.innerHTML = estadoVazio('Nenhum curso encontrado com os filtros selecionados. Tente modificar a busca.')
    resumo.textContent = ''
  } else {
    resumo.textContent = `${cursos.length} ${cursos.length === 1 ? 'resultado' : 'resultados'} encontrados`
    const iniciais = cursos.slice(paginaAtual, paginaAtual + POR_PAGINA)
    area.innerHTML = iniciais.map((curso) => cardResultado(curso)).join('')
    paginaAtual += iniciais.length
  }
  atualizarBotaoCarregarMais()
}

// Mostra/oculta o botão "Carregar mais" conforme existam resultados não exibidos
function atualizarBotaoCarregarMais() {
  const botao = document.getElementById('btnCarregarMais')
  const area = document.getElementById('btnCarregarMais').parentElement
  const temMais = paginaAtual < listaCompleta.length
  area.classList.toggle('hidden', !temMais)
  void botao
}