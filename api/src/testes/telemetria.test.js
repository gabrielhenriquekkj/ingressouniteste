const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const http = require('http')
const path = require('path')

const caminhoBanco = path.resolve(__dirname, '../../db/test_telemetria.db')
for (const sufixo of ['', '-wal', '-shm']) {
  fs.rmSync(`${caminhoBanco}${sufixo}`, { force: true })
}

process.env.NODE_ENV = 'test'
process.env.TEST_DB = caminhoBanco
process.env.IP_HASH_SALT = 'sal-de-ip-para-testes-de-telemetria'

for (const chave of Object.keys(require.cache)) {
  if (/conexaoBanco|iniciarBanco|segurancaAdmin/.test(chave)) delete require.cache[chave]
}

const app = require('../app')
require('../../iniciarBanco')

let servidor
let porta

function requisicao(caminho, corpo, origem) {
  return new Promise((resolve, reject) => {
    const corpoTexto = JSON.stringify(corpo)
    const req = http.request({
      hostname: 'localhost',
      port: porta,
      path: caminho,
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(corpoTexto),
        Origin: origem || `http://localhost:${porta}`,
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) Firefox/130.0'
      }
    }, res => {
      let dados = ''
      res.on('data', parte => { dados += parte })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, dados: JSON.parse(dados) }) }
        catch { resolve({ status: res.statusCode, dados }) }
      })
    })
    req.on('error', reject)
    req.write(corpoTexto)
    req.end()
  })
}

before(async () => {
  await new Promise(resolve => {
    servidor = app.listen(0, () => { porta = servidor.address().port; resolve() })
  })
})

after(() => {
  if (servidor) servidor.close()
})

describe('Telemetria da interface', () => {
  it('registra eventos públicos com dados anonimizados', async () => {
    const resposta = await requisicao('/api/telemetria', {
      evento: 'notas-corte',
      detalhes: { origem: 'home' }
    })

    assert.equal(resposta.status, 202)
    assert.equal(resposta.dados.sucesso, true)

    const banco = require('../configuracoes/conexaoBanco')
    const registro = banco.prepare('SELECT * FROM acessos ORDER BY id DESC LIMIT 1').get()
    assert.equal(registro.rota, '/publico/secoes/notas-de-corte')
    assert.equal(registro.metodo, 'POST')
    assert.equal(registro.area, 'publico')
    assert.equal(registro.status, 202)
    assert.equal(registro.navegador, 'Firefox')
    assert.match(registro.ip_hash, /^[a-f0-9]{20}$/)
    assert.match(registro.dia, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(registro.criado_em)
    assert.match(registro.detalhes, /origem=home/)
  })

  it('rejeita eventos desconhecidos', async () => {
    const resposta = await requisicao('/api/telemetria', { evento: 'evento-inexistente' })
    assert.equal(resposta.status, 400)
    assert.equal(resposta.dados.sucesso, false)
  })

  it('rejeita requisições de origem externa', async () => {
    const resposta = await requisicao('/api/telemetria', { evento: 'busca' }, 'https://site-externo.invalid')
    assert.equal(resposta.status, 403)
  })
})
