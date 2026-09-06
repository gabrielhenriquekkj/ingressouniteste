const banco = require('../configuracoes/conexaoBanco')

function buscarPorFiltros({ nome, cidade, estado, uf, instituicao_id, campus_id, modalidade, turno, processo, page = 1, limit = 20 }) {
  let sql = `
    SELECT c.*, i.nome AS instituicao_nome, i.sigla, i.categoria_administrativa,
           ca.nome AS campus_nome,
           me.demanda
    FROM cursos c
    JOIN instituicoes i ON c.instituicao_id = i.id
    LEFT JOIN campi ca ON c.campus_id = ca.id
    LEFT JOIN mercado_estagios me ON me.curso_id = c.id
    WHERE c.ativo = 1 AND i.ativo = 1
  `
  const parametros = []

  if (nome) {
    sql += ' AND (c.nome LIKE ? OR i.nome LIKE ? OR i.sigla LIKE ?)'
    parametros.push(`%${nome}%`, `%${nome}%`, `%${nome}%`)
  }
  if (cidade) {
    sql += ' AND c.cidade LIKE ?'
    parametros.push(`%${cidade}%`)
  }
  if (estado || uf) {
    sql += ' AND UPPER(c.uf) = UPPER(?)'
    parametros.push(estado || uf)
  }
  if (instituicao_id) {
    sql += ' AND c.instituicao_id = ?'
    parametros.push(instituicao_id)
  }
  if (campus_id) {
    sql += ' AND c.campus_id = ?'
    parametros.push(campus_id)
  }
  if (modalidade) {
    sql += ' AND LOWER(c.modalidade) = LOWER(?)'
    parametros.push(modalidade)
  }
  if (turno) {
    sql += ' AND LOWER(c.turno) = LOWER(?)'
    parametros.push(turno)
  }

  const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) AS total FROM')
  const { total } = banco.prepare(countSql).get(...parametros)

  sql += ' ORDER BY c.nome'
  const offset = (Math.max(1, page) - 1) * limit
  sql += ` LIMIT ? OFFSET ?`
  parametros.push(Math.min(limit, 100), offset)

  const dados = banco.prepare(sql).all(...parametros)
  return { dados, total, page: Math.max(1, page), limit: Math.min(limit, 100) }
}

function detalhar(id) {
  return banco.prepare(`
    SELECT c.*, i.nome AS instituicao_nome, i.sigla, i.cidade AS instituicao_cidade,
           i.estado AS instituicao_estado, i.site, i.categoria_administrativa, i.tipo_instituicao,
           ca.nome AS campus_nome, ca.cidade AS campus_cidade, ca.uf AS campus_uf,
           ca.endereco AS campus_endereco, ca.site_oficial AS campus_site
    FROM cursos c
    JOIN instituicoes i ON c.instituicao_id = i.id
    LEFT JOIN campi ca ON c.campus_id = ca.id
    WHERE c.id = ? AND c.ativo = 1
  `).get(id)
}

function existe(id) {
  return !!banco.prepare('SELECT id FROM cursos WHERE id = ? AND ativo = 1').get(id)
}

function buscarInstituicaoId(cursoId) {
  const curso = banco.prepare('SELECT instituicao_id FROM cursos WHERE id = ?').get(cursoId)
  return curso ? curso.instituicao_id : null
}

function inserirOuAtualizar(dados) {
  const existente = dados.codigo_curso
    ? banco.prepare('SELECT id FROM cursos WHERE codigo_curso = ? AND instituicao_id = ?').get(dados.codigo_curso, dados.instituicao_id)
    : banco.prepare('SELECT id FROM cursos WHERE nome = ? AND instituicao_id = ? AND COALESCE(campus_id, 0) = COALESCE(?, 0)').get(dados.nome, dados.instituicao_id, dados.campus_id || null)

  if (existente) {
    banco.prepare(`
      UPDATE cursos SET
        campus_id = COALESCE(?, campus_id),
        nome = COALESCE(?, nome),
        grau = COALESCE(?, grau),
        modalidade = COALESCE(?, modalidade),
        turno = COALESCE(?, turno),
        duracao_semestres = COALESCE(?, duracao_semestres),
        cidade = COALESCE(?, cidade),
        uf = COALESCE(?, uf),
        fonte_url = COALESCE(?, fonte_url),
        coletado_em = COALESCE(?, coletado_em),
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(
      dados.campus_id, dados.nome, dados.grau, dados.modalidade,
      dados.turno, dados.duracao_semestres, dados.cidade, dados.uf,
      dados.fonte_url, dados.coletado_em, existente.id
    )
    return { id: existente.id, acao: 'atualizado' }
  }

  const resultado = banco.prepare(`
    INSERT INTO cursos (instituicao_id, campus_id, codigo_curso, nome, grau, modalidade, turno, duracao_semestres, codigo_municipio_ibge, cidade, uf, fonte_url, coletado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dados.instituicao_id, dados.campus_id || null, dados.codigo_curso,
    dados.nome, dados.grau, dados.modalidade, dados.turno,
    dados.duracao_semestres, dados.codigo_municipio_ibge,
    dados.cidade, dados.uf, dados.fonte_url, dados.coletado_em
  )
  return { id: resultado.lastInsertRowid, acao: 'inserido' }
}

module.exports = { buscarPorFiltros, detalhar, existe, buscarInstituicaoId, inserirOuAtualizar }
