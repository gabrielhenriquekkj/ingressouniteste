const banco = require('../../configuracoes/conexaoBanco')

function registrarExecucao(tipo) {
  const resultado = banco.prepare(
    'INSERT INTO execucoes_mineracao (tipo, inicio) VALUES (?, datetime(\'now\',\'localtime\'))'
  ).run(tipo)
  return resultado.lastInsertRowid
}

function finalizarExecucao(id, status, stats) {
  banco.prepare(`
    UPDATE execucoes_mineracao SET
      fim = datetime('now','localtime'),
      status = ?,
      itens_processados = ?,
      itens_inseridos = ?,
      itens_atualizados = ?,
      itens_ignorados = ?,
      erros = ?,
      observacoes = ?
    WHERE id = ?
  `).run(status, stats.processados || 0, stats.inseridos || 0, stats.atualizados || 0, stats.ignorados || 0, stats.erros || 0, stats.observacoes || null, id)
}

function registrarErro(execucaoId, mensagem) {
  const exec = banco.prepare('SELECT observacoes FROM execucoes_mineracao WHERE id = ?').get(execucaoId)
  const anteriores = exec?.observacoes || ''
  const atualizadas = anteriores ? `${anteriores}\n${mensagem}` : mensagem
  banco.prepare('UPDATE execucoes_mineracao SET observacoes = ? WHERE id = ?').run(atualizadas, execucaoId)
}

function ultimaExecucao(tipo) {
  return banco.prepare(
    'SELECT * FROM execucoes_mineracao WHERE tipo = ? ORDER BY id DESC LIMIT 1'
  ).get(tipo)
}

function listarExecucoes(tipo, limite = 10) {
  if (tipo) {
    return banco.prepare('SELECT * FROM execucoes_mineracao WHERE tipo = ? ORDER BY id DESC LIMIT ?').all(tipo, limite)
  }
  return banco.prepare('SELECT * FROM execucoes_mineracao ORDER BY id DESC LIMIT ?').all(limite)
}

module.exports = { registrarExecucao, finalizarExecucao, registrarErro, ultimaExecucao, listarExecucoes }
