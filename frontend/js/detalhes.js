// detalhes.js — Pagina de detalhes do curso (RF2-RF5) com abas e botao de favoritar (RF6).

let cursoDetalhe = null

document.addEventListener('DOMContentLoaded', iniciarPaginaDetalhe)

function iniciarPaginaDetalhe() {
  montarNavbar('detalhes')

  const id = pegarParametroURL('id')
  if (!id) {
    mostrarIndisponivel('Nenhum curso informado na URL.')
    return
  }
  carregarCurso(id)
}

async function carregarCurso(id) {
  mostrarCarregando(true)
  let curso = null

  try {
    const resultado = await api('GET', '/cursos/' + id)
    const dados = resultado.dados || null
    if (dados) {
      // Normaliza campos da API para o formato esperado pelo frontend
      curso = Object.assign({}, dados, {
        instituicao: dados.instituicao_nome || dados.instituicao || '',
        auxilios: dados.auxilios_bolsas || dados.auxilios || [],
        mercado: dados.mercado_estagios && dados.mercado_estagios.length > 0
          ? dados.mercado_estagios[0]
          : dados.mercado || null,
        demanda: dados.mercado_estagios && dados.mercado_estagios.length > 0
          ? dados.mercado_estagios[0].demanda
          : dados.demanda || ''
      })
    }
  } catch {
    curso = detalheCursoDemo(id)
  }

  if (!curso) {
    mostrarCarregando(false)
    mostrarIndisponivel('Curso nao encontrado.')
    return
  }

  cursoDetalhe = curso
  renderizarCabecalho(curso)
  renderizarAbas(curso)
  mostrarCarregando(false)
  configurarAbas()
  sincronizarComAPI()
}

function mostrarIndisponivel(mensagem) {
  document.getElementById('detalheSkeleton').innerHTML = estadoErro(mensagem).replace('col-span-full', '')
  document.getElementById('detalheSkeleton').classList.remove('hidden')
  document.getElementById('cabecalhoCurso').classList.add('hidden')
  document.getElementById('conteudoDetalhe').classList.add('hidden')
}

function mostrarCarregando(ativo) {
  document.getElementById('detalheSkeleton').classList.toggle('hidden', !ativo)
  document.getElementById('cabecalhoCurso').classList.toggle('hidden', ativo)
  document.getElementById('conteudoDetalhe').classList.toggle('hidden', ativo)
}

function renderizarCabecalho(curso) {
  const base = caminhoBase()
  const nomeInst = curso.instituicao || ''
  const sigla = curso.sigla || ''
  const demanda = String(curso.demanda || '')

  document.getElementById('cabecalhoCurso').innerHTML =
    '<div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">' +
    '<div>' +
    '<div class="flex flex-wrap items-center gap-2">' +
    '<span class="text-xs font-bold uppercase tracking-wide text-indigo-600">' + escapeHTML(sigla || nomeInst) + '</span>' +
    (demanda ? badge(rotuloDemanda(demanda), corDemanda(demanda)) : '') +
    '</div>' +
    '<h1 class="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">' + escapeHTML(curso.nome) + '</h1>' +
    '<p class="mt-1 text-gray-600 text-lg">' + escapeHTML(nomeInst) + '</p>' +
    '<div class="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">' +
    '<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-white ring-1 ring-gray-200 rounded-full font-semibold text-gray-700">' +
    ICONES.casa + ' ' + escapeHTML(curso.cidade || '') + '/' + escapeHTML(curso.estado || '') +
    '</span>' +
    '<span class="px-3 py-1 bg-white ring-1 ring-gray-200 rounded-full font-semibold text-gray-700">' + escapeHTML(curso.modalidade || 'Presencial') + '</span>' +
    '<span class="px-3 py-1 bg-white ring-1 ring-gray-200 rounded-full font-semibold text-gray-700">' + escapeHTML(curso.grau || '\u2014') + '</span>' +
    (curso.duracao_semestres ? '<span class="px-3 py-1 bg-white ring-1 ring-gray-200 rounded-full font-semibold text-gray-700">' + curso.duracao_semestres + ' semestres</span>' : '') +
    '</div>' +
    '</div>' +
    '<div class="flex flex-col gap-3 shrink-0">' +
    botaoFavorito(curso, true) +
    '<a href="' + base + '/index.html" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-200 transition">' +
    'Voltar para a busca</a>' +
    '</div></div>'
}

