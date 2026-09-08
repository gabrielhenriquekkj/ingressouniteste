function validarInstituicao(dados) {
  const erros = []
  if (!dados.nome || dados.nome.trim().length < 3) erros.push('Nome da instituicao invalido.')
  if (dados.categoria_administrativa && !['federal', 'estadual', 'municipal', 'outra'].includes(dados.categoria_administrativa)) {
    erros.push('Categoria administrativa invalida.')
  }
  if (dados.tipo_instituicao && !['universidade', 'instituto_federal', 'cefet', 'centro_universitario', 'faculdade', 'outra'].includes(dados.tipo_instituicao)) {
    erros.push('Tipo de instituicao invalido.')
  }
  return { valido: erros.length === 0, erros }
}

function validarCampus(dados) {
  const erros = []
  if (!dados.nome || dados.nome.trim().length < 2) erros.push('Nome do campus invalido.')
  if (!dados.instituicao_id || dados.instituicao_id <= 0) erros.push('instituicao_id invalido.')
  return { valido: erros.length === 0, erros }
}

function validarCurso(dados) {
  const erros = []
  if (!dados.nome || dados.nome.trim().length < 2) erros.push('Nome do curso invalido.')
  if (!dados.instituicao_id || dados.instituicao_id <= 0) erros.push('instituicao_id invalido.')
  return { valido: erros.length === 0, erros }
}

function validarNota(dados) {
  const erros = []
  if (!dados.curso_id || dados.curso_id <= 0) erros.push('curso_id invalido.')
  if (dados.nota_corte !== null && dados.nota_corte !== undefined) {
    if (isNaN(dados.nota_corte) || dados.nota_corte < 0 || dados.nota_corte > 1000) {
      erros.push('Nota de corte fora do intervalo valido (0-1000).')
    }
  }
  if (!dados.ano || dados.ano < 2000 || dados.ano > 2100) erros.push('Ano invalido.')
  return { valido: erros.length === 0, erros }
}

module.exports = { validarInstituicao, validarCampus, validarCurso, validarNota }
