// detalhes.js — Página de detalhes do curso (RF2–RF5) com abas e botão de favoritar (RF6).

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

// Busca o curso na API; em caso de falha usa os dados de demonstração
async function carregarCurso(id) {
  mostrarCarregando(true)
  let curso = null

  try {
    const resultado = await api('GET', `/cursos/${id}`)
    curso = resultado.dados || null
  } catch {
    curso = detalheCursoDemo(id)
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

function mostrarInvalido() { /* manter interface consistente ao carregar */ }

function mostrarIndisponivel(mensagem) {
  document.getElementById('detalheSkeleton').innerHTML = estadoErro(mensagem).replace('col-span-full', '')
  document.getElementById('detalheSkeleton').classList.remove('hidden')
  document.getElementById('cabecalhoCurso').classList.add('hidden')
  document.getElementById('conteudoDetalhe').classList.add('hidden')
  void mostrarInvalido
}

function mostrarCarregando(ativo) {
  document.getElementById('detalheSkeleton').classList.toggle('hidden', !ativo)
  document.getElementById('cabecalhoCurso').classList.toggle('hidden', ativo)
  document.getElementById('conteudoDetalhe').classList.toggle('hidden', ativo)
}

// Cabeçalho: nome, instituição, cidade/UF, modalidade, grau, demanda e botão favoritar
function renderizarCabecalho(curso) {
  const base = caminhoBase()
  const instituicao = curso.instituicao_completa || {
    nome: curso.instituicao,
    sigla: curso.sigla,
    cidade: curso.cidade,
    estado: curso.estado
  }
  const demanda = String(curso.demanda || curso.mercado?.demanda || '')

  document.getElementById('cabecalhoCurso').innerHTML = `
    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wide text-indigo-600">${escapeHTML(instituicao.sigla || curso.instituicao)}</span>
          ${demanda ? badge(rotuloDemanda(demanda), corDemanda(demanda)) : ''}
        </div>
        <h1 class="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">${escapeHTML(curso.nome)}</h1>
        <p class="mt-1 text-gray-600 text-lg">${escapeHTML(instituicao.nome || curso.instituicao)}</p>
        <div class="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-white ring-1 ring-gray-200 rounded-full font-semibold text-gray-700">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            ${escapeHTML(instituicao.cidade || curso.cidade)}/${escapeHTML(instituicao.estado || curso.estado)}
          </span>
          <span class="px-3 py-1 bg-white ring-1 ring-gray-200 rounded-full font-semibold text-gray-700">${escapeHTML(curso.modalidade || 'Presencial')}</span>
          <span class="px-3 py-1 bg-white ring-1 ring-gray-200 rounded-full font-semibold text-gray-700">${escapeHTML(curso.grau || '—')}</span>
          ${curso.duracao_semestres ? `<span class="px-3 py-1 bg-white ring-1 ring-gray-200 rounded-full font-semibold text-gray-700">${curso.duracao_semestres} semestres</span>` : ''}
        </div>
      </div>
      <div class="flex flex-col gap-3 shrink-0">
        ${botaoFavorito(curso, true)}
        <a href="${base}/index.html" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-200 transition">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Voltar para a busca
        </a>
      </div>
    </div>
  `
}

// Abas com as seções RF2–RF5
function renderizarAbas(curso) {
  document.getElementById('atmNotas').innerHTML = tabelaNotas(curso.notas_corte) + linhaFonte(curso.custos && curso.custos.fonte ? 'Base de notas de corte' : '—', null)
  renderizarCustos(curso)
  renderizarBolsas(curso)
  renderizarMercado(curso)
}

// RF3 — Custos da cidade
function renderizarCustos(curso) {
  const area = document.getElementById('atmCustos')
  const custos = curso.custos

  if (!custos) {
    area.innerHTML = estadoVazio('Custos da cidade ainda não mapeados para este curso.')
    return
  }

  const total = (custos.moradia || 0) + (custos.alimentacao || 0) + (custos.transporte || 0) + (custos.outros || 0)
  area.innerHTML = `
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      ${cardInfo(ICONES.casa, 'Moradia', formatarMoeda(custos.moradia))}
      ${cardInfo(ICONES.comida, 'Alimentação', formatarMoeda(custos.alimentacao))}
      ${cardInfo(ICONES.onibus, 'Transporte', formatarMoeda(custos.transporte))}
      ${cardInfo(ICONES.cartao, 'Outros', formatarMoeda(custos.outros))}
    </div>
    <div class="mt-5">
      ${cardInfo(ICONES.moeda, `Total mensal estimado em ${custos.cidade}/${custos.estado}`, formatarMoeda(total), true)}
    </div>
    ${linhaFonte(custos.fonte, custos.atualizado_em)}
  `
}

// RF4 — Bolsas e auxílios
function renderizarBolsas(curso) {
  document.getElementById('atmBolsas').innerHTML = listaAuxilios(curso.auxilios)
}

// RF5 — Mercado e estágios
function renderizarMercado(curso) {
  const area = document.getElementById('atmMercado')
  const mercado = curso.mercado || {}
  const demanda = String(mercado.demanda || '')
  const estagios = mercado.estagios || []

  const cards = `
    <div class="grid sm:grid-cols-3 gap-4">
      ${cardInfo(ICONES.grafico, 'Demanda na região', mercado.regiao ? `Mercado em ${escapeHTML(mercado.regiao)}` : '—')}
      ${cardInfo(ICONES.moeda, 'Salário médio', formatarMoeda(mercado.salario_medio))}
      ${cardInfo(ICONES.mala, 'Vagas de estágio', mercado.vagas_estagio ? `${Number(mercado.vagas_estagio).toLocaleString('pt-BR')} vagas` : '—')}
    </div>
  `

  const demandaExtra = demanda ? `
    <div class="mt-5 flex items-center gap-2">
      <span class="text-sm font-semibold text-gray-600">Classificação da demanda:</span>
      ${badge(rotuloDemanda(demanda), corDemanda(demanda))}
    </div>
  ` : ''

  const listaEstagios = estagios.length > 0 ? `
    <div class="mt-6">
      <h4 class="font-bold text-gray-900 mb-3">Oportunidades de estágio na região</h4>
      <ul class="space-y-2">
        ${estagios.map((estagio) => `
          <li class="flex items-center justify-between gap-3 bg-white rounded-xl ring-1 ring-gray-200 px-4 py-3">
            <div class="flex items-center gap-3">
              <span class="text-indigo-600">${ICONES.mala}</span>
              <span class="font-semibold text-gray-800">${escapeHTML(estagio.titulo)}</span>
            </div>
            <span class="text-sm text-gray-500">${escapeHTML(estagio.cidade)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : ''

  area.innerHTML = cards + demandaExtra + listaEstagios +
    linhaFonte(mercado.fonte, mercado.atualizado_em)
}

// Ativa troca de abas com apoio a navegação por teclado (RNF5)
function configurarAbas() {
  const guias = Array.from(document.querySelectorAll('[role="tab"]'))
  const paineis = Array.from(document.querySelectorAll('[role="tabpanel"]'))

  function ativarGuia(guia, moverFoco = false) {
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

  ativarGuia(guias[0])
}