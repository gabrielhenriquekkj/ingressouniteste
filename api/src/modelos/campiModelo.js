const banco = require('../configuracoes/conexaoBanco')

function buscarPorInstituicao(instituicaoId) {
  return banco.prepare(
    'SELECT * FROM campi WHERE instituicao_id = ? AND ativo = 1 ORDER BY nome'
  ).all(instituicaoId)
}

function detalhar(id) {
  return banco.prepare('SELECT * FROM campi WHERE id = ?').get(id)
}

function inserirOuAtualizar(dados) {
  const existente = dados.codigo_campus
    ? banco.prepare('SELECT id FROM campi WHERE codigo_campus = ?').get(dados.codigo_campus)
    : banco.prepare('SELECT id FROM campi WHERE instituicao_id = ? AND nome = ?').get(dados.instituicao_id, dados.nome)

  if (existente) {
    banco.prepare(`
      UPDATE campi SET
        nome = COALESCE(?, nome),
        codigo_municipio_ibge = COALESCE(?, codigo_municipio_ibge),
        cidade = COALESCE(?, cidade),
        uf = COALESCE(?, uf),
        endereco = COALESCE(?, endereco),
        site_oficial = COALESCE(?, site_oficial),
        fonte_url = COALESCE(?, fonte_url),
        coletado_em = COALESCE(?, coletado_em),
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(dados.nome, dados.codigo_municipio_ibge, dados.cidade, dados.uf, dados.endereco, dados.site_oficial, dados.fonte_url, dados.coletado_em, existente.id)
    return { id: existente.id, acao: 'atualizado' }
  }

  const resultado = banco.prepare(`
    INSERT INTO campi (instituicao_id, nome, codigo_campus, codigo_municipio_ibge, cidade, uf, endereco, site_oficial, fonte_url, coletado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dados.instituicao_id, dados.nome, dados.codigo_campus,
    dados.codigo_municipio_ibge, dados.cidade, dados.uf,
    dados.endereco, dados.site_oficial, dados.fonte_url, dados.coletado_em
  )
  return { id: resultado.lastInsertRowid, acao: 'inserido' }
}

function contarPorInstituicao(instituicaoId) {
  return banco.prepare(
    'SELECT COUNT(*) AS total FROM campi WHERE instituicao_id = ? AND ativo = 1'
  ).get(instituicaoId).total
}

module.exports = { buscarPorInstituicao, detalhar, inserirOuAtualizar, contarPorInstituicao }
