// api.js — Cliente Fetch generico para a API do Ingresso Universitario (Express/REST).

// URL base relativa (funciona em qualquer host/porta)
const URL_API = '/api'

// Executa uma requisicao (GET/POST/DELETE) e retorna o JSON tratado.
async function api(metodo, caminho, corpo) {
  let resposta
  try {
    const opcoes = {
      method: metodo,
      headers: { 'Content-Type': 'application/json' }
    }
    if (corpo) opcoes.body = JSON.stringify(corpo)
    resposta = await fetch(`${URL_API}${caminho}`, opcoes)
  } catch {
    throw new Error('Sem conexao com o servidor.')
  }

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok || dados.sucesso === false) {
    const mensagem = dados.mensagem || 'Falha ao concluir a operacao.'
    throw new Error(mensagem)
  }
  return dados
}
