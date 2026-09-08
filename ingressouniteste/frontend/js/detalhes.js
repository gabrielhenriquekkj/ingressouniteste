// detalhes.js — Página de detalhes do curso (RF2-RF5) com abas e botão de favoritar (RF6).

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
   } catch (e) {
     console.warn('Erro ao carregar curso:', e.message)
   }

  if (!curso) {
try {
       const resultado = await api('GET', '/instituicoes/' + id)
       const dados = resultado.dados || null
       if (dados) {
         curso = Object.assign({}, dados, {
           nome: dados.nome || '',
           instituicao: dados.nome || '',
           sigla: dados.sigla || '',
           cidade: dados.cidade || '',
           estado: dados.uf || dados.estado || '',
           auxilios: dados.auxilios || [],
           cursos: dados.cursos || [],
           campi: dados.campi || [],
           mercado: null,
           demanda: '',
           notas_corte: [],
           custos: null,
           _isInstituicao: true
         })
       }
     } catch (e) {
       console.warn('Erro ao carregar instituição:', e.message)
     }
  }

  if (!curso) {
    mostrarCarregando(false)
    mostrarIndisponivel('Curso não encontrado.')
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
    (curso.duracao_semestres ? '<span class="px-3 py-1 bg-white ring-1 ring-gray-200 rounded-full font-semibold text-gray-700">' + escapeHTML(String(curso.duracao_semestres)) + ' semestres</span>' : '') +
    '</div>' +
    '</div>' +
    '<div class="flex flex-col gap-3 shrink-0">' +
    botaoFavorito(curso, true) +
    '<a href="' + base + '/index.html" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-200 transition">' +
    'Voltar para a busca</a>' +
    '</div></div>'
}

function renderizarNotasInstituicao(curso) {
  const area = document.getElementById('atmNotas')
  const notas = curso.notas_corte || []
  const cursos = curso.cursos || []

  if (notas.length === 0 && cursos.length === 0) {
    area.innerHTML = estadoVazio('Nenhuma nota de corte registrada para esta instituição.')
    return
  }

  if (notas.length === 0) {
    area.innerHTML = estadoVazio('Nota de corte SiSU indisponível. Esta instituição pode não participar do SiSU ou os dados ainda não foram publicados.')
    return
  }

  const porCurso = {}
  for (const n of notas) {
    const cid = n.curso_id || 'desconhecido'
    if (!porCurso[cid]) porCurso[cid] = { nome: n.curso_nome || 'Curso #' + cid, notas: [] }
    porCurso[cid].notas.push(n)
  }

  const fonteLabel = notas[0]?.fonte_tipo === 'oficial' ? 'Fonte oficial MEC' : 'Dados abertos'

  let html = '<div class="flex items-center justify-between mb-3">' +
    '<h3 class="text-lg font-bold text-gray-900">Notas de Corte SiSU (' + notas.length + ' registros)</h3>' +
    badge(fonteLabel, 'bg-green-100 text-green-700') +
    '</div>'
  html += '<div class="space-y-4">'
  for (const cid of Object.keys(porCurso)) {
    const item = porCurso[cid]
    html += '<div class="bg-white rounded-xl ring-1 ring-gray-200 p-4">'
    html += '<h4 class="font-bold text-gray-900">' + escapeHTML(item.nome) + '</h4>'
    html += '<div class="mt-2 overflow-x-auto"><table class="w-full text-sm">'
    html += '<thead><tr class="border-b border-gray-200"><th class="text-left py-2 px-2 font-semibold text-gray-700">Modalidade</th><th class="text-left py-2 px-2 font-semibold text-gray-700">Ano</th><th class="text-right py-2 px-2 font-semibold text-gray-700">Nota</th><th class="text-right py-2 px-2 font-semibold text-gray-700">Tipo</th></tr></thead><tbody>'
    for (const n of item.notas) {
      const modalidade = (n.modalidade_acesso || '').replace(/_/g, ' ')
      const tipoNota = n.tipo_nota === 'final' ? 'Histórica' : n.tipo_nota === 'parcial' ? 'Parcial' : ''
      html += '<tr class="border-b border-gray-50 hover:bg-gray-50">'
      html += '<td class="py-2 px-2">' + badge(modalidade, 'bg-blue-100 text-blue-700') + '</td>'
      html += '<td class="py-2 px-2">' + escapeHTML(String(n.ano || '')) + '</td>'
      html += '<td class="py-2 px-2 text-right font-bold text-gray-900">' + (n.nota_corte ? n.nota_corte.toFixed(1) : '-') + '</td>'
      html += '<td class="py-2 px-2 text-right">' + (tipoNota ? badge(tipoNota, 'bg-gray-100 text-gray-600') : '-') + '</td>'
      html += '</tr>'
    }
    html += '</tbody></table></div></div>'
  }
  html += '</div>'
  area.innerHTML = html
}

