const validator = require('validator')

// Remove espaços extras e escapa caracteres especiais
function sanitizar(texto) {
  return validator.trim(validator.escape(texto || ''))
}

// Valida e sanitiza os dados de busca (RF1)
function validarBusca(dados) {
  const erros = []
  const nome = sanitizar(dados.nome || '')
  const cidade = sanitizar(dados.cidade || '')
  const estado = sanitizar(dados.estado || '')

  if (nome.length > 150)
    erros.push('Nome deve ter no maximo 150 caracteres.')

  if (cidade.length > 100)
    erros.push('Cidade deve ter no maximo 100 caracteres.')

  if (estado.length > 2)
    erros.push('Estado deve ter no maximo 2 caracteres.')

  return { valido: erros.length === 0, erros, dados: { nome, cidade, estado } }
}

// Valida e sanitiza os dados de favorito (RF6)
function validarFavorito(dados) {
  const erros = []
  const sessao = sanitizar(dados.sessao_usuario || '')
  const cursoId = parseInt(dados.curso_id)
  const instituicaoId = parseInt(dados.instituicao_id)

  if (!sessao || sessao.length < 5)
    erros.push('Identificador de sessao invalido.')

  if (!cursoId || cursoId <= 0)
    erros.push('ID do curso invalido.')

  if (instituicaoId && (isNaN(instituicaoId) || instituicaoId <= 0))
    erros.push('ID da instituicao invalido.')

  return {
    valido: erros.length === 0,
    erros,
    dados: { sessao_usuario: sessao, curso_id: cursoId, instituicao_id: instituicaoId || null }
  }
}

// Valida parametros de ID (inteiro positivo)
function validarId(valor) {
  const id = parseInt(valor)
  return !isNaN(id) && id > 0 ? id : null
}

module.exports = { sanitizar, validarBusca, validarFavorito, validarId }
