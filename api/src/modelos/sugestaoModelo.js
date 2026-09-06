const banco = require('../configuracoes/conexaoBanco')

function sugestoes(termo, limite) {
  if (!termo || termo.length < 2) return []

  const termoLike = `%${termo}%`
  const resultados = []

  const cursos = banco.prepare(`
    SELECT c.id, c.nome AS texto, c.grau, i.nome AS instituicao, i.sigla,
           'curso' AS tipo
    FROM cursos c
    JOIN instituicoes i ON c.instituicao_id = i.id
    WHERE c.ativo = 1 AND i.ativo = 1
      AND (c.nome LIKE ? OR i.nome LIKE ? OR i.sigla LIKE ?)
    ORDER BY
      CASE WHEN c.nome LIKE ? THEN 0 ELSE 1 END,
      c.nome
    LIMIT ?
  `).all(termoLike, termoLike, termoLike, `${termo}%`, limite)

  const instituicoes = banco.prepare(`
    SELECT id, nome AS texto, sigla, estado,
           'instituicao' AS tipo
    FROM instituicoes
    WHERE ativo = 1
      AND (nome LIKE ? OR sigla LIKE ?)
    ORDER BY
      CASE WHEN nome LIKE ? THEN 0 ELSE 1 END,
      nome
    LIMIT ?
  `).all(termoLike, termoLike, `${termo}%`, limite)

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
