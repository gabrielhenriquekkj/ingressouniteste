const banco = require('../configuracoes/conexaoBanco')

function removerAcentos(str) {
  const mapa = { 'À':'A','Á':'A','Â':'A','Ã':'A','Ä':'A','Å':'A','Æ':'AE','Ç':'C','È':'E','É':'E','Ê':'E','Ë':'E','Ì':'I','Í':'I','Î':'I','Ï':'I','Ð':'D','Ñ':'N','Ò':'O','Ó':'O','Ô':'O','Õ':'O','Ö':'O','Ø':'O','Ù':'U','Ú':'U','Û':'U','Ü':'U','Ý':'Y','Þ':'TH','ß':'ss','à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a','æ':'ae','ç':'c','è':'e','é':'e','ê':'e','ë':'e','ì':'i','í':'i','î':'i','ï':'i','ð':'d','ñ':'n','ò':'o','ó':'o','ô':'o','õ':'o','ö':'o','ø':'o','ù':'u','ú':'u','û':'u','ü':'u','ý':'y','þ':'th','ÿ':'y' }
  return str.split('').map(c => mapa[c] || c).join('')
}

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
    sql += ' AND (c.nome_normalizado LIKE ? OR i.nome_normalizado LIKE ? OR UPPER(i.sigla) LIKE ?)'
    const termo = `%${removerAcentos(nome).toUpperCase()}%`
    parametros.push(termo, termo, termo)
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
  const normalizar = (s) => (s || '').toUpperCase().replace(/[ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß]/g, c => ({'À':'A','Á':'A','Â':'A','Ã':'A','Ä':'A','Å':'A','Æ':'AE','Ç':'C','È':'E','É':'E','Ê':'E','Ë':'E','Ì':'I','Í':'I','Î':'I','Ï':'I','Ð':'D','Ñ':'N','Ò':'O','Ó':'O','Ô':'O','Õ':'O','Ö':'O','Ø':'O','Ù':'U','Ú':'U','Û':'U','Ü':'U','Ý':'Y','Þ':'TH','ß':'ss'}[c] || c))
  const nomeNorm = normalizar(dados.nome)

  const existente = dados.codigo_curso
    ? banco.prepare('SELECT id FROM cursos WHERE codigo_curso = ? AND instituicao_id = ?').get(dados.codigo_curso, dados.instituicao_id)
    : banco.prepare('SELECT id FROM cursos WHERE nome = ? AND instituicao_id = ? AND COALESCE(campus_id, 0) = COALESCE(?, 0)').get(dados.nome, dados.instituicao_id, dados.campus_id || null)

  if (existente) {
    banco.prepare(`
      UPDATE cursos SET
        campus_id = COALESCE(?, campus_id),
        nome = COALESCE(?, nome),
        nome_normalizado = COALESCE(?, nome_normalizado),
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
      dados.campus_id, dados.nome, nomeNorm, dados.grau, dados.modalidade,
      dados.turno, dados.duracao_semestres, dados.cidade, dados.uf,
      dados.fonte_url, dados.coletado_em, existente.id
    )
    return { id: existente.id, acao: 'atualizado' }
  }

  const resultado = banco.prepare(`
    INSERT INTO cursos (instituicao_id, campus_id, codigo_curso, nome, nome_normalizado, grau, modalidade, turno, duracao_semestres, codigo_municipio_ibge, cidade, uf, fonte_url, coletado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dados.instituicao_id, dados.campus_id || null, dados.codigo_curso,
    dados.nome, nomeNorm, dados.grau, dados.modalidade, dados.turno,
    dados.duracao_semestres, dados.codigo_municipio_ibge,
    dados.cidade, dados.uf, dados.fonte_url, dados.coletado_em
  )
  return { id: resultado.lastInsertRowid, acao: 'inserido' }
}

module.exports = { buscarPorFiltros, detalhar, existe, buscarInstituicaoId, inserirOuAtualizar }
