const URL_API = '/api/groq-chat'

async function enviarMensagem(mensagem) {
  const resposta = await fetch(URL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ mensagem })
  })

  const dados = await resposta.json()
  return dados
}

function adicionarMensagem(texto, isUser = false) {
  const container = document.getElementById('chat-messages')
  const div = document.createElement('div')
  div.className = `p-3 rounded-lg max-w-[80%] ${
    isUser ? 'bg-indigo-600 text-white ml-auto' : 'bg-gray-200 text-gray-800 mr-auto'
  }`
  div.textContent = texto
  container.appendChild(div)
  container.scrollTop = container.scrollHeight
}

function mostrarDigitando() {
  const container = document.getElementById('chat-messages')
  const div = document.createElement('div')
  div.id = 'bot-digitando'
  div.className = 'p-3 rounded-lg bg-gray-200 text-gray-800 mr-auto max-w-[80%] mb-2'
  div.innerHTML = '<span class="text-sm">Bot está digitando...</span>'
  container.appendChild(div)
  container.scrollTop = container.scrollHeight
}

function removerDigitando() {
  const elemento = document.getElementById('bot-digitando')
  if (elemento) elemento.remove()
}