function renderizarAbas(curso) {
  if (curso._isInstituicao) {
    renderizarNotasInstituicao(curso)
    renderizarCampiECustos(curso)
    renderizarBolsas(curso)
    renderizarMercadoVazio()
    renderizarCursosInstituicao(curso)
  } else {
    document.getElementById('atmNotas').innerHTML = tabelaNotas(curso.notas_corte)
    renderizarCustos(curso)
    renderizarBolsas(curso)
    renderizarMercado(curso)
  }
}

function renderizarCursosInstituicao(curso) {
  const area = document.getElementById('atmCursos')
  const cursos = curso.cursos || []

  if (cursos.length === 0) {
    area.innerHTML = estadoVazio('Nenhum curso listado para esta instituição.')
    return
  }

  let html = '<h3 class="text-lg font-bold text-gray-900 mb-3">Cursos (' + cursos.length + ')</h3>'
  html += '<div class="space-y-2">'
  for (const c of cursos) {
    html += '<div class="bg-white rounded-xl ring-1 ring-gray-200 p-4">' +
      '<h4 class="font-bold text-gray-900">' + escapeHTML(c.nome) + '</h4>'
    if (c.modalidade) html += '<span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">' + escapeHTML(c.modalidade) + '</span>'
    if (c.grau) html += '<span class="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block ml-1">' + escapeHTML(c.grau) + '</span>'
    if (c.turno) html += '<span class="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block ml-1">' + escapeHTML(c.turno) + '</span>'
    html += '</div>'
  }
  html += '</div>'
  area.innerHTML = html
}

function renderizarMercadoVazio() {
  document.getElementById('atmMercado').innerHTML = estadoVazio('Informações de mercado ainda não disponíveis para esta instituição.')
}

