(function (global) {
  'use strict'

  const Fuso = 'America/Sao_Paulo'
  const CHAVE_TEMA = 'admin_tema'
  const CHAVE_MENU = 'admin_menu_colapsado'
  const CHAVE_CSRF = 'admin_csrf'

  function configurarTema() {
    let tema
    try { tema = localStorage.getItem(CHAVE_TEMA) } catch { tema = null }
    if (tema === 'light' || tema === 'dark') {
      document.documentElement.dataset.theme = tema
    } else {
      delete document.documentElement.dataset.theme
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(botao => {
      const escuro = document.documentElement.dataset.theme === 'dark' ||
        (!document.documentElement.dataset.theme && global.matchMedia?.('(prefers-color-scheme: dark)').matches)
      botao.setAttribute('aria-pressed', String(escuro))
      botao.setAttribute('aria-label', escuro ? 'Ativar tema claro' : 'Ativar tema escuro')
      botao.title = escuro ? 'Ativar tema claro' : 'Ativar tema escuro'
    })
  }

  function alternarTema() {
    const escuro = document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme && global.matchMedia?.('(prefers-color-scheme: dark)').matches)
    const proximo = escuro ? 'light' : 'dark'
    document.documentElement.dataset.theme = proximo
    try { localStorage.setItem(CHAVE_TEMA, proximo) } catch { /* armazenamento indisponível */ }
    configurarTema()
  }

  function configurarMenu() {
    let colapsado = false
    try { colapsado = localStorage.getItem(CHAVE_MENU) === 'true' } catch { colapsado = false }
    document.body.classList.toggle('sidebar-collapsed', colapsado)
  }

  function alternarMenu() {
    if (global.matchMedia?.('(max-width: 899px)').matches) {
      document.body.classList.toggle('sidebar-open')
      return
    }
    const colapsado = document.body.classList.toggle('sidebar-collapsed')
    try { localStorage.setItem(CHAVE_MENU, String(colapsado)) } catch { /* armazenamento indisponível */ }
  }

  function fecharMenu() {
    document.body.classList.remove('sidebar-open')
  }

  function garantirRegiaoToasts() {
    let regiao = document.querySelector('[data-toast-region]')
    if (!regiao) {
      regiao = document.createElement('div')
      regiao.className = 'toast-region'
      regiao.dataset.toastRegion = ''
      regiao.setAttribute('role', 'status')
      regiao.setAttribute('aria-live', 'polite')
      document.body.appendChild(regiao)
    }
    return regiao
  }

  function toast(mensagem, tipo = 'info') {
    const regiao = garantirRegiaoToasts()
    const item = document.createElement('div')
    item.className = 'toast'
    item.dataset.tipo = tipo
    const texto = document.createElement('span')
    texto.textContent = mensagem
    const botao = document.createElement('button')
    botao.type = 'button'
    botao.setAttribute('aria-label', 'Fechar aviso')
    botao.textContent = '×'
    botao.addEventListener('click', () => item.remove())
    item.append(texto, botao)
    regiao.appendChild(item)
    global.setTimeout(() => item.remove(), 6000)
  }

  function escapar(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[caractere])
  }

  function numero(valor) {
    return new Intl.NumberFormat('pt-BR').format(Number(valor) || 0)
  }

  function decimal(valor) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(Number(valor) || 0)
  }

  function diaLocal(data = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: Fuso, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(data)
  }

  function deslocarDia(dia, quantidade) {
    const data = new Date(`${dia}T12:00:00Z`)
    data.setUTCDate(data.getUTCDate() + quantidade)
    return data.toISOString().slice(0, 10)
  }

  function dataCurta(dia) {
    if (!dia) return '—'
    const [ano, mes, diaNumero] = String(dia).split('-').map(Number)
    if (!ano || !mes || !diaNumero) return String(dia)
    return `${String(diaNumero).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
  }

  function dataHora(valor) {
    if (!valor) return '—'
    const data = new Date(valor)
    if (Number.isNaN(data.getTime())) return String(valor)
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: Fuso, day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(data)
  }

  function csrf() {
    try { return sessionStorage.getItem(CHAVE_CSRF) || '' } catch { return '' }
  }

  function definirCsrf(valor) {
    try {
      if (valor) sessionStorage.setItem(CHAVE_CSRF, valor)
      else sessionStorage.removeItem(CHAVE_CSRF)
    } catch { /* armazenamento indisponível */ }
  }

  function redirectLogin(motivo = 'sessao') {
    definirCsrf('')
    global.location.replace(`/admin/?motivo=${encodeURIComponent(motivo)}`)
  }

  async function requisicao(caminho, opcoes = {}) {
    const metodo = (opcoes.metodo || 'GET').toUpperCase()
    const cabecalhos = { Accept: 'application/json', ...(opcoes.cabecalhos || {}) }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo) && csrf()) {
      cabecalhos['X-CSRF-Token'] = csrf()
    }
    let corpo
    if (opcoes.corpo !== undefined) {
      cabecalhos['Content-Type'] = 'application/json'
      corpo = JSON.stringify(opcoes.corpo)
    }

    let resposta
    try {
      resposta = await fetch(caminho, {
        method: metodo,
        headers: cabecalhos,
        body: corpo,
        credentials: 'same-origin',
        cache: 'no-store'
      })
    } catch {
      throw new Error('Não foi possível conectar ao servidor.')
    }

    if (resposta.status === 401 && !opcoes.silent401) {
      redirectLogin()
      throw new Error('Sessão encerrada.')
    }

    let conteudo = null
    if (resposta.status !== 204) {
      const texto = await resposta.text()
      if (texto) {
        try { conteudo = JSON.parse(texto) } catch { conteudo = texto }
      }
    }

    if (!resposta.ok) {
      const erro = new Error(conteudo?.mensagem || `Falha na requisição (${resposta.status}).`)
      erro.status = resposta.status
      erro.dados = conteudo
      throw erro
    }
    return conteudo
  }

  async function baixar(caminho, nomeArquivo) {
    let resposta
    try {
      resposta = await fetch(caminho, { credentials: 'same-origin', cache: 'no-store' })
    } catch {
      throw new Error('Não foi possível conectar ao servidor.')
    }
    if (resposta.status === 401) {
      redirectLogin()
      throw new Error('Sessão encerrada.')
    }
    if (!resposta.ok) {
      let conteudo = null
      try { conteudo = await resposta.json() } catch { /* resposta binária */ }
      throw new Error(conteudo?.mensagem || 'Falha ao baixar o relatório.')
    }
    const blob = await resposta.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nomeArquivo || 'relatorio'
    document.body.appendChild(link)
    link.click()
    link.remove()
    global.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function sessao() {
    const resposta = await requisicao('/api/admin/session', { silent401: true })
    definirCsrf(resposta?.dados?.csrfToken || '')
    AdminUI.usuario = resposta?.dados?.usuario || null
    AdminUI.expiraEm = resposta?.dados?.expiraEm || null
    document.querySelectorAll('[data-user-name]').forEach(no => { no.textContent = resposta?.dados?.usuario?.nome || 'Administrador' })
    document.querySelectorAll('[data-user-email]').forEach(no => { no.textContent = resposta?.dados?.usuario?.email || '' })
    document.querySelectorAll('[data-user-initial]').forEach(no => {
      no.textContent = (resposta?.dados?.usuario?.nome || 'A').trim().charAt(0).toUpperCase()
    })
    return resposta
  }

  async function protegerPagina() {
    try {
      await sessao()
      return true
    } catch (erro) {
      if (erro.status === 401) redirectLogin()
      else toast(erro.message, 'erro')
      return false
    }
  }

  async function logout() {
    try {
      await requisicao('/api/admin/logout', { metodo: 'POST' })
    } catch (erro) {
      toast(erro.message, 'erro')
    } finally {
      definirCsrf('')
      global.location.replace('/admin/?motivo=saida')
    }
  }

  function confirmar(mensagem) {
    return new Promise(resolve => {
      const dialogo = document.createElement('dialog')
      dialogo.className = 'confirm-dialog'
      const titulo = document.createElement('h2')
      titulo.textContent = 'Confirmar ação'
      const texto = document.createElement('p')
      texto.textContent = mensagem
      const acoes = document.createElement('div')
      acoes.className = 'form-actions'
      const cancelar = document.createElement('button')
      cancelar.type = 'button'
      cancelar.className = 'btn btn-ghost'
      cancelar.textContent = 'Cancelar'
      const confirmarBotao = document.createElement('button')
      confirmarBotao.type = 'button'
      confirmarBotao.className = 'btn btn-danger'
      confirmarBotao.textContent = 'Confirmar exclusão'
      acoes.append(cancelar, confirmarBotao)
      dialogo.append(titulo, texto, acoes)
      document.body.appendChild(dialogo)
      const fechar = valor => {
        dialogo.close()
        dialogo.remove()
        resolve(valor)
      }
      cancelar.addEventListener('click', () => fechar(false))
      confirmarBotao.addEventListener('click', () => fechar(true))
      dialogo.addEventListener('cancel', evento => { evento.preventDefault(); fechar(false) })
      dialogo.showModal()
    })
  }

  function ligarEventosBase() {
    document.addEventListener('click', evento => {
      if (evento.target.closest('[data-theme-toggle]')) alternarTema()
      if (evento.target.closest('[data-menu-toggle]')) alternarMenu()
      if (evento.target.closest('[data-sidebar-backdrop]')) fecharMenu()
      if (evento.target.closest('[data-action="logout"]')) logout()
    })
    document.addEventListener('keydown', evento => {
      if (evento.key === 'Escape') fecharMenu()
    })
    global.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
      if (!localStorage.getItem(CHAVE_TEMA)) configurarTema()
    })
  }

  function iniciarBase() {
    configurarTema()
    configurarMenu()
    ligarEventosBase()
    garantirRegiaoToasts()
  }

  const AdminUI = {
    Fuso,
    iniciarBase,
    protegerPagina,
    sessao,
    requisicao,
    baixar,
    toast,
    confirmar,
    logout,
    csrf,
    definirCsrf,
    escapar,
    numero,
    decimal,
    diaLocal,
    deslocarDia,
    dataCurta,
    dataHora,
    redirectLogin,
    usuario: null,
    expiraEm: null
  }

  global.AdminUI = AdminUI
})(window)
