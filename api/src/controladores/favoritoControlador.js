const banco = require('../config/conexaoBanco')
const { validarFavorito, validarId } = require('../utilitarios/validadores')

// Adiciona um curso/instituicao aos favoritos (RF6)
function adicionarFavorito(req, res) {
  const { valido, erros, dados } = validarFavorito(req.body)
  if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Dados invalidos.', erros })

  // Verifica se o curso existe
  const curso = banco.prepare('SELECT id FROM cursos WHERE id = ?').get(dados.curso_id)
  if (!curso)
    return res.status(404).json({ sucesso: false, mensagem: 'Curso nao encontrado.' })

  // Verifica se ja esta nos favoritos
  const existente = banco.prepare(
    'SELECT id FROM favoritos WHERE sessao_usuario = ? AND curso_id = ?'
  ).get(dados.sessao_usuario, dados.curso_id)

  if (existente)
    return res.status(409).json({ sucesso: false, mensagem: 'Curso ja esta nos favoritos.' })

  const inserir = banco.prepare(
    'INSERT INTO favoritos (sessao_usuario, curso_id, instituicao_id) VALUES (?, ?, ?)'
  )
  const resultado = inserir.run(dados.sessao_usuario, dados.curso_id, dados.instituicao_id)

  res.status(201).json({
    sucesso: true,
    mensagem: 'Favorito adicionado com sucesso!',
    dados: { id: resultado.lastInsertRowid }
  })
}

// Lista favoritos de um usuario (RF6)
function listarFavoritos(req, res) {
  const sessao = (req.query.sessao_usuario || '').trim()
  if (!sessao || sessao.length < 5)
    return res.status(400).json({ sucesso: false, mensagem: 'Sessao do usuario invalida.' })

  const favoritos = banco.prepare(`
    SELECT f.id, f.criado_em,
           c.id AS curso_id, c.nome AS curso_nome, c.grau, c.modalidade,
           i.id AS instituicao_id, i.nome AS instituicao_nome, i.sigla, i.cidade, i.estado
    FROM favoritos f
    JOIN cursos c ON f.curso_id = c.id
    JOIN instituicoes i ON c.instituicao_id = i.id
    WHERE f.sessao_usuario = ?
    ORDER BY f.criado_em DESC
  `).all(sessao)

  res.json({ sucesso: true, dados: favoritos })
}

// Remove um favorito (RF6)
function removerFavorito(req, res) {
  const id = validarId(req.params.id)
  if (!id)
    return res.status(400).json({ sucesso: false, mensagem: 'ID do favorito invalido.' })

  const favorito = banco.prepare('SELECT * FROM favoritos WHERE id = ?').get(id)
  if (!favorito)
    return res.status(404).json({ sucesso: false, mensagem: 'Favorito nao encontrado.' })

  // Opcional: verificar se pertence ao usuario
  const sessao = (req.query.sessao_usuario || '').trim()
  if (sessao && favorito.sessao_usuario !== sessao)
    return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' })

  banco.prepare('DELETE FROM favoritos WHERE id = ?').run(id)

  res.json({ sucesso: true, mensagem: 'Favorito removido com sucesso!' })
}

module.exports = { adicionarFavorito, listarFavoritos, removerFavorito }