function renderizarCampiECustos(curso) {
  const area = document.getElementById('atmCustos')
  const campi = curso.campi || []
  const custos = curso.custos

  let html = ''

  if (campi.length > 0) {
    html += '<h3 class="text-lg font-bold text-gray-900 mb-3">Campi (' + campi.length + ')</h3>'
    html += '<div class="space-y-2">'
    for (const c of campi) {
      html += '<div class="bg-white rounded-xl ring-1 ring-gray-200 p-4">' +
        '<h4 class="font-bold text-gray-900">' + escapeHTML(c.nome) + '</h4>'
      if (c.cidade) html += '<p class="text-sm text-gray-500">' + escapeHTML(c.cidade) + '/' + escapeHTML(c.uf || c.estado || '') + '</p>'
      if (c.endereco) html += '<p class="text-xs text-gray-400 mt-1">' + escapeHTML(c.endereco) + '</p>'
      if (c.site_oficial) html += '<a href="' + escapeHTML(c.site_oficial) + '" target="_blank" rel="noopener" class="text-indigo-600 text-xs hover:underline mt-1 inline-block">Site oficial &#8599;</a>'
      html += '</div>'
    }
    html += '</div>'
  }

  if (custos) {
    const fonteLabel = custos.tipo_fonte === 'estimativa_pib'
      ? badge('Indicador econômico (PIB per capita)', 'bg-amber-100 text-amber-700')
      : badge(custos.tipo_fonte || 'Dados', 'bg-blue-100 text-blue-700')
    html += '<div class="flex items-center justify-between mb-4 mt-4">' +
      '<h3 class="text-lg font-bold text-gray-900">Indicadores Econômicos</h3>' +
      fonteLabel +
      '</div>' +
      '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">' +
      cardInfo(ICONES.casa, 'Moradia', formatarMoeda(custos.moradia)) +
      cardInfo(ICONES.comida, 'Alimentação', formatarMoeda(custos.alimentacao)) +
      cardInfo(ICONES.onibus, 'Transporte', formatarMoeda(custos.transporte)) +
      cardInfo(ICONES.cartao, 'Outros', formatarMoeda(custos.outros)) +
      '</div>' +
      '<div class="mt-5">' +
      cardInfo(ICONES.moeda, 'Total mensal estimado em ' + (custos.cidade || curso.cidade || '') + '/' + (custos.estado || curso.estado || ''), formatarMoeda(custos.custo_total), true) +
      '</div>' +
      '<p class="mt-3 text-xs text-gray-400">Fonte: IBGE PIB per capita 2023 - Indicador econômico, não custo de vida real</p>'
  } else if (campi.length === 0) {
    html = estadoVazio('Informações de campus e indicadores econômicos ainda não disponíveis.')
  }

  area.innerHTML = html
}

function renderizarCustos(curso) {
  const area = document.getElementById('atmCustos')
  const custos = curso.custos

  if (!custos) {
    area.innerHTML = estadoVazio('Indicadores econômicos ainda não disponíveis para esta cidade.')
    return
  }

  const fonteLabel = custos.tipo_fonte === 'estimativa_pib'
    ? badge('Indicador economico (PIB per capita)', 'bg-amber-100 text-amber-700')
    : badge(custos.tipo_fonte || 'Dados', 'bg-blue-100 text-blue-700')

  area.innerHTML =
    '<div class="flex items-center justify-between mb-4">' +
    '<h3 class="text-lg font-bold text-gray-900">Indicadores Econômicos</h3>' +
    fonteLabel +
    '</div>' +
    '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">' +
    cardInfo(ICONES.casa, 'Moradia', formatarMoeda(custos.moradia)) +
    cardInfo(ICONES.comida, 'Alimentação', formatarMoeda(custos.alimentacao)) +
    cardInfo(ICONES.onibus, 'Transporte', formatarMoeda(custos.transporte)) +
    cardInfo(ICONES.cartao, 'Outros', formatarMoeda(custos.outros)) +
    '</div>' +
    '<div class="mt-5">' +
    cardInfo(ICONES.moeda, 'Total mensal estimado em ' + (custos.cidade || curso.cidade || '') + '/' + (custos.estado || curso.estado || ''), formatarMoeda(custos.custo_total), true) +
    '</div>' +
    '<p class="mt-3 text-xs text-gray-400">Fonte: IBGE PIB per capita 2023 - Indicador economico, nao custo de vida real</p>'
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
    cardInfo(ICONES.grafico, 'Demanda na região', mercado.regiao ? 'Mercado em ' + escapeHTML(mercado.regiao) : '\u2014') +
    cardInfo(ICONES.moeda, 'Salário médio', formatarMoeda(mercado.salario_medio)) +
    cardInfo(ICONES.mala, 'Vagas de estágio', mercado.vagas_estagio ? Number(mercado.vagas_estagio).toLocaleString('pt-BR') + ' vagas' : '\u2014') +
    '</div>'

  const demandaExtra = demanda
    ? '<div class="mt-5 flex items-center gap-2">' +
      '<span class="text-sm font-semibold text-gray-600">Classificação da demanda:</span>' +
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
