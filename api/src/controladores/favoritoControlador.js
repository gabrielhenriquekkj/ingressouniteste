const favoritoModelo = require('../modelos/favoritoModelo')
const cursoModelo = require('../modelos/cursoModelo')
const { validarFavorito, validarId } = require('../utilitarios/validadores')

function adicionarFavorito(req, res, next) {
  try {
    const { valido, erros, dados } = validarFavorito(req.body)
    if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Dados invalidos.', erros })

    if (!cursoModelo.existe(dados.curso_id))
      return res.status(404).json({ sucesso: false, mensagem: 'Curso nao encontrado.' })

    if (favoritoModelo.existePorCursoESessao(dados.curso_id, dados.sessao_usuario))
      return res.status(409).json({ sucesso: false, mensagem: 'Curso ja esta nos favoritos.' })

    const resultado = favoritoModelo.inserir(dados.sessao_usuario, dados.curso_id, dados.instituicao_id)

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
      return res.status(400).json({ sucesso: false, mensagem: 'Sessao do usuario invalida.' })

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
      return res.status(400).json({ sucesso: false, mensagem: 'ID do favorito invalido.' })

    const favorito = favoritoModelo.buscarPorId(id)
    if (!favorito)
      return res.status(404).json({ sucesso: false, mensagem: 'Favorito nao encontrado.' })

    const sessao = (req.query.sessao_usuario || '').trim()
    if (sessao && favorito.sessao_usuario !== sessao)
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' })

    favoritoModelo.remover(id)
    res.json({ sucesso: true, mensagem: 'Favorito removido com sucesso!' })
  } catch (erro) {
    next(erro)
  }
}

module.exports = { adicionarFavorito, listarFavoritos, removerFavorito }
