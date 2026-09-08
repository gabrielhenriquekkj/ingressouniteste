const banco = require('../configuracoes/conexaoBanco')

function removerAcentos(str) {
  const mapa = { 'À':'A','Á':'A','Â':'A','Ã':'A','Ä':'A','Å':'A','Æ':'AE','Ç':'C','È':'E','É':'E','Ê':'E','Ë':'E','Ì':'I','Í':'I','Î':'I','Ï':'I','Ð':'D','Ñ':'N','Ò':'O','Ó':'O','Ô':'O','Õ':'O','Ö':'O','Ø':'O','Ù':'U','Ú':'U','Û':'U','Ü':'U','Ý':'Y','Þ':'TH','ß':'ss','à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a','æ':'ae','ç':'c','è':'e','é':'e','ê':'e','ë':'e','ì':'i','í':'i','î':'i','ï':'i','ð':'d','ñ':'n','ò':'o','ó':'o','ô':'o','õ':'o','ö':'o','ø':'o','ù':'u','ú':'u','û':'u','ü':'u','ý':'y','þ':'th','ÿ':'y' }
  return str.split('').map(c => mapa[c] || c).join('')
}

function sugestoes(termo, limite) {
  if (!termo || termo.length < 2) return []

  const termoUpper = removerAcentos(termo).toUpperCase()
  const termoLike = `%${termoUpper}%`
  const termoInicio = `${termoUpper}%`
  const resultados = []

  const cursos = banco.prepare(`
    SELECT c.id, c.nome AS texto, c.grau, i.nome AS instituicao, i.sigla,
           'curso' AS tipo
    FROM cursos c
    JOIN instituicoes i ON c.instituicao_id = i.id
    WHERE c.ativo = 1 AND i.ativo = 1
      AND (c.nome_normalizado LIKE ? OR i.nome_normalizado LIKE ? OR UPPER(i.sigla) LIKE ?)
    ORDER BY
      CASE WHEN c.nome_normalizado LIKE ? THEN 0 ELSE 1 END,
      c.nome
    LIMIT ?
  `).all(termoLike, termoLike, termoLike, termoInicio, limite)

  const instituicoes = banco.prepare(`
    SELECT id, nome AS texto, sigla, estado,
           'instituicao' AS tipo
    FROM instituicoes
    WHERE ativo = 1
      AND (nome_normalizado LIKE ? OR UPPER(sigla) LIKE ?)
    ORDER BY
      CASE WHEN nome_normalizado LIKE ? THEN 0 ELSE 1 END,
      nome
    LIMIT ?
  `).all(termoLike, termoLike, termoInicio, limite)

  for (const c of cursos) {
    resultados.push({
      id: c.id,
      texto: c.texto,
      subtitulo: (c.sigla || c.instituicao) + (c.grau ? ' \u2022 ' + c.grau : ''),
      tipo: c.tipo
    })
  }
  for (const i of instituicoes) {
    resultados.push({
      id: i.id,
      texto: i.texto,
      subtitulo: (i.sigla ? i.sigla + ' \u2022 ' : '') + (i.estado || ''),
      tipo: i.tipo
    })
  }

  return resultados.slice(0, limite)
}

module.exports = { sugestoes }
