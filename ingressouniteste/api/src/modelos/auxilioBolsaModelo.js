const banco = require('../configuracoes/conexaoBanco')

function buscarPorInstituicao(instituicaoId) {
  return banco.prepare(
    'SELECT * FROM auxilios_bolsas WHERE instituicao_id = ? ORDER BY nome'
  ).all(instituicaoId)
}

function buscarPorCampus(campusId) {
  return banco.prepare(
    'SELECT * FROM auxilios_bolsas WHERE campus_id = ? ORDER BY nome'
  ).all(campusId)
}

module.exports = { buscarPorInstituicao, buscarPorCampus }
