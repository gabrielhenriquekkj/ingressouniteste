const banco = require('../configuracoes/conexaoBanco')

function buscarPorFiltros({ nome, cidade, estado, uf, categoria, tipo, campus_id, page = 1, limit = 20 }) {
  let sql = 'SELECT * FROM instituicoes WHERE ativo = 1'
  const parametros = []

  if (nome) {
    sql += ' AND (nome LIKE ? OR sigla LIKE ?)'
    parametros.push(`%${nome}%`, `%${nome}%`)
  }
  if (cidade) {
    sql += ' AND cidade LIKE ?'
    parametros.push(`%${cidade}%`)
  }
  if (estado || uf) {
    sql += ' AND UPPER(estado) = UPPER(?)'
    parametros.push(estado || uf)
  }
  if (categoria) {
    sql += ' AND LOWER(categoria_administrativa) = LOWER(?)'
    parametros.push(categoria)
  }
  if (tipo) {
    sql += ' AND LOWER(tipo_instituicao) = LOWER(?)'
    parametros.push(tipo)
  }

  // Contagem total para paginacao
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) AS total')
  const { total } = banco.prepare(countSql).get(...parametros)

  sql += ' ORDER BY nome'
  const offset = (Math.max(1, page) - 1) * limit
  sql += ` LIMIT ? OFFSET ?`
  parametros.push(Math.min(limit, 100), offset)

  const dados = banco.prepare(sql).all(...parametros)
  return { dados, total, page: Math.max(1, page), limit: Math.min(limit, 100) }
}

function detalhar(id) {
  return banco.prepare('SELECT * FROM instituicoes WHERE id = ? AND ativo = 1').get(id)
}

function buscarCursos(instituicaoId) {
  return banco.prepare('SELECT * FROM cursos WHERE instituicao_id = ? AND ativo = 1 ORDER BY nome').all(instituicaoId)
}

function buscarCampi(instituicaoId) {
  return banco.prepare('SELECT * FROM campi WHERE instituicao_id = ? AND ativo = 1 ORDER BY nome').all(instituicaoId)
}

function buscarAuxilios(instituicaoId) {
  return banco.prepare('SELECT * FROM auxilios_bolsas WHERE instituicao_id = ? ORDER BY nome').all(instituicaoId)
}

function inserirOuAtualizar(dados) {
  const existente = dados.codigo_ies
    ? banco.prepare('SELECT id FROM instituicoes WHERE codigo_ies = ?').get(dados.codigo_ies)
    : banco.prepare('SELECT id FROM instituicoes WHERE nome = ? AND UPPER(estado) = UPPER(?)').get(dados.nome, dados.estado || '')

  if (existente) {
    banco.prepare(`
      UPDATE instituicoes SET
        nome = COALESCE(?, nome),
        sigla = COALESCE(?, sigla),
        cidade = COALESCE(?, cidade),
        estado = COALESCE(?, estado),
        site = COALESCE(?, site),
        categoria_administrativa = COALESCE(?, categoria_administrativa),
        tipo_instituicao = COALESCE(?, tipo_instituicao),
        fonte_url = COALESCE(?, fonte_url),
        coletado_em = COALESCE(?, coletado_em),
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(
      dados.nome, dados.sigla, dados.cidade, dados.estado,
      dados.site, dados.categoria_administrativa, dados.tipo_instituicao,
      dados.fonte_url, dados.coletado_em, existente.id
    )
    return { id: existente.id, acao: 'atualizado' }
  }

  const resultado = banco.prepare(`
    INSERT INTO instituicoes (nome, sigla, cidade, estado, site, categoria_administrativa, tipo_instituicao, codigo_ies, fonte_url, coletado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dados.nome, dados.sigla, dados.cidade, dados.estado, dados.site,
    dados.categoria_administrativa, dados.tipo_instituicao,
    dados.codigo_ies, dados.fonte_url, dados.coletado_em
  )
  return { id: resultado.lastInsertRowid, acao: 'inserido' }
}

function buscarPorNomeOuSigla(nome, sigla) {
  if (sigla) {
    const resultado = banco.prepare('SELECT * FROM instituicoes WHERE UPPER(sigla) = UPPER(?)').get(sigla)
    if (resultado) return resultado
  }
  return banco.prepare('SELECT * FROM instituicoes WHERE nome = ?').get(nome)
}

function contarPorCategoria() {
  return banco.prepare(`
    SELECT categoria_administrativa, COUNT(*) AS total
    FROM instituicoes WHERE ativo = 1
    GROUP BY categoria_administrativa
  `).all()
}

module.exports = {
  buscarPorFiltros, detalhar, buscarCursos, buscarCampi, buscarAuxilios,
  inserirOuAtualizar, buscarPorNomeOuSigla, contarPorCategoria
}
