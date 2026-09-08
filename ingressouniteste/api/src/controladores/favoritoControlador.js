const favoritoModelo = require('../modelos/favoritoModelo')
const cursoModelo = require('../modelos/cursoModelo')
const { validarFavorito, validarId } = require('../utilitarios/validadores')

function adicionarFavorito(req, res, next) {
  try {
    const { valido, erros, dados } = validarFavorito(req.body)
    if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Dados inválidos.', erros })

    if (!cursoModelo.existe(dados.curso_id))
      return res.status(404).json({ sucesso: false, mensagem: 'Curso não encontrado.' })

    const resultado = favoritoModelo.inserirSeguro(dados.sessao_usuario, dados.curso_id, dados.instituicao_id)

    if (resultado.duplicate) {
      return res.status(409).json({ sucesso: false, mensagem: 'Curso já está nos favoritos.' })
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Favorito adicionado com sucesso!',
      dados: { id: resultado.id }
    })
  } catch (erro) {
    next(erro)
  }
}

function listarFavoritos(req, res, next) {
  try {
    const sessao = (req.query.sessao_usuario || '').trim()
    if (!sessao || sessao.length < 5)
      return res.status(400).json({ sucesso: false, mensagem: 'Sessão do usuário inválida.' })

    const favoritos = favoritoModelo.listarPorSessao(sessao)
    res.json({ sucesso: true, mensagem: 'Favoritos listados com sucesso.', dados: favoritos })
  } catch (erro) {
    next(erro)
  }
}

function removerFavorito(req, res, next) {
  try {
    const id = validarId(req.params.id)
    if (!id)
      return res.status(400).json({ sucesso: false, mensagem: 'ID do favorito inválido.' })

    const favorito = favoritoModelo.buscarPorId(id)
    if (!favorito)
      return res.status(404).json({ sucesso: false, mensagem: 'Favorito não encontrado.' })

    const sessao = (req.query.sessao_usuario || '').trim()
    if (!sessao || sessao.length < 5)
      return res.status(400).json({ sucesso: false, mensagem: 'Sessão do usuário obrigatória.' })

    if (favorito.sessao_usuario !== sessao)
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' })

    favoritoModelo.remover(id)
    res.json({ sucesso: true, mensagem: 'Favorito removido com sucesso!' })
  } catch (erro) {
    next(erro)
  }
}

module.exports = { adicionarFavorito, listarFavoritos, removerFavorito }
