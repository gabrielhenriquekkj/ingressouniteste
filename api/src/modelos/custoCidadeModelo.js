const banco = require('../configuracoes/conexaoBanco')

function buscarPorCidade(cidade) {
  return banco.prepare(
    'SELECT * FROM custos_cidade WHERE cidade = ? ORDER BY mes_referencia DESC'
  ).all(cidade)
}

function buscarMaisRecente(cidade) {
  return banco.prepare(
    'SELECT * FROM custos_cidade WHERE cidade = ? ORDER BY mes_referencia DESC LIMIT 1'
  ).get(cidade)
}

function listarCidades() {
  return banco.prepare(
    'SELECT DISTINCT cidade, estado FROM custos_cidade ORDER BY cidade'
  ).all()
}

function calcularTotalMensal(custo) {
  return (custo.moradia || 0) + (custo.alimentacao || 0) + (custo.transporte || 0) + (custo.outros || 0)
}

module.exports = { buscarPorCidade, buscarMaisRecente, listarCidades, calcularTotalMensal }
