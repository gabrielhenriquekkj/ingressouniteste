const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const MODELOS_DISPONIVEIS = [
  'qwen/qwen3.8-27b',
  'qwen/qwen3.6-27b',
  'allam-2-7b'
]

async function gerarResposta(mensagem) {
  const chaveGroq = process.env.chave_groq

  if (!chaveGroq) {
    throw new Error('Chave da API Groq não configurada')
  }

  let ultimoErro = null

  for (const modelo of MODELOS_DISPONIVEIS) {
    try {
      const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chaveGroq}`
        },
        body: JSON.stringify({
          model: modelo,
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente virtual para o sistema "Ingresso Universitário". Responda de forma útil e educativa sobre cursos, universidades, notas de corte, custos de moradia/alimentação/transporte, bolsas de estudo, auxílios, mercado de trabalho e estágios no Brasil. Seja conciso e direto. Se a pergunta não for sobre esses temas, dê uma resposta geral útil.'
            },
            {
              role: 'user',
              content: mensagem
            }
          ],
          temperature: 0.7,
          max_tokens: 512
        })
      })

      if (!resposta.ok) {
        const erro = await resposta.text()
        console.error(`[GROQ] Erro modelo ${modelo}:`, resposta.status, erro)
        ultimoErro = new Error(`Modelo ${modelo} falhou`)
        continue
      }

      const dados = await resposta.json()
      const conteudo = dados.choices[0].message.reasoning_content || dados.choices[0].message.content
      return conteudo
    } catch (err) {
      console.error(`[GROQ] Exceção modelo ${modelo}:`, err.message)
      ultimoErro = err
    }
  }

  throw ultimoErro || new Error('Nenhum modelo Groq respondeu')
}

module.exports = { gerarResposta }
