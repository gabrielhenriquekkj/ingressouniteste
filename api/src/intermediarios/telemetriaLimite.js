const JANELA_MS = 10 * 60 * 1000
const LIMITE = Math.max(1, Number(process.env.TELEMETRIA_LIMITE) || 40)
const tentativas = new Map()

function limparAntigas(agora) {
  for (const [chave, registro] of tentativas.entries()) {
    if (agora - registro.inicio > JANELA_MS) tentativas.delete(chave)
  }
}

const limpeza = setInterval(() => limparAntigas(Date.now()), JANELA_MS)
if (typeof limpeza.unref === 'function') limpeza.unref()

function limitarTelemetria(requisicao, resposta, proximo) {
  const agora = Date.now()
  const ip = String(requisicao.ip || requisicao.socket?.remoteAddress || 'desconhecido')
  const registro = tentativas.get(ip)

  limparAntigas(agora)

  if (!registro || agora - registro.inicio > JANELA_MS) {
    tentativas.set(ip, { inicio: agora, total: 1 })
    return proximo()
  }

  if (registro.total >= LIMITE) {
    resposta.status(429).json({
      sucesso: false,
      mensagem: 'Muitas interações registradas. Tente novamente em alguns minutos.'
    })
    return
  }

  registro.total += 1
  proximo()
}

module.exports = limitarTelemetria
