const banco = require('../configuracoes/conexaoBanco')

function buscarPorCurso(cursoId) {
  return banco.prepare(
    'SELECT * FROM notas_corte WHERE curso_id = ? ORDER BY ano DESC, chamada'
  ).all(cursoId)
}

function buscarPorInstituicao(instituicaoId) {
  return banco.prepare(`
    SELECT nc.*, c.nome AS curso_nome
    FROM notas_corte nc
    JOIN cursos c ON nc.curso_id = c.id
    WHERE c.instituicao_id = ?
    ORDER BY nc.ano DESC, nc.chamada
  `).all(instituicaoId)
}

function inserirOuAtualizar(dados) {
  const existente = banco.prepare(
    'SELECT id FROM notas_corte WHERE curso_id = ? AND modalidade_acesso = ? AND ano = ? AND chamada = ?'
  ).get(dados.curso_id, dados.modalidade_acesso, dados.ano, dados.chamada)

  if (existente) {
    banco.prepare(`
      UPDATE notas_corte SET
        nota_corte = COALESCE(?, nota_corte),
        nota_minima = COALESCE(?, nota_minima),
        processo = COALESCE(?, processo),
        turno = COALESCE(?, turno),
        fonte_url = COALESCE(?, fonte_url),
        coletado_em = COALESCE(?, coletado_em),
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(dados.nota_corte, dados.nota_minima, dados.processo, dados.turno, dados.fonte_url, dados.coletado_em, existente.id)
    return { id: existente.id, acao: 'atualizado' }
  }

  const resultado = banco.prepare(`
    INSERT INTO notas_corte (curso_id, modalidade_acesso, processo, ano, chamada, nota_corte, nota_minima, turno, fonte_url, coletado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dados.curso_id, dados.modalidade_acesso, dados.processo,
    dados.ano, dados.chamada, dados.nota_corte, dados.nota_minima,
    dados.turno, dados.fonte_url, dados.coletado_em
  )
  return { id: resultado.lastInsertRowid, acao: 'inserido' }
}

function existeHistorico(cursoId, ano) {
  return banco.prepare(
    'SELECT COUNT(*) AS total FROM notas_corte WHERE curso_id = ? AND ano = ?'
  ).get(cursoId, ano).total > 0
}

module.exports = { buscarPorCurso, buscarPorInstituicao, inserirOuAtualizar, existeHistorico }
