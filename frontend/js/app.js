// URL base da API (ajuste se necessário)
const URL_API = 'http://localhost:3000/api'

// Referências do DOM
const formulario = document.getElementById('formLead')
const btnEnviar = document.getElementById('btnEnviar')
const textoBtn = document.getElementById('textoBtn')
const spinnerBtn = document.getElementById('spinnerBtn')
const toast = document.getElementById('toast')
const inputTel = document.getElementById('telefone_whatsapp')

// Aplica máscara de telefone (xx) xxxxx-xxxx
inputTel.addEventListener('input', function () {
  let digitos = this.value.replace(/\D/g, '').slice(0, 11)
  if (digitos.length > 2) digitos = `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  if (digitos.length > 10) digitos = `${digitos.slice(0, 10)}-${digitos.slice(10)}`
  this.value = digitos
})

// Exibe toast com mensagem e cor (sucesso/erro)
function exibirToast(mensagem, tipo) {
  toast.textContent = mensagem
  toast.className = `fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all duration-300 z-50 ${tipo === 'sucesso' ? 'bg-green-600' : 'bg-red-600'}`
  toast.classList.remove('hidden')
  setTimeout(() => toast.classList.add('hidden'), 4000)
}

// Alterna estado de carregamento do botão
function alternarCarregando(ativo) {
  btnEnviar.disabled = ativo
  spinnerBtn.classList.toggle('hidden', !ativo)
  textoBtn.textContent = ativo ? 'Enviando...' : 'Enviar mensagem'
}

// Função genérica para chamadas Fetch à API
async function api(método, corpo) {
  const resposta = await fetch(`${URL_API}/leads`, {
    method: método,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  })
  return resposta.json()
}

// Submissão do formulário via Fetch sem refresh
formulario.addEventListener('submit', async function (e) {
  e.preventDefault()
  if (btnEnviar.disabled) return

  alternarCarregando(true)

  try {
    const dados = {
      nome_completo: document.getElementById('nome_completo').value.trim(),
      email: document.getElementById('email').value.trim(),
      telefone_whatsapp: inputTel.value,
      mensagem: document.getElementById('mensagem').value.trim()
    }

    const resultado = await api('POST', dados)

    if (resultado.sucesso) {
      exibirToast(resultado.mensagem || 'Os dados do formulário foram enviados com sucesso!', 'sucesso')
      formulario.reset()
    } else {
      const msg = resultado.erros ? resultado.erros.join(' ') : resultado.mensagem
      exibirToast(msg || 'Erro ao enviar. Tente novamente.', 'erro')
    }
  } catch {
    exibirToast('Erro de conexão com o servidor.', 'erro')
  } finally {
    alternarCarregando(false)
  }
})
