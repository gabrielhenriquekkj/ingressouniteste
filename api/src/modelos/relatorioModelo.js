const banco = require('../configuracoes/conexaoBanco')

function salvar({ nome, formato, filtros, resumo, dados, totalRegistros, usuarioId }) {
  const agora = new Date().toISOString()
  const resultado = banco.prepare(`
    INSERT INTO relatorios (nome, formato, filtros, resumo, dados, total_registros, criado_em, usuario_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nome,
    formato,
    JSON.stringify(filtros),
    JSON.stringify(resumo),
    JSON.stringify(dados),
    totalRegistros,
    agora,
    usuarioId || null
  )
  return Number(resultado.lastInsertRowid)
}

function listar(limite = 30) {
  return banco.prepare(`
    SELECT r.id, r.nome, r.formato, r.filtros, r.resumo, r.total_registros, r.criado_em, r.usuario_id, u.nome AS usuario_nome
    FROM relatorios r
    LEFT JOIN admin_usuarios u ON u.id = r.usuario_id
    ORDER BY r.id DESC
    LIMIT ?
  `).all(Math.max(1, Math.min(100, Number(limite) || 30))).map(item => ({
    ...item,
    id: Number(item.id),
    totalRegistros: Number(item.total_registros),
    filtros: JSON.parse(item.filtros),
    resumo: JSON.parse(item.resumo)
  }))
}

function buscarPorId(id) {
  const registro = banco.prepare(`
    SELECT r.*, u.nome AS usuario_nome
    FROM relatorios r
    LEFT JOIN admin_usuarios u ON u.id = r.usuario_id
    WHERE r.id = ?
  `).get(id)
  if (!registro) return null
  return {
    ...registro,
    id: Number(registro.id),
    totalRegistros: Number(registro.total_registros),
    filtros: JSON.parse(registro.filtros),
    resumo: JSON.parse(registro.resumo),
    dados: JSON.parse(registro.dados)
  }
}

function remover(id) {
  return banco.prepare('DELETE FROM relatorios WHERE id = ?').run(id).changes > 0
}

module.exports = { salvar, listar, buscarPorId, remover }
