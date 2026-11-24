const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const http = require('http')
const fs = require('fs')
const path = require('path')

const caminhoBanco = path.resolve(__dirname, '../../db/test_admin_integracao.db')
for (const sufixo of ['', '-wal', '-shm']) {
  fs.rmSync(`${caminhoBanco}${sufixo}`, { force: true })
}

process.env.NODE_ENV = 'test'
process.env.TEST_DB = caminhoBanco
process.env.ADMIN_EMAIL = 'admin@teste.local'
process.env.ADMIN_SENHA = 'senha-forte-de-teste-2026'
process.env.ADMIN_SESSION_SECRET = 'segredo-de-sessao-para-testes-2026'
process.env.IP_HASH_SALT = 'sal-de-ip-para-testes-2026'

for (const chave of Object.keys(require.cache)) {
  if (/conexaoBanco|iniciarBanco|segurancaAdmin/.test(chave)) delete require.cache[chave]
}

const app = require('../app')
require('../../iniciarBanco')

let servidor
let porta
let cookies = {}
let csrf = ''

function mesclarCookies(cabecalhos = []) {
  for (const item of cabecalhos) {
    const [par] = item.split(';')
    const indice = par.indexOf('=')
    if (indice < 0) continue
    cookies[par.slice(0, indice).trim()] = par.slice(indice + 1).trim()
  }
}

