(function () {
  'use strict'

  const AdminUI = window.AdminUI
  AdminUI.iniciarBase()

  const alvo = seletor => document.querySelector(seletor)
  const els = {
    periodo: alvo('[data-periodo]'),
    atualizar: alvo('[data-atualizar]'),
    periodoLabel: alvo('[data-periodo-label]'),
    statusPill: alvo('[data-status-pill]'),
    statusTexto: alvo('[data-status-texto]'),
    grafico: alvo('[data-grafico]'),
    distribuicoes: alvo('[data-distribuicoes]'),
    ranking: alvo('[data-ranking]'),
    recentes: alvo('[data-recentes]'),
    acessos: alvo('[data-acessos]'),
    filtroRota: alvo('[data-filtro-rota]'),
    limparFiltro: alvo('[data-limpar-filtro]'),
    paginaInfo: alvo('[data-pagina-info]'),
    anterior: alvo('[data-pagina-anterior]'),
    proxima: alvo('[data-pagina-proxima]')
  }

  const estado = {
    painel: null,
    pagina: 1,
    totalPaginas: 1,
    ordem: { chave: 'criado_em', direcao: 'desc' }
  }

  const NS = 'http://www.w3.org/2000/svg'
  function svgElemento(nome, atributos = {}) {
    const elemento = document.createElementNS(NS, nome)
    for (const [chave, valor] of Object.entries(atributos)) elemento.setAttribute(chave, String(valor))
    return elemento
  }

  function desenharGrafico(serie) {
    const container = els.grafico
    container.replaceChildren()
    if (!Array.isArray(serie) || !serie.length) {
      const vazio = document.createElement('p')
      vazio.className = 'empty-state'
      vazio.textContent = 'Nenhum dado disponível para o período.'
      container.appendChild(vazio)
      return
    }

    const largura = 760
    const altura = 280
    const margem = { esquerda: 46, direita: 16, topo: 18, base: 38 }
    const areaLargura = largura - margem.esquerda - margem.direita
    const areaAltura = altura - margem.topo - margem.base
    const baseY = margem.topo + areaAltura
    const maior = Math.max(1, ...serie.map(item => Number(item.total) || 0))
    const passoX = areaLargura / Math.max(1, serie.length - 1)
    const pontos = serie.map((item, indice) => ({
      x: margem.esquerda + indice * passoX,
      y: margem.topo + areaAltura * (1 - (Number(item.total) || 0) / maior),
      dia: item.dia,
      total: Number(item.total) || 0
    }))

    const svg = svgElemento('svg', {
      class: 'chart-svg',
      viewBox: `0 0 ${largura} ${altura}`,
      role: 'img',
      'aria-label': `Gráfico de acessos diários. Máximo de ${maior} acessos.`
    })
    const titulo = svgElemento('title')
    titulo.textContent = 'Volume diário de acessos no período selecionado'
    svg.appendChild(titulo)

    const grade = svgElemento('g', { class: 'chart-grid' })
    for (let indice = 0; indice <= 4; indice += 1) {
      const y = margem.topo + (areaAltura / 4) * indice
      grade.appendChild(svgElemento('line', { x1: margem.esquerda, y1: y, x2: largura - margem.direita, y2: y }))
      const rotulo = svgElemento('text', { class: 'chart-label', x: margem.esquerda - 8, y: y + 4, 'text-anchor': 'end' })
      rotulo.textContent = String(Math.round(maior * (1 - indice / 4)))
      grade.appendChild(rotulo)
    }
    svg.appendChild(grade)

    const linha = pontos.map((ponto, indice) => `${indice ? 'L' : 'M'} ${ponto.x.toFixed(1)} ${ponto.y.toFixed(1)}`).join(' ')
    svg.appendChild(svgElemento('path', { class: 'chart-area', d: `${linha} L ${pontos[pontos.length - 1].x.toFixed(1)} ${baseY} L ${pontos[0].x.toFixed(1)} ${baseY} Z` }))
    svg.appendChild(svgElemento('path', { class: 'chart-line', d: linha }))

    const tooltip = document.createElement('div')
    tooltip.className = 'chart-tooltip'
    tooltip.dataset.visible = 'false'
    tooltip.setAttribute('aria-hidden', 'true')

    const indicesEtiqueta = [...new Set([
      0,
      Math.floor((pontos.length - 1) / 4),
      Math.floor((pontos.length - 1) / 2),
      Math.floor((pontos.length - 1) * 3 / 4),
      pontos.length - 1
    ])]

    pontos.forEach((ponto, indice) => {
      const circulo = svgElemento('circle', {
        class: 'chart-point',
        cx: ponto.x.toFixed(1),
        cy: ponto.y.toFixed(1),
        r: 4,
        tabindex: 0,
        role: 'img',
        'aria-label': `${AdminUI.dataCurta(ponto.dia)}: ${AdminUI.numero(ponto.total)} acessos`
      })
      const descricao = svgElemento('title')
      descricao.textContent = `${AdminUI.dataCurta(ponto.dia)}: ${AdminUI.numero(ponto.total)} acessos`
      circulo.appendChild(descricao)
      const mostrar = () => {
        tooltip.textContent = `${AdminUI.dataCurta(ponto.dia)} · ${AdminUI.numero(ponto.total)} acessos`
        tooltip.style.left = `${ponto.x}px`
        tooltip.style.top = `${ponto.y}px`
        tooltip.dataset.visible = 'true'
      }
      const ocultar = () => { tooltip.dataset.visible = 'false' }
      circulo.addEventListener('mouseenter', mostrar)
      circulo.addEventListener('focus', mostrar)
      circulo.addEventListener('mouseleave', ocultar)
      circulo.addEventListener('blur', ocultar)
      svg.appendChild(circulo)

      if (indicesEtiqueta.includes(indice)) {
        const etiqueta = svgElemento('text', {
          class: 'chart-label',
          x: ponto.x.toFixed(1),
          y: altura - 10,
          'text-anchor': indice === 0 ? 'start' : indice === pontos.length - 1 ? 'end' : 'middle'
        })
        etiqueta.textContent = AdminUI.dataCurta(ponto.dia)
        svg.appendChild(etiqueta)
      }
    })

    container.append(svg, tooltip)
  }

  function desenharSparklines(serie) {
    if (!Array.isArray(serie) || !serie.length) return
    const valores = serie.slice(-12).map(item => Number(item.total) || 0)
    const maior = Math.max(1, ...valores)
    const passo = 160 / Math.max(1, valores.length - 1)
    const caminho = valores.map((valor, indice) => {
      const x = indice * passo
      const y = 34 - (valor / maior) * 28
      return `${indice ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(' ')
    document.querySelectorAll('[data-spark] path').forEach(no => no.remove())
    document.querySelectorAll('[data-spark]').forEach(svg => {
      const path = svgElemento('path', { d: caminho })
      svg.appendChild(path)
    })
  }

  function renderKpis(dados) {
    for (const [chave, valor] of Object.entries(dados.kpis || {})) {
      const no = alvo(`[data-kpi="${chave}"]`)
      if (no) no.textContent = AdminUI.numero(valor)
    }
    const variacao = dados.periodo?.variacao
    const delta = alvo('[data-delta]')
    if (variacao === null || variacao === undefined) {
      delta.hidden = true
    } else {
      delta.hidden = false
      delta.dataset.sinal = variacao > 0 ? 'up' : variacao < 0 ? 'down' : 'zero'
      delta.textContent = `${variacao > 0 ? '↑' : variacao < 0 ? '↓' : '→'} ${AdminUI.decimal(Math.abs(variacao))}% vs. período anterior`
    }
    els.periodoLabel.textContent = `${dados.periodo?.dias || 30} dias · ${AdminUI.dataCurta(dados.periodo?.inicio)} a ${AdminUI.dataCurta(dados.periodo?.fim)}`
  }

  function renderDistribuicoes(dados) {
    els.distribuicoes.replaceChildren()
    const grupos = [
      { titulo: 'Dispositivos', itens: dados.dispositivos, cor: 0 },
      { titulo: 'Navegadores', itens: dados.navegadores, cor: 1 },
      { titulo: 'Sistemas', itens: dados.sistemas, cor: 2 }
    ]
    for (const grupo of grupos) {
      const bloco = document.createElement('div')
      bloco.className = 'dist-item'
      const cabecalho = document.createElement('div')
      cabecalho.className = 'dist-row'
      const titulo = document.createElement('strong')
      titulo.textContent = grupo.titulo
      const total = document.createElement('span')
      total.textContent = `${(grupo.itens || []).length} categoria(s)`
      cabecalho.append(titulo, total)
      bloco.appendChild(cabecalho)

      for (const item of (grupo.itens || []).slice(0, 4)) {
        const linha = document.createElement('div')
        linha.className = 'dist-item'
        const rotulo = document.createElement('div')
        rotulo.className = 'dist-row'
        const nome = document.createElement('span')
        nome.textContent = item.rotulo || 'Não informado'
        const percentual = document.createElement('span')
        percentual.textContent = `${AdminUI.decimal(item.percentual)}%`
        rotulo.append(nome, percentual)
        const trilha = document.createElement('div')
        trilha.className = 'track'
        const preenchimento = document.createElement('div')
        preenchimento.className = 'fill'
        preenchimento.dataset.cor = String(grupo.cor)
        preenchimento.style.width = `${Math.min(100, Math.max(0, Number(item.percentual) || 0))}%`
        trilha.appendChild(preenchimento)
        linha.append(rotulo, trilha)
        bloco.appendChild(linha)
      }
      if (!(grupo.itens || []).length) {
        const vazio = document.createElement('span')
        vazio.className = 'card-subtitle'
        vazio.textContent = 'Sem dados no período.'
        bloco.appendChild(vazio)
      }
      els.distribuicoes.appendChild(bloco)
    }
  }

  function renderRanking(itens) {
    els.ranking.replaceChildren()
    if (!(itens || []).length) {
      const vazio = document.createElement('li')
      vazio.className = 'empty-state'
      vazio.textContent = 'Nenhuma rota acessada no período.'
      els.ranking.appendChild(vazio)
      return
    }
    for (const item of itens) {
      const linha = document.createElement('li')
      linha.className = 'bar-item'
      const topo = document.createElement('div')
      topo.className = 'bar-top'
      const rota = document.createElement('span')
      rota.className = 'bar-rota'
      rota.textContent = item.rota
      rota.title = item.rota
      const valor = document.createElement('span')
      valor.className = 'bar-valor'
      valor.textContent = `${AdminUI.numero(item.total)} · ${AdminUI.decimal(item.percentual)}%`
      topo.append(rota, valor)
      const trilha = document.createElement('div')
      trilha.className = 'bar-track'
      const preenchimento = document.createElement('div')
      preenchimento.className = 'bar-fill'
      preenchimento.style.width = `${Math.min(100, Math.max(0, Number(item.percentual) || 0))}%`
      trilha.appendChild(preenchimento)
      linha.append(topo, trilha)
      els.ranking.appendChild(linha)
    }
  }

  function renderRecentes(itens) {
    els.recentes.replaceChildren()
    if (!(itens || []).length) {
      const linha = document.createElement('tr')
      const celula = document.createElement('td')
      celula.colSpan = 3
      celula.className = 'empty-state'
      celula.textContent = 'Nenhum acesso recente.'
      linha.appendChild(celula)
      els.recentes.appendChild(linha)
      return
    }
    for (const item of itens) {
      const linha = document.createElement('tr')
      const rota = document.createElement('td')
      rota.className = 'mono'
      rota.textContent = item.rota
      const horario = document.createElement('td')
      horario.textContent = AdminUI.dataHora(item.criadoEm)
      const area = document.createElement('td')
      const badge = document.createElement('span')
      badge.className = 'badge'
      badge.dataset.tipo = item.area === 'admin' ? 'admin' : undefined
      badge.textContent = item.area === 'admin' ? 'Admin' : 'Público'
      area.appendChild(badge)
      linha.append(rota, horario, area)
      els.recentes.appendChild(linha)
    }
  }

  function statusBadge(status) {
    const badge = document.createElement('span')
    badge.className = 'badge'
    if (status === null || status === undefined) {
      badge.textContent = '—'
    } else {
      badge.dataset.tipo = Number(status) >= 400 ? 'erro' : 'ok'
      badge.textContent = String(status)
    }
    return badge
  }

  function renderAcessos() {
    const registros = [...(estado.registros || [])]
    const { chave, direcao } = estado.ordem
    registros.sort((a, b) => {
      const valorA = a[chave] ?? ''
      const valorB = b[chave] ?? ''
      const comparacao = typeof valorA === 'number' && typeof valorB === 'number'
        ? valorA - valorB
        : String(valorA).localeCompare(String(valorB), 'pt-BR', { numeric: true, sensitivity: 'base' })
      return direcao === 'asc' ? comparacao : -comparacao
    })

    document.querySelectorAll('[data-ordenar]').forEach(botao => {
      const th = botao.closest('th')
      if (botao.dataset.ordenar === chave) th.setAttribute('aria-sort', direcao === 'asc' ? 'ascending' : 'descending')
      else th.removeAttribute('aria-sort')
    })

    els.acessos.replaceChildren()
    if (!registros.length) {
      const linha = document.createElement('tr')
      const celula = document.createElement('td')
      celula.colSpan = 7
      celula.className = 'empty-state'
      celula.textContent = 'Nenhum registro encontrado para os filtros atuais.'
      linha.appendChild(celula)
      els.acessos.appendChild(linha)
      return
    }

    for (const registro of registros) {
      const linha = document.createElement('tr')
      const celulas = [
        AdminUI.dataHora(registro.criado_em),
        registro.rota,
        registro.area === 'admin' ? 'Admin' : 'Público',
        registro.dispositivo,
        registro.navegador,
        null,
        registro.ip_hash
      ]
      celulas.forEach((valor, indice) => {
        const celula = document.createElement('td')
        if (indice === 1 || indice === 6) celula.className = 'mono'
        if (indice === 5) celula.appendChild(statusBadge(registro.status))
        else celula.textContent = valor ?? '—'
        linha.appendChild(celula)
      })
      els.acessos.appendChild(linha)
    }
  }

  async function carregarAcessos() {
    const parametros = new URLSearchParams({ pagina: String(estado.pagina), limite: '12' })
    if (els.filtroRota.value) parametros.set('rota', els.filtroRota.value)
    const resposta = await AdminUI.requisicao(`/api/admin/acessos?${parametros}`)
    const dados = resposta?.dados || {}
    estado.registros = dados.dados || []
    estado.totalPaginas = dados.paginas || 1
    estado.pagina = dados.pagina || 1
    els.paginaInfo.textContent = `Página ${estado.pagina} de ${estado.totalPaginas} · ${AdminUI.numero(dados.total)} registro(s)`
    els.anterior.disabled = estado.pagina <= 1
    els.proxima.disabled = estado.pagina >= estado.totalPaginas
    renderAcessos()
  }

  async function carregarRotas() {
    const resposta = await AdminUI.requisicao('/api/admin/rotas')
    const atual = els.filtroRota.value
    els.filtroRota.replaceChildren()
    const todas = document.createElement('option')
    todas.value = ''
    todas.textContent = 'Todas as rotas'
    els.filtroRota.appendChild(todas)
    for (const item of resposta?.dados || []) {
      const opcao = document.createElement('option')
      opcao.value = item.rota
      opcao.textContent = `${item.rota} (${AdminUI.numero(item.total)})`
      els.filtroRota.appendChild(opcao)
    }
    els.filtroRota.value = atual
  }

  function marcarStatus(atualizado, mensagem) {
    els.statusPill.dataset.stale = String(!atualizado)
    els.statusTexto.textContent = mensagem
  }

  async function carregarPainel() {
    const periodo = els.periodo.value
    const resposta = await AdminUI.requisicao(`/api/admin/dashboard?periodo=${periodo}`)
    estado.painel = resposta?.dados || {}
    renderKpis(estado.painel)
    desenharGrafico(estado.painel.serie)
    desenharSparklines(estado.painel.serie)
    renderDistribuicoes(estado.painel)
    renderRanking(estado.painel.ranking)
    renderRecentes(estado.painel.recentes)
    marcarStatus(true, `Atualizado às ${new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`)
  }

  async function recarregarTudo() {
    els.atualizar.classList.add('is-loading')
    els.atualizar.disabled = true
    marcarStatus(false, 'Atualizando…')
    try {
      await Promise.all([carregarPainel(), carregarAcessos()])
    } catch (erro) {
      marcarStatus(false, 'Falha na atualização')
      AdminUI.toast(erro.message, 'erro')
    } finally {
      els.atualizar.classList.remove('is-loading')
      els.atualizar.disabled = false
    }
  }

  els.atualizar.addEventListener('click', recarregarTudo)
  els.periodo.addEventListener('change', () => {
    carregarPainel().catch(erro => AdminUI.toast(erro.message, 'erro'))
  })
  els.filtroRota.addEventListener('change', () => { estado.pagina = 1; carregarAcessos().catch(erro => AdminUI.toast(erro.message, 'erro')) })
  els.limparFiltro.addEventListener('click', () => {
    els.filtroRota.value = ''
    estado.pagina = 1
    carregarAcessos().catch(erro => AdminUI.toast(erro.message, 'erro'))
  })
  els.anterior.addEventListener('click', () => {
    if (estado.pagina > 1) {
      estado.pagina -= 1
      carregarAcessos().catch(erro => AdminUI.toast(erro.message, 'erro'))
    }
  })
  els.proxima.addEventListener('click', () => {
    if (estado.pagina < estado.totalPaginas) {
      estado.pagina += 1
      carregarAcessos().catch(erro => AdminUI.toast(erro.message, 'erro'))
    }
  })
  document.querySelectorAll('[data-ordenar]').forEach(botao => {
    botao.addEventListener('click', () => {
      const chave = botao.dataset.ordenar
      estado.ordem = {
        chave,
        direcao: estado.ordem.chave === chave && estado.ordem.direcao === 'desc' ? 'asc' : 'desc'
      }
      renderAcessos()
    })
  })

  ;(async function iniciar() {
    const autorizado = await AdminUI.protegerPagina()
    if (!autorizado) return
    try {
      await carregarRotas()
      await recarregarTudo()
    } catch (erro) {
      AdminUI.toast(erro.message, 'erro')
    }
    globalThis.setInterval(() => {
      if (!document.hidden) recarregarTudo().catch(() => {})
    }, 30000)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) carregarPainel().catch(() => {})
    })
  })()
})()
