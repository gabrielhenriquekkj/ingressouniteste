// api.js — Cliente Fetch generico para a API do Ingresso Universitario (Express/REST).

const URL_API = '/api'

async function api(metodo, caminho, corpo) {
  let resposta
  try {
    const opcoes = {
      method: metodo,
      headers: {}
    }
    if (corpo) {
      opcoes.headers['Content-Type'] = 'application/json'
      opcoes.body = JSON.stringify(corpo)
    }
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