function renderizarAbas(curso) {
  document.getElementById('atmNotas').innerHTML = tabelaNotas(curso.notas_corte)
  renderizarCustos(curso)
  renderizarBolsas(curso)
  renderizarMercado(curso)
}

function renderizarCustos(curso) {
  const area = document.getElementById('atmCustos')
  const custos = curso.custos

  if (!custos) {
    area.innerHTML = estadoVazio('Custos da cidade ainda nao mapeados para este curso.')
    return
  }

  const total = (custos.moradia || 0) + (custos.alimentacao || 0) + (custos.transporte || 0) + (custos.outros || 0)
  area.innerHTML =
    '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">' +
    cardInfo(ICONES.casa, 'Moradia', formatarMoeda(custos.moradia)) +
    cardInfo(ICONES.comida, 'Alimentacao', formatarMoeda(custos.alimentacao)) +
    cardInfo(ICONES.onibus, 'Transporte', formatarMoeda(custos.transporte)) +
    cardInfo(ICONES.cartao, 'Outros', formatarMoeda(custos.outros)) +
    '</div>' +
    '<div class="mt-5">' +
    cardInfo(ICONES.moeda, 'Total mensal estimado em ' + (custos.cidade || curso.cidade || '') + '/' + (custos.estado || curso.estado || ''), formatarMoeda(total), true) +
    '</div>'
}

function renderizarBolsas(curso) {
  document.getElementById('atmBolsas').innerHTML = listaAuxilios(curso.auxilios)
}

function renderizarMercado(curso) {
  const area = document.getElementById('atmMercado')
  const mercado = curso.mercado || {}
  const demanda = String(mercado.demanda || '')

  const cards =
    '<div class="grid sm:grid-cols-3 gap-4">' +
    cardInfo(ICONES.grafico, 'Demanda na regiao', mercado.regiao ? 'Mercado em ' + escapeHTML(mercado.regiao) : '\u2014') +
    cardInfo(ICONES.moeda, 'Salario medio', formatarMoeda(mercado.salario_medio)) +
    cardInfo(ICONES.mala, 'Vagas de estagio', mercado.vagas_estagio ? Number(mercado.vagas_estagio).toLocaleString('pt-BR') + ' vagas' : '\u2014') +
    '</div>'

  const demandaExtra = demanda
    ? '<div class="mt-5 flex items-center gap-2">' +
      '<span class="text-sm font-semibold text-gray-600">Classificacao da demanda:</span>' +
      badge(rotuloDemanda(demanda), corDemanda(demanda)) +
      '</div>'
    : ''

  area.innerHTML = cards + demandaExtra + linhaFonte(mercado.fonte, mercado.atualizado_em)
}

function configurarAbas() {
  const guias = Array.from(document.querySelectorAll('[role="tab"]'))
  const paineis = Array.from(document.querySelectorAll('[role="tabpanel"]'))

  function ativarGuia(guia, moverFoco) {
    guias.forEach((g) => {
      const ativa = g === guia
      g.setAttribute('aria-selected', String(ativa))
      g.tabIndex = ativa ? 0 : -1
    })
    paineis.forEach((painel) => {
      painel.hidden = painel.id !== guia.getAttribute('aria-controls')
    })
    if (moverFoco) guia.focus()
  }

  guias.forEach((guia, indice) => {
    guia.addEventListener('click', () => ativarGuia(guia))
    guia.addEventListener('keydown', (evento) => {
      if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') return
      evento.preventDefault()
      const direcao = evento.key === 'ArrowRight' ? 1 : -1
      const proximo = (indice + direcao + guias.length) % guias.length
      ativarGuia(guias[proximo], true)
    })
  })

  if (guias.length > 0) ativarGuia(guias[0])
}
