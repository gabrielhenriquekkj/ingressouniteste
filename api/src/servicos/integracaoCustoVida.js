const banco = require('../config/conexaoBanco')

// Servico de integracao com dados de custo de vida (RF3)
// Em producao, consumiria APIs como IBGE ou Fontes de Dados Abertos
// Por enquanto, retorna dados do banco local

function buscarCustosPorCidade(cidade) {
  return banco.prepare(
    'SELECT * FROM custos_cidade WHERE cidade = ? ORDER BY mes_referencia DESC'
  ).all(cidade)
}

function listarCidadesComCustos() {
  return banco.prepare(
    'SELECT DISTINCT cidade, estado FROM custos_cidade ORDER BY cidade'
  ).all()
}

function calcularTotalMensal(custo) {
  return (custo.moradia || 0) + (custo.alimentacao || 0) + (custo.transporte || 0) + (custo.outros || 0)
}

module.exports = { buscarCustosPorCidade, listarCidadesComCustos, calcularTotalMensal }
