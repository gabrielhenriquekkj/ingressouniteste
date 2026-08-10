// api.js — Cliente Fetch genérico para a API do Ingresso Universitário (Express/REST).

// URL base da API (centralizada, mesmo padrão do app.js antigo)
const URL_API = 'http://localhost:3000/api'

// Executa uma requisição (GET/POST/DELETE) e retorna o JSON tratado.
// Lança um erro amigável caso haja falha de conexão ou resposta não-ok.
async function api(metodo, caminho, corpo) {
  let resposta
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: corpo ? JSON.stringify(corpo) : undefined
    })
  } catch {
    throw new Error('Sem conexão com o servidor.')
  }

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok || dados.sucesso === false) {
    const mensagem = dados.mensagem || 'Falha ao concluir a operação.'
    throw new Error(mensagem)
  }
  return dados
}