function requisicao(metodo, caminho, corpo, opcoes = {}) {
  return new Promise((resolve, reject) => {
    const corpoTexto = corpo ? JSON.stringify(corpo) : null
    const headers = {
      Accept: 'application/json',
      Origin: `http://localhost:${porta}`,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      ...(opcoes.headers || {})
    }
    if (corpoTexto) {
      headers['Content-Type'] = 'application/json'
      headers['Content-Length'] = Buffer.byteLength(corpoTexto)
    }
    if (Object.keys(cookies).length && !opcoes.semCookies) {
      headers.Cookie = Object.entries(cookies).map(([chave, valor]) => `${chave}=${valor}`).join('; ')
    }

    const req = http.request({ hostname: 'localhost', port: porta, path: caminho, method: metodo, headers }, res => {
      const partes = []
      res.on('data', parte => partes.push(parte))
      res.on('end', () => {
        const buffer = Buffer.concat(partes)
        let dados = buffer
        if ((res.headers['content-type'] || '').includes('json')) {
          try { dados = JSON.parse(buffer.toString('utf8')) } catch { dados = buffer.toString('utf8') }
        } else {
          dados = buffer.toString('utf8')
        }
        resolve({ status: res.statusCode, dados, buffer, headers: res.headers })
      })
    })
    req.on('error', reject)
    if (corpoTexto) req.write(corpoTexto)
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

describe('Área administrativa', () => {
  it('registra acesso anônimo à página pública com IP anonimizado', async () => {
    const resposta = await requisicao('GET', '/', null, { headers: { Accept: 'text/html' } })
    assert.equal(resposta.status, 200)
    const banco = require('../configuracoes/conexaoBanco')
    const acesso = banco.prepare('SELECT * FROM acessos ORDER BY id DESC LIMIT 1').get()
    assert.equal(acesso.rota, '/')
    assert.equal(acesso.dispositivo, 'smartphone')
    assert.equal(acesso.sistema, 'iOS')
    assert.equal(acesso.area, 'publico')
    assert.match(acesso.ip_hash, /^[a-f0-9]{20}$/)
  })

  it('serve as páginas e os assets da área administrativa', async () => {
    const login = await requisicao('GET', '/admin/', null, { headers: { Accept: 'text/html' } })
    assert.equal(login.status, 200)
    assert.match(login.dados, /data-login-form/)

    const dashboard = await requisicao('GET', '/admin/dashboard/', null, { headers: { Accept: 'text/html' } })
    assert.equal(dashboard.status, 200)
    assert.match(dashboard.dados, /data-grafico/)

    const relatorios = await requisicao('GET', '/admin/relatorios/', null, { headers: { Accept: 'text/html' } })
    assert.equal(relatorios.status, 200)
    assert.match(relatorios.dados, /data-form-relatorio/)

    const script = await requisicao('GET', '/admin/js/dashboard.js')
    assert.equal(script.status, 200)
    assert.match(script.headers['content-type'], /javascript/)
  })

  it('bloqueia o dashboard sem autenticação', async () => {
    const resposta = await requisicao('GET', '/api/admin/dashboard', null, { semCookies: true })
    assert.equal(resposta.status, 401)
  })

  it('rejeita senha incorreta sem revelar o usuário', async () => {
    const resposta = await requisicao('POST', '/api/admin/login', {
      email: process.env.ADMIN_EMAIL, senha: 'senha-errada'
    }, { semCookies: true })
    assert.equal(resposta.status, 401)
    assert.equal(resposta.dados.mensagem, 'Credenciais inválidas.')
  })

  it('autentica e define cookie HttpOnly com CSRF', async () => {
    const resposta = await requisicao('POST', '/api/admin/login', {
      email: process.env.ADMIN_EMAIL, senha: process.env.ADMIN_SENHA
    }, { semCookies: true })
    assert.equal(resposta.status, 200)
    assert.equal(resposta.dados.dados.usuario.role, 'admin')
    assert.ok(resposta.dados.dados.csrfToken)
    assert.ok((resposta.headers['set-cookie'] || []).some(item => /HttpOnly/i.test(item)))
    assert.ok((resposta.headers['set-cookie'] || []).some(item => /SameSite=Strict/i.test(item)))
    mesclarCookies(resposta.headers['set-cookie'])
    csrf = resposta.dados.dados.csrfToken
  })

  it('exige CSRF para gerar relatórios', async () => {
    const resposta = await requisicao('POST', '/api/admin/relatorios', {
      nome: 'Sem token', formato: 'json', inicio: '2026-01-01', fim: '2026-12-31'
    })
    assert.equal(resposta.status, 403)
  })

  it('gera, salva e exporta relatório em JSON, CSV e PDF', async () => {
    const hoje = new Date()
    const inicio = new Date(hoje.getTime() - 29 * 86400000).toISOString().slice(0, 10)
    const resposta = await requisicao('POST', '/api/admin/relatorios', {
      nome: 'Relatório de acessos', formato: 'json', inicio, fim: hoje.toISOString().slice(0, 10)
    }, { headers: { 'X-CSRF-Token': csrf } })
    assert.equal(resposta.status, 201)
    const id = resposta.dados.dados.id
    assert.ok(id > 0)

    const json = await requisicao('GET', `/api/admin/relatorios/${id}/download?formato=json`)
    assert.equal(json.status, 200)
    assert.ok(Array.isArray(json.dados.dados))

    const csv = await requisicao('GET', `/api/admin/relatorios/${id}/download?formato=csv`)
    assert.equal(csv.status, 200)
    assert.match(csv.dados, /Rota/)

    const pdf = await requisicao('GET', `/api/admin/relatorios/${id}/download?formato=pdf`)
    assert.equal(pdf.status, 200)
    assert.equal(pdf.buffer.slice(0, 5).toString(), '%PDF-')
    assert.match(pdf.buffer.toString('latin1'), /%%EOF/)
  })

  it('retorna KPIs e ranking com os acessos registrados', async () => {
    const resposta = await requisicao('GET', '/api/admin/dashboard?periodo=30')
    assert.equal(resposta.status, 200)
    assert.ok(resposta.dados.dados.kpis.total > 0)
    assert.ok(resposta.dados.dados.ranking.some(item => item.rota === '/'))
    assert.ok(Array.isArray(resposta.dados.dados.serie))
  })

  it('registra a abertura do painel administrativo integrado', async () => {
    const resposta = await requisicao('POST', '/api/admin/evento', { evento: 'painel' }, {
      headers: { 'X-CSRF-Token': csrf }
    })
    assert.equal(resposta.status, 202)
    assert.equal(resposta.dados.sucesso, true)

    const banco = require('../configuracoes/conexaoBanco')
    const acesso = banco.prepare("SELECT * FROM acessos WHERE rota = '/admin/painel-integrado' ORDER BY id DESC LIMIT 1").get()
    assert.ok(acesso)
    assert.equal(acesso.area, 'admin')
    assert.equal(acesso.status, 202)
    assert.match(acesso.ip_hash, /^[a-f0-9]{20}$/)
    assert.ok(acesso.criado_em)
  })

  it('encerra a sessão e invalida o cookie', async () => {
    const resposta = await requisicao('POST', '/api/admin/logout', null, {
      headers: { 'X-CSRF-Token': csrf }
    })
    assert.equal(resposta.status, 200)
    mesclarCookies(resposta.headers['set-cookie'])
    const verifica = await requisicao('GET', '/api/admin/session')
    assert.equal(verifica.status, 401)
  })
})
