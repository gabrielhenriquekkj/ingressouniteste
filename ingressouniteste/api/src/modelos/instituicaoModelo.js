const banco = require('../configuracoes/conexaoBanco')

function removerAcentos(str) {
  const mapa = { 'À':'A','Á':'A','Â':'A','Ã':'A','Ä':'A','Å':'A','Æ':'AE','Ç':'C','È':'E','É':'E','Ê':'E','Ë':'E','Ì':'I','Í':'I','Î':'I','Ï':'I','Ð':'D','Ñ':'N','Ò':'O','Ó':'O','Ô':'O','Õ':'O','Ö':'O','Ø':'O','Ù':'U','Ú':'U','Û':'U','Ü':'U','Ý':'Y','Þ':'TH','ß':'ss','à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a','æ':'ae','ç':'c','è':'e','é':'e','ê':'e','ë':'e','ì':'i','í':'i','î':'i','ï':'i','ð':'d','ñ':'n','ò':'o','ó':'o','ô':'o','õ':'o','ö':'o','ø':'o','ù':'u','ú':'u','û':'u','ü':'u','ý':'y','þ':'th','ÿ':'y' }
  return str.split('').map(c => mapa[c] || c).join('')
}

function buscarPorFiltros({ nome, cidade, estado, uf, categoria, tipo, campus_id, page = 1, limit = 20 }) {
  let sql = 'SELECT * FROM instituicoes WHERE ativo = 1'
  const parametros = []

  if (nome) {
    sql += ' AND (nome_normalizado LIKE ? OR UPPER(sigla) LIKE ?)'
    const termo = `%${removerAcentos(nome).toUpperCase()}%`
    parametros.push(termo, termo)
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
  const normalizar = (s) => (s || '').toUpperCase().replace(/[ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß]/g, c => ({'À':'A','Á':'A','Â':'A','Ã':'A','Ä':'A','Å':'A','Æ':'AE','Ç':'C','È':'E','É':'E','Ê':'E','Ë':'E','Ì':'I','Í':'I','Î':'I','Ï':'I','Ð':'D','Ñ':'N','Ò':'O','Ó':'O','Ô':'O','Õ':'O','Ö':'O','Ø':'O','Ù':'U','Ú':'U','Û':'U','Ü':'U','Ý':'Y','Þ':'TH','ß':'ss'}[c] || c))
  const nomeNorm = normalizar(dados.nome)

  const existente = dados.codigo_ies
    ? banco.prepare('SELECT id FROM instituicoes WHERE codigo_ies = ?').get(dados.codigo_ies)
    : banco.prepare('SELECT id FROM instituicoes WHERE nome = ? AND UPPER(estado) = UPPER(?)').get(dados.nome, dados.estado || '')

  if (existente) {
    banco.prepare(`
      UPDATE instituicoes SET
        nome = COALESCE(?, nome),
        nome_normalizado = COALESCE(?, nome_normalizado),
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
      dados.nome, nomeNorm, dados.sigla, dados.cidade, dados.estado,
      dados.site, dados.categoria_administrativa, dados.tipo_instituicao,
      dados.fonte_url, dados.coletado_em, existente.id
    )
    return { id: existente.id, acao: 'atualizado' }
  }

  const resultado = banco.prepare(`
    INSERT INTO instituicoes (nome, nome_normalizado, sigla, cidade, estado, site, categoria_administrativa, tipo_instituicao, codigo_ies, fonte_url, coletado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dados.nome, nomeNorm, dados.sigla, dados.cidade, dados.estado, dados.site,
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
