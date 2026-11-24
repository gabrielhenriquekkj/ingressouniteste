(function () {
  'use strict'

  const AdminUI = window.AdminUI
  AdminUI.iniciarBase()

  const seletor = nome => document.querySelector(nome)
  const formulario = seletor('[data-form-relatorio]')
  const campoNome = seletor('#nome')
  const campoInicio = seletor('#inicio')
  const campoFim = seletor('#fim')
  const campoRota = seletor('#rota')
  const botaoGerar = seletor('[data-gerar]')
  const erro = seletor('[data-erro-relatorio]')
  const contagem = seletor('[data-contagem]')
  const historico = seletor('[data-historico]')
  const detalhe = seletor('[data-detalhe]')
  const detalheTitulo = seletor('[data-detalhe-titulo]')
  const detalheSubtitulo = seletor('[data-detalhe-subtitulo]')
  const detalheConteudo = seletor('[data-detalhe-conteudo]')

  const hoje = AdminUI.diaLocal()
  campoInicio.value = AdminUI.deslocarDia(hoje, -29)
  campoFim.value = hoje
  campoFim.max = hoje

  function mostrarErro(mensagem) {
    erro.textContent = mensagem
    erro.hidden = !mensagem
  }

  function formatoSelecionado() {
    return formulario.querySelector('input[name="formato"]:checked')?.value || 'json'
  }

  function nomeArquivo(relatorio, extensao) {
    const base = String(relatorio.nome || 'relatorio')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) || 'relatorio'
    return `${base}-${relatorio.id}.${extensao}`
  }

  function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag)
    if (classe) elemento.className = classe
    if (texto !== undefined) elemento.textContent = texto
    return elemento
  }

  async function carregarRotas() {
    const resposta = await AdminUI.requisicao('/api/admin/rotas')
    const atual = campoRota.value
    campoRota.replaceChildren()
    const todas = document.createElement('option')
    todas.value = ''
    todas.textContent = 'Todas as rotas'
    campoRota.appendChild(todas)
    for (const item of resposta?.dados || []) {
      const opcao = document.createElement('option')
      opcao.value = item.rota
      opcao.textContent = `${item.rota} (${AdminUI.numero(item.total)})`
      campoRota.appendChild(opcao)
    }
    campoRota.value = atual
  }

  async function calcularContagem() {
    if (!campoInicio.value || !campoFim.value || campoInicio.value > campoFim.value) {
      contagem.textContent = 'Período inválido'
      contagem.dataset.tipo = 'erro'
      return
    }
    const parametros = new URLSearchParams({
      inicio: campoInicio.value,
      fim: campoFim.value,
      rota: campoRota.value,
      limite: '1'
    })
    try {
      const resposta = await AdminUI.requisicao(`/api/admin/acessos?${parametros}`)
      contagem.textContent = `${AdminUI.numero(resposta?.dados?.total)} registro(s) no período`
      contagem.dataset.tipo = 'ok'
    } catch (erro) {
      contagem.textContent = erro.message
      contagem.dataset.tipo = 'erro'
    }
  }

  async function carregarHistorico() {
    historico.replaceChildren()
    const carregando = criarElemento('div', 'empty-state', 'Carregando histórico…')
    historico.appendChild(carregando)
    const resposta = await AdminUI.requisicao('/api/admin/relatorios?limite=30')
    const itens = resposta?.dados || []
    historico.replaceChildren()
    if (!itens.length) {
      historico.appendChild(criarElemento('div', 'empty-state', 'Nenhum relatório gerado até agora.'))
      return
    }

    for (const relatorio of itens) {
      const item = criarElemento('div', 'history-item')
      const copia = criarElemento('div')
      const titulo = criarElemento('h3', null, relatorio.nome)
      const meta = criarElemento('div', 'history-meta')
      const formato = criarElemento('span', 'badge', relatorio.formato.toUpperCase())
      formato.dataset.tipo = relatorio.formato === formatoSelecionado() ? 'ok' : undefined
      const data = criarElemento('span', null, AdminUI.dataHora(relatorio.criado_em))
      const registros = criarElemento('span', null, `${AdminUI.numero(relatorio.totalRegistros)} registro(s)`)
      const periodo = criarElemento('span', 'mono', `${relatorio.filtros?.inicio || '—'} → ${relatorio.filtros?.fim || '—'}`)
      const autor = criarElemento('span', null, relatorio.usuario_nome || 'Sistema')
      meta.append(formato, data, registros, periodo, autor)
      copia.append(titulo, meta)

      const acoes = criarElemento('div', 'history-actions')
      const ver = criarElemento('button', 'btn btn-sm', 'Ver detalhes')
      ver.type = 'button'
      ver.dataset.acao = 'ver'
      ver.dataset.id = String(relatorio.id)
      for (const extensao of ['csv', 'json', 'pdf']) {
        const botao = criarElemento('button', 'btn btn-sm btn-ghost', extensao.toUpperCase())
        botao.type = 'button'
        botao.dataset.acao = 'download'
        botao.dataset.id = String(relatorio.id)
        botao.dataset.extensao = extensao
        botao.setAttribute('aria-label', `Baixar ${relatorio.nome} em ${extensao.toUpperCase()}`)
        acoes.appendChild(botao)
      }
      const excluir = criarElemento('button', 'btn btn-sm btn-danger', 'Excluir')
      excluir.type = 'button'
      excluir.dataset.acao = 'excluir'
      excluir.dataset.id = String(relatorio.id)
      acoes.prepend(ver)
      acoes.appendChild(excluir)
      item.append(copia, acoes)
      historico.appendChild(item)
    }
  }

  function renderTabelaSimples(titulo, itens, colunas) {
    const bloco = criarElemento('div')
    bloco.appendChild(criarElemento('h3', 'card-title', titulo))
    const envoltorio = criarElemento('div', 'table-wrap')
    envoltorio.style.marginTop = '10px'
    const tabela = criarElemento('table', 'data-table')
    const cabecalho = criarElemento('thead')
    const linhaCabecalho = criarElemento('tr')
    for (const coluna of colunas) {
      const th = criarElemento('th', null, coluna.titulo)
      th.scope = 'col'
      linhaCabecalho.appendChild(th)
    }
    cabecalho.appendChild(linhaCabecalho)
    const corpo = criarElemento('tbody')
    if (!(itens || []).length) {
      const linha = criarElemento('tr')
      const celula = criarElemento('td', 'empty-state', 'Sem dados.')
      celula.colSpan = colunas.length
      linha.appendChild(celula)
      corpo.appendChild(linha)
    }
    for (const item of itens || []) {
      const linha = criarElemento('tr')
      for (const coluna of colunas) {
        const celula = criarElemento('td', coluna.classe, item[coluna.chave] ?? '—')
        linha.appendChild(celula)
      }
      corpo.appendChild(linha)
    }
    tabela.append(cabecalho, corpo)
    envoltorio.appendChild(tabela)
    bloco.appendChild(envoltorio)
    return bloco
  }

  async function verDetalhes(id) {
    const resposta = await AdminUI.requisicao(`/api/admin/relatorios/${id}`)
    const relatorio = resposta?.dados
    if (!relatorio) return
    detalhe.hidden = false
    detalheTitulo.dataset.id = String(relatorio.id)
    detalheTitulo.textContent = relatorio.nome
    detalheSubtitulo.textContent = `Gerado em ${AdminUI.dataHora(relatorio.criado_em)} por ${relatorio.usuario_nome || 'Sistema'} · ${AdminUI.numero(relatorio.totalRegistros)} registro(s)`
    detalheConteudo.replaceChildren()

    const resumo = criarElemento('div', 'filter-grid')
    const periodos = [
      ['Período', `${relatorio.filtros?.inicio || '—'} a ${relatorio.filtros?.fim || '—'}`],
      ['Rota', relatorio.filtros?.rota || 'Todas'],
      ['Formato preferido', String(relatorio.formato || '').toUpperCase()],
      ['Dispositivo líder', relatorio.resumo?.dispositivos?.[0]?.rotulo || '—']
    ]
    for (const [rotulo, valor] of periodos) {
      const cartao = criarElemento('div', 'sidebar-footer')
      cartao.appendChild(criarElemento('span', 'card-subtitle', rotulo))
      cartao.appendChild(criarElemento('strong', 'mono', valor))
      resumo.appendChild(cartao)
    }
    detalheConteudo.appendChild(resumo)
    detalheConteudo.appendChild(renderTabelaSimples('Top rotas do snapshot', relatorio.resumo?.ranking, [
      { titulo: 'Rota', chave: 'rota', classe: 'mono' },
      { titulo: 'Acessos', chave: 'total' },
      { titulo: 'Participação', chave: 'percentual' }
    ]))
    detalheConteudo.appendChild(renderTabelaSimples('Amostra dos registros', (relatorio.dados || []).slice(0, 8), [
      { titulo: 'Data', chave: 'criadoEm' },
      { titulo: 'Rota', chave: 'rota', classe: 'mono' },
      { titulo: 'Dispositivo', chave: 'dispositivo' },
      { titulo: 'Status', chave: 'status' }
    ]))
    detalhe.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  formulario.addEventListener('input', () => mostrarErro(''))
  campoInicio.addEventListener('change', calcularContagem)
  campoFim.addEventListener('change', calcularContagem)
  campoRota.addEventListener('change', calcularContagem)

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault()
    mostrarErro('')
    const inicio = campoInicio.value
    const fim = campoFim.value
    const dias = (new Date(`${fim}T00:00:00Z`) - new Date(`${inicio}T00:00:00Z`)) / 86400000
    if (!inicio || !fim || inicio > fim) {
      mostrarErro('A data inicial deve ser menor ou igual à data final.')
      return
    }
    if (dias > 366) {
      mostrarErro('O período não pode ultrapassar 366 dias.')
      return
    }

    botaoGerar.classList.add('is-loading')
    botaoGerar.disabled = true
    try {
      const resposta = await AdminUI.requisicao('/api/admin/relatorios', {
        metodo: 'POST',
        corpo: {
          nome: campoNome.value.trim() || `Relatório de acessos ${hoje}`,
          inicio,
          fim,
          rota: campoRota.value,
          formato: formatoSelecionado()
        }
      })
      AdminUI.toast(resposta?.mensagem || 'Relatório gerado com sucesso.', 'sucesso')
      campoNome.value = ''
      await carregarHistorico()
      await verDetalhes(resposta?.dados?.id)
    } catch (erro) {
      mostrarErro(erro.message)
    } finally {
      botaoGerar.classList.remove('is-loading')
      botaoGerar.disabled = false
    }
  })

  historico.addEventListener('click', async evento => {
    const botao = evento.target.closest('[data-acao]')
    if (!botao) return
    const id = botao.dataset.id
    if (botao.dataset.acao === 'ver') {
      try { await verDetalhes(id) } catch (erro) { AdminUI.toast(erro.message, 'erro') }
      return
    }
    if (botao.dataset.acao === 'download') {
      const item = (await AdminUI.requisicao(`/api/admin/relatorios/${id}`)).dados
      const extensao = botao.dataset.extensao
      try {
        await AdminUI.baixar(`/api/admin/relatorios/${id}/download?formato=${extensao}`, nomeArquivo(item, extensao))
        AdminUI.toast(`Download em ${extensao.toUpperCase()} iniciado.`, 'sucesso')
      } catch (erro) {
        AdminUI.toast(erro.message, 'erro')
      }
      return
    }
    if (botao.dataset.acao === 'excluir') {
      const confirmado = await AdminUI.confirmar('Excluir permanentemente este relatório do histórico?')
      if (!confirmado) return
      try {
        await AdminUI.requisicao(`/api/admin/relatorios/${id}`, { metodo: 'DELETE' })
        AdminUI.toast('Relatório removido do histórico.', 'sucesso')
        if (!detalhe.hidden && detalheTitulo.dataset.id === id) detalhe.hidden = true
        await carregarHistorico()
      } catch (erro) {
        AdminUI.toast(erro.message, 'erro')
      }
    }
  })

  seletor('[data-fechar-detalhe]').addEventListener('click', () => { detalhe.hidden = true })
  seletor('[data-atualizar-historico]').addEventListener('click', () => {
    carregarHistorico().catch(erro => AdminUI.toast(erro.message, 'erro'))
  })

  ;(async function iniciar() {
    const autorizado = await AdminUI.protegerPagina()
    if (!autorizado) return
    try {
      await carregarRotas()
      await Promise.all([carregarHistorico(), calcularContagem()])
    } catch (erro) {
      AdminUI.toast(erro.message, 'erro')
    }
  })()
})()
