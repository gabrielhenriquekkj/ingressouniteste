const banco = require('../config/conexaoBanco')
const { validarBusca } = require('../utilitarios/validadores')

// Busca unificada de cursos e instituicoes com filtros (RF1)
function buscar(req, res) {
  const { valido, erros, dados } = validarBusca(req.query)
  if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Parametros invalidos.', erros })

  const { nome, cidade, estado } = dados
  const resultados = { instituicoes: [], cursos: [] }

  // Busca instituicoes
  let sqlInst = 'SELECT * FROM instituicoes WHERE 1=1'
  const paramInst = []

  if (nome) {
    sqlInst += ' AND (nome LIKE ? OR sigla LIKE ?)'
    paramInst.push(`%${nome}%`, `%${nome}%`)
  }
  if (cidade) {
    sqlInst += ' AND cidade LIKE ?'
    paramInst.push(`%${cidade}%`)
  }
  if (estado) {
    sqlInst += ' AND UPPER(estado) = UPPER(?)'
    paramInst.push(estado)
  }

  resultados.instituicoes = banco.prepare(sqlInst).all(...paramInst)

  // Busca cursos (com JOIN na instituicao)
  let sqlCurso = `
    SELECT c.*, i.nome AS instituicao_nome, i.sigla, i.cidade, i.estado
    FROM cursos c
    JOIN instituicoes i ON c.instituicao_id = i.id
    WHERE 1=1
  `
  const paramCurso = []

  if (nome) {
    sqlCurso += ' AND (c.nome LIKE ? OR i.nome LIKE ?)'
    paramCurso.push(`%${nome}%`, `%${nome}%`)
  }
  if (cidade) {
    sqlCurso += ' AND i.cidade LIKE ?'
    paramCurso.push(`%${cidade}%`)
  }
  if (estado) {
    sqlCurso += ' AND UPPER(i.estado) = UPPER(?)'
    paramCurso.push(estado)
  }

  resultados.cursos = banco.prepare(sqlCurso).all(...paramCurso)

  res.json({ sucesso: true, dados: resultados })
}

module.exports = { buscar }
