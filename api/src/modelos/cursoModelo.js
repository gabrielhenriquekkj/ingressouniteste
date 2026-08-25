const banco = require('../configuracoes/conexaoBanco')

function buscarPorFiltros({ nome, cidade, estado }) {
  let sql = `
    SELECT c.*, i.nome AS instituicao_nome, i.sigla, i.cidade, i.estado,
           me.demanda
    FROM cursos c
    JOIN instituicoes i ON c.instituicao_id = i.id
    LEFT JOIN mercado_estagios me ON me.curso_id = c.id
    WHERE 1=1
  `
  const parametros = []

  if (nome) {
    sql += ' AND (c.nome LIKE ? OR i.nome LIKE ? OR i.sigla LIKE ?)'
    parametros.push(`%${nome}%`, `%${nome}%`, `%${nome}%`)
  }
  if (cidade) {
    sql += ' AND i.cidade LIKE ?'
    parametros.push(`%${cidade}%`)
  }
  if (estado) {
    sql += ' AND UPPER(i.estado) = UPPER(?)'
    parametros.push(estado)
  }

  sql += ' ORDER BY c.nome'
  return banco.prepare(sql).all(...parametros)
}

function detalhar(id) {
  return banco.prepare(`
    SELECT c.*, i.nome AS instituicao_nome, i.sigla, i.cidade, i.estado, i.site
    FROM cursos c
    JOIN instituicoes i ON c.instituicao_id = i.id
    WHERE c.id = ?
  `).get(id)
}

function existe(id) {
  return !!banco.prepare('SELECT id FROM cursos WHERE id = ?').get(id)
}

function buscarInstituicaoId(cursoId) {
  const curso = banco.prepare('SELECT instituicao_id FROM cursos WHERE id = ?').get(cursoId)
  return curso ? curso.instituicao_id : null
}

module.exports = { buscarPorFiltros, detalhar, existe, buscarInstituicaoId }
