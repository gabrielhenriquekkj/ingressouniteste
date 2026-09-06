const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const http = require('http')
const path = require('path')

process.env.NODE_ENV = 'test'
process.env.TEST_DB = path.resolve(__dirname, '../../db/test_ingresso.db')
process.env.PORT = '0'

for (const key of Object.keys(require.cache)) {
  if (key.includes('conexaoBanco') || key.includes('iniciarBanco')) {
    delete require.cache[key]
  }
}

const app = require('../app')

let servidor
let porta

before(async () => {
  require('../../iniciarBanco')
  return new Promise((resolve) => {
    servidor = app.listen(0, () => {
      porta = servidor.address().port
      resolve()
    })
  })
})

after(() => {
  if (servidor) servidor.close()
})

function requisicao(metodo, caminho) {
  return new Promise((resolve, reject) => {
    const options = { hostname: 'localhost', port: porta, path: '/api' + caminho, method: metodo }
    const req = http.request(options, (res) => {
      let dados = ''
      res.on('data', chunk => dados += chunk)
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, dados: JSON.parse(dados) })
        } catch (e) {
          resolve({ status: res.statusCode, dados })
        }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

describe('API Endpoints', () => {
  it('GET /api/health deve retornar sucesso', async () => {
    const { status, dados } = await requisicao('GET', '/health')
    assert.equal(status, 200)
    assert.equal(dados.sucesso, true)
  })

  it('GET /api/instituicoes deve retornar lista com paginacao', async () => {
    const { status, dados } = await requisicao('GET', '/instituicoes')
    assert.equal(status, 200)
    assert.equal(dados.sucesso, true)
    assert.ok(Array.isArray(dados.dados))
    assert.ok(dados.paginacao)
    assert.ok(dados.paginacao.total >= 0)
  })

  it('GET /api/instituicoes?uf=MT deve filtrar por UF', async () => {
    const { status, dados } = await requisicao('GET', '/instituicoes?uf=MT')
    assert.equal(status, 200)
    assert.equal(dados.sucesso, true)
    for (const inst of dados.dados) {
      assert.equal(inst.estado, 'MT')
    }
  })

  it('GET /api/instituicoes?categoria=federal deve filtrar por categoria', async () => {
    const { status, dados } = await requisicao('GET', '/instituicoes?categoria=federal')
    assert.equal(status, 200)
    for (const inst of dados.dados) {
      assert.equal(inst.categoria_administrativa, 'federal')
    }
  })

  it('GET /api/cursos deve retornar lista com paginacao', async () => {
    const { status, dados } = await requisicao('GET', '/cursos')
    assert.equal(status, 200)
    assert.equal(dados.sucesso, true)
    assert.ok(Array.isArray(dados.dados))
    assert.ok(dados.paginacao)
  })

  it('GET /api/cursos?uf=MT deve filtrar por UF', async () => {
    const { status, dados } = await requisicao('GET', '/cursos?uf=MT')
    assert.equal(status, 200)
    for (const curso of dados.dados) {
      assert.equal(curso.uf, 'MT')
    }
  })

  it('GET /api/cursos com paginação não deve retornar duplicatas entre páginas', async () => {
    const page1 = await requisicao('GET', '/cursos?page=1&limit=2')
    const page2 = await requisicao('GET', '/cursos?page=2&limit=2')

    const ids1 = page1.dados.dados.map(c => c.id)
    const ids2 = page2.dados.dados.map(c => c.id)
    const intersecao = ids1.filter(id => ids2.includes(id))
    assert.equal(intersecao.length, 0, 'Não deve haver IDs duplicados entre páginas')
  })

  it('GET /api/busca deve retornar instituicoes e cursos', async () => {
    const { status, dados } = await requisicao('GET', '/busca?nome=Computacao')
    assert.equal(status, 200)
    assert.ok(dados.dados.instituicoes !== undefined)
    assert.ok(dados.dados.cursos !== undefined)
  })

  it('GET /api/campi deve exigir instituicao_id', async () => {
    const { status } = await requisicao('GET', '/campi')
    assert.equal(status, 400)
  })

  it('GET /api/cidades/cidade-inexistente/custos deve retornar array vazio', async () => {
    const { status, dados } = await requisicao('GET', '/cidades/CidadeInexistente/custos')
    assert.equal(status, 200)
    assert.ok(Array.isArray(dados.dados))
  })
})
