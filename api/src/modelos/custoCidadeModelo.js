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

function buscarPorIBGE(codigoIbge) {
  return banco.prepare(
    'SELECT * FROM custos_cidade WHERE codigo_municipio_ibge = ? ORDER BY mes_referencia DESC LIMIT 1'
  ).get(codigoIbge)
}

function listarCidades() {
  return banco.prepare(
    'SELECT DISTINCT cidade, estado, uf FROM custos_cidade ORDER BY cidade'
  ).all()
}

function calcularTotalMensal(custo) {
  if (custo.custo_total) return custo.custo_total
  return (custo.moradia || 0) + (custo.alimentacao || 0) + (custo.transporte || 0) + (custo.outros || 0)
}

function inserirOuAtualizar(dados) {
  const existente = banco.prepare('SELECT id FROM custos_cidade WHERE cidade = ? AND uf = ? AND mes_referencia = ?').get(dados.cidade, dados.uf, dados.mes_referencia)

  const custoTotal = dados.custo_total || ((dados.moradia || 0) + (dados.alimentacao || 0) + (dados.transporte || 0) + (dados.outros || 0))

  if (existente) {
    banco.prepare(`
      UPDATE custos_cidade SET
        moradia = COALESCE(?, moradia),
        alimentacao = COALESCE(?, alimentacao),
        transporte = COALESCE(?, transporte),
        outros = COALESCE(?, outros),
        custo_total = ?,
        tipo_fonte = COALESCE(?, tipo_fonte),
        fonte_url = COALESCE(?, fonte_url),
        coletado_em = COALESCE(?, coletado_em),
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(dados.moradia, dados.alimentacao, dados.transporte, dados.outros, custoTotal, dados.tipo_fonte, dados.fonte_url, dados.coletado_em, existente.id)
    return { id: existente.id, acao: 'atualizado' }
  }

  const resultado = banco.prepare(`
    INSERT INTO custos_cidade (codigo_municipio_ibge, cidade, estado, uf, moradia, alimentacao, transporte, outros, custo_total, mes_referencia, tipo_fonte, fonte_url, coletado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dados.codigo_municipio_ibge, dados.cidade, dados.estado, dados.uf,
    dados.moradia, dados.alimentacao, dados.transporte, dados.outros,
    custoTotal, dados.mes_referencia, dados.tipo_fonte, dados.fonte_url, dados.coletado_em
  )
  return { id: resultado.lastInsertRowid, acao: 'inserido' }
}

module.exports = { buscarPorCidade, buscarMaisRecente, buscarPorIBGE, listarCidades, calcularTotalMensal, inserirOuAtualizar }
