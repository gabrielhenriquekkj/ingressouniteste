const banco = require('../config/conexaoBanco')

// Servico de sincronizacao periodica de dados (RNF4)
// Em producao, executaria fetch de APIs externas e atualizaria o banco
// Por enquanto, apenas verifica a integridade dos dados

function verificarIntegridade() {
  const instituicoes = banco.prepare('SELECT COUNT(*) AS total FROM instituicoes').get().total
  const cursos = banco.prepare('SELECT COUNT(*) AS total FROM cursos').get().total
  const notas = banco.prepare('SELECT COUNT(*) AS total FROM notas_corte').get().total
  const custos = banco.prepare('SELECT COUNT(*) AS total FROM custos_cidade').get().total
  const auxilios = banco.prepare('SELECT COUNT(*) AS total FROM auxilios_bolsas').get().total
  const mercados = banco.prepare('SELECT COUNT(*) AS total FROM mercado_estagios').get().total

  return {
    instituicoes,
    cursos,
    notas_corte: notas,
    custos_cidade: custos,
    auxilios_bolsas: auxilios,
    mercado_estagios: mercados,
    verificado_em: new Date().toISOString()
  }
}

function obterEstatisticas() {
  return {
    total_instituicoes: banco.prepare('SELECT COUNT(*) AS total FROM instituicoes').get().total,
    total_cursos: banco.prepare('SELECT COUNT(*) AS total FROM cursos').get().total,
    total_favoritos: banco.prepare('SELECT COUNT(*) AS total FROM favoritos').get().total,
    cursos_por_estado: banco.prepare(`
      SELECT i.estado, COUNT(c.id) AS total
      FROM cursos c
      JOIN instituicoes i ON c.instituicao_id = i.id
      GROUP BY i.estado
      ORDER BY total DESC
    `).all()
  }
}

module.exports = { verificarIntegridade, obterEstatisticas }
