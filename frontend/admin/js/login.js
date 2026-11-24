(function () {
  'use strict'

  const AdminUI = window.AdminUI
  AdminUI.iniciarBase()

  const formulario = document.querySelector('[data-login-form]')
  const erro = document.querySelector('[data-erro-login]')
  const botao = formulario.querySelector('[data-submit]')
  const email = formulario.querySelector('[name="email"]')
  const senha = formulario.querySelector('[name="senha"]')

  const motivo = new URLSearchParams(location.search).get('motivo')
  if (motivo === 'sessao') AdminUI.toast('Sua sessão expirou. Entre novamente para continuar.', 'erro')
  if (motivo === 'saida') AdminUI.toast('Sessão encerrada com sucesso.', 'sucesso')

  function mostrarErro(mensagem) {
    erro.textContent = mensagem
    erro.hidden = !mensagem
  }

  formulario.addEventListener('input', () => mostrarErro(''))

  document.querySelector('[data-toggle-senha]').addEventListener('click', evento => {
    const botaoOlho = evento.currentTarget
    const novaVisibilidade = senha.type === 'password' ? 'text' : 'password'
    senha.type = novaVisibilidade
    botaoOlho.setAttribute('aria-label', novaVisibilidade === 'text' ? 'Ocultar senha' : 'Mostrar senha')
    botaoOlho.querySelector('svg').style.opacity = novaVisibilidade === 'text' ? '0.6' : '1'
  })

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault()
    mostrarErro('')

    if (!email.value.trim() || !senha.value) {
      mostrarErro('Informe seu e-mail e sua senha.')
      email.focus()
      return
    }

    botao.classList.add('is-loading')
    botao.disabled = true
    try {
      const resposta = await AdminUI.requisicao('/api/admin/login', {
        metodo: 'POST',
        corpo: { email: email.value.trim(), senha: senha.value }
      })
      AdminUI.definirCsrf(resposta?.dados?.csrfToken || '')
      location.replace('/admin/dashboard/')
    } catch (erroReq) {
      mostrarErro(erroReq.message)
      if (erroReq.status === 401) {
        senha.value = ''
        senha.focus()
      }
    } finally {
      botao.classList.remove('is-loading')
      botao.disabled = false
    }
  })

  AdminUI.sessao().then(resposta => {
    if (resposta?.sucesso) location.replace('/admin/dashboard/')
  }).catch(() => {})
})()
