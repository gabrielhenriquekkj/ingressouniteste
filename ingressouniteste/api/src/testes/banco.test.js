const { describe, it, before } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

process.env.NODE_ENV = 'test'
process.env.TEST_DB = path.resolve(__dirname, '../../db/test_ingresso.db')

for (const key of Object.keys(require.cache)) {
  if (key.includes('conexaoBanco') || key.includes('iniciarBanco')) {
    delete require.cache[key]
  }
}

const banco = require('../configuracoes/conexaoBanco')
require('../../iniciarBanco')

describe('Banco de Dados', () => {
  before(() => {
    banco.exec('DELETE FROM favoritos')
    banco.exec('DELETE FROM mercado_estagios')
    banco.exec('DELETE FROM auxilios_bolsas')
    banco.exec('DELETE FROM notas_corte')
    banco.exec('DELETE FROM custos_cidade')
    banco.exec('DELETE FROM cursos')
    banco.exec('DELETE FROM campi')
    banco.exec('DELETE FROM instituicoes')
    banco.exec('DELETE FROM execucoes_mineracao')
    banco.exec('DELETE FROM instituicoes_aliases')

    // Recriar seed minimo
    banco.prepare(
      'INSERT INTO instituicoes (nome, sigla, cidade, estado, categoria_administrativa, tipo_instituicao) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('Universidade Federal de Teste', 'UFT', 'Cidade Teste', 'MT', 'federal', 'universidade')
  })

  it('deve inserir uma instituição pública federal', () => {
    const inst = banco.prepare('SELECT * FROM instituicoes WHERE sigla = ?').get('UFT')
    assert.ok(inst)
    assert.equal(inst.categoria_administrativa, 'federal')
    assert.equal(inst.ativo, 1)
  })

  it('deve inserir um campus vinculado a instituição', () => {
    const inst = banco.prepare('SELECT id FROM instituicoes WHERE sigla = ?').get('UFT')
    const resultado = banco.prepare(
      'INSERT INTO campi (instituicao_id, nome, cidade, uf) VALUES (?, ?, ?, ?)'
    ).run(inst.id, 'Campus Central', 'Cidade Teste', 'MT')

    assert.ok(resultado.lastInsertRowid > 0)
    const campus = banco.prepare('SELECT * FROM campi WHERE id = ?').get(resultado.lastInsertRowid)
    assert.equal(campus.instituicao_id, inst.id)
  })

  it('deve inserir um curso vinculado a instituição e campus', () => {
    const inst = banco.prepare('SELECT id FROM instituicoes WHERE sigla = ?').get('UFT')
    const campus = banco.prepare('SELECT id FROM campi WHERE instituicao_id = ?').get(inst.id)

    const resultado = banco.prepare(
      'INSERT INTO cursos (instituicao_id, campus_id, nome, grau, modalidade, uf) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(inst.id, campus.id, 'Ciencia da Computacao', 'Bacharelado', 'Presencial', 'MT')

    assert.ok(resultado.lastInsertRowid > 0)
    const curso = banco.prepare('SELECT * FROM cursos WHERE id = ?').get(resultado.lastInsertRowid)
    assert.equal(curso.campus_id, campus.id)
  })

  it('deve inserir nota de corte com processo identificado', () => {
    const curso = banco.prepare('SELECT id FROM cursos WHERE nome = ?').get('Ciencia da Computacao')
    const resultado = banco.prepare(
      'INSERT INTO notas_corte (curso_id, processo, ano, chamada, nota_corte) VALUES (?, ?, ?, ?, ?)'
    ).run(curso.id, 'sisu', 2025, 1, 780.5)

    assert.ok(resultado.lastInsertRowid > 0)
    const nota = banco.prepare('SELECT * FROM notas_corte WHERE id = ?').get(resultado.lastInsertRowid)
    assert.equal(nota.processo, 'sisu')
    assert.equal(nota.nota_corte, 780.5)
  })

  it('deve inserir custo de vida com codigo IBGE', () => {
    const resultado = banco.prepare(
      'INSERT INTO custos_cidade (codigo_municipio_ibge, cidade, uf, moradia, alimentacao, custo_total, mes_referencia) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('5103403', 'Cidade Teste', 'MT', 800, 600, 1600, '2026-01')

    assert.ok(resultado.lastInsertRowid > 0)
  })

  it('deve registrar execucao de mineracao', () => {
    const resultado = banco.prepare(
      "INSERT INTO execucoes_mineracao (tipo, inicio) VALUES (?, datetime('now','localtime'))"
    ).run('catalogo')

    assert.ok(resultado.lastInsertRowid > 0)
    const exec = banco.prepare('SELECT * FROM execucoes_mineracao WHERE id = ?').get(resultado.lastInsertRowid)
    assert.equal(exec.tipo, 'catalogo')
    assert.equal(exec.status, 'em_andamento')
  })

  it('deve preservar historico de notas', () => {
    const curso = banco.prepare('SELECT id FROM cursos WHERE nome = ?').get('Ciencia da Computacao')
    banco.prepare(
      'INSERT INTO notas_corte (curso_id, processo, ano, chamada, nota_corte) VALUES (?, ?, ?, ?, ?)'
    ).run(curso.id, 'sisu', 2024, 1, 750.0)

    const notas = banco.prepare('SELECT * FROM notas_corte WHERE curso_id = ? ORDER BY ano').all(curso.id)
    assert.ok(notas.length >= 2)
    assert.equal(notas[0].ano, 2024)
  })

  it('deve filtrar apenas instituições públicas na busca', () => {
    const publicas = banco.prepare(
      "SELECT * FROM instituicoes WHERE categoria_administrativa IN ('federal', 'estadual', 'municipal') AND ativo = 1"
    ).all()

    for (const inst of publicas) {
      assert.ok(
        ['federal', 'estadual', 'municipal'].includes(inst.categoria_administrativa)
      )
    }
  })
})
