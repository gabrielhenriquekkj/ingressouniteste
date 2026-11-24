const banco = require('../configuracoes/conexaoBanco')
const { diaLocal, deslocarDia } = require('../utilitarios/segurancaAdmin')

const COLUNAS_DISTRIBUICAO = {
  dispositivo: 'dispositivo',
  navegador: 'navegador',
  sistema: 'sistema'
}

function registrar(registro) {
  const resultado = banco.prepare(`
    INSERT INTO acessos (rota, metodo, criado_em, dia, dispositivo, navegador, sistema, ip_hash, status, area, detalhes)
    VALUES (@rota, @metodo, @criado_em, @dia, @dispositivo, @navegador, @sistema, @ip_hash, @status, @area, @detalhes)
  `).run({
    rota: registro.rota,
    metodo: registro.metodo,
    criado_em: registro.criado_em,
    dia: registro.dia,
    dispositivo: registro.dispositivo,
    navegador: registro.navegador,
    sistema: registro.sistema,
    ip_hash: registro.ip_hash,
    status: registro.status ?? null,
    area: registro.area || 'publico',
    detalhes: registro.detalhes || ''
  })
  return Number(resultado.lastInsertRowid)
}

function atualizarStatus(id, status) {
  if (!id) return
  banco.prepare('UPDATE acessos SET status = ? WHERE id = ?').run(status, id)
}

function contarKpis() {
  const hoje = diaLocal()
  const linha = banco.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN dia = @hoje THEN 1 ELSE 0 END), 0) AS hoje,
      COALESCE(SUM(CASE WHEN dia >= @sete THEN 1 ELSE 0 END), 0) AS sete_dias,
      COALESCE(SUM(CASE WHEN dia >= @trinta THEN 1 ELSE 0 END), 0) AS trinta_dias,
      COUNT(*) AS total
    FROM acessos
  `).get({ hoje, sete: deslocarDia(hoje, -6), trinta: deslocarDia(hoje, -29) })
  return {
    hoje: Number(linha.hoje),
    seteDias: Number(linha.sete_dias),
    trintaDias: Number(linha.trinta_dias),
    total: Number(linha.total)
  }
}

function serieDiaria(inicio, fim) {
  return banco.prepare(`
    WITH RECURSIVE dias(dia) AS (
      SELECT @inicio
      UNION ALL
      SELECT date(dia, '+1 day') FROM dias WHERE dia < @fim
    )
    SELECT d.dia AS dia, COUNT(a.id) AS total
    FROM dias d
    LEFT JOIN acessos a ON a.dia = d.dia
    GROUP BY d.dia
    ORDER BY d.dia
  `).all({ inicio, fim }).map(item => ({ dia: item.dia, total: Number(item.total) }))
}

function ranking(inicio, fim, rota = '', limite = 8) {
  const linhas = banco.prepare(`
    SELECT rota, COUNT(*) AS total
    FROM acessos
    WHERE dia BETWEEN @inicio AND @fim AND (@rota = '' OR rota = @rota)
    GROUP BY rota
    ORDER BY total DESC, rota ASC
    LIMIT @limite
  `).all({ inicio, fim, rota, limite })
  const soma = linhas.reduce((acc, item) => acc + Number(item.total), 0)
  return linhas.map(item => ({
    rota: item.rota,
    total: Number(item.total),
    percentual: soma ? Math.round((Number(item.total) / soma) * 1000) / 10 : 0
  }))
}

function distribuicao(campo, inicio, fim) {
  const coluna = COLUNAS_DISTRIBUICAO[campo]
  if (!coluna) throw new Error('Campo de distribuição inválido.')
  const linhas = banco.prepare(`
    SELECT ${coluna} AS rotulo, COUNT(*) AS total
    FROM acessos
    WHERE dia BETWEEN ? AND ?
    GROUP BY ${coluna}
    ORDER BY total DESC
  `).all(inicio, fim)
  const soma = linhas.reduce((acc, item) => acc + Number(item.total), 0)
  return linhas.map(item => ({
    rotulo: item.rotulo,
    total: Number(item.total),
    percentual: soma ? Math.round((Number(item.total) / soma) * 1000) / 10 : 0
  }))
}

function listar({ inicio, fim, rota = '', pagina = 1, limite = 25, ordem = 'criado_em', direcao = 'desc' } = {}) {
  const paginaSegura = Math.max(1, Math.min(100000, Number(pagina) || 1))
  const limiteSeguro = Math.max(1, Math.min(100, Number(limite) || 25))
  const offset = (paginaSegura - 1) * limiteSeguro
  const colunas = ['criado_em', 'rota', 'dispositivo', 'navegador', 'status', 'area']
  const coluna = colunas.includes(String(ordem)) ? ordem : 'criado_em'
  const sentido = String(direcao).toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const filtros = { inicio, fim, rota, limite: limiteSeguro, offset }

  const total = Number(banco.prepare(`
    SELECT COUNT(*) AS total FROM acessos
    WHERE dia BETWEEN @inicio AND @fim AND (@rota = '' OR rota = @rota)
  `).get(filtros).total)

  const dados = banco.prepare(`
    SELECT id, rota, metodo, criado_em, dia, dispositivo, navegador, sistema, ip_hash, status, area, detalhes
    FROM acessos
    WHERE dia BETWEEN @inicio AND @fim AND (@rota = '' OR rota = @rota)
    ORDER BY ${coluna} ${sentido}, id DESC
    LIMIT @limite OFFSET @offset
  `).all(filtros).map(item => ({ ...item, id: Number(item.id), status: item.status ?? null }))

  return { dados, total, pagina: paginaSegura, limite: limiteSeguro, paginas: Math.ceil(total / limiteSeguro) || 1 }
}

function registrosRelatorio({ inicio, fim, rota = '', maximo = 10000 } = {}) {
  return banco.prepare(`
    SELECT rota, metodo, criado_em, dia, dispositivo, navegador, sistema, ip_hash, status, area, detalhes
    FROM acessos
    WHERE dia BETWEEN @inicio AND @fim AND (@rota = '' OR rota = @rota)
    ORDER BY criado_em DESC, id DESC
    LIMIT @maximo
  `).all({ inicio, fim, rota, maximo }).map(item => ({
    rota: item.rota,
    metodo: item.metodo,
    criadoEm: item.criado_em,
    dia: item.dia,
    dispositivo: item.dispositivo,
    navegador: item.navegador,
    sistema: item.sistema,
    ipHash: item.ip_hash,
    status: item.status ?? null,
    area: item.area,
    detalhes: item.detalhes || ''
  }))
}

function rotasDisponiveis() {
  return banco.prepare(`
    SELECT rota, COUNT(*) AS total FROM acessos GROUP BY rota ORDER BY total DESC, rota ASC LIMIT 100
  `).all().map(item => ({ rota: item.rota, total: Number(item.total) }))
}

function recentes(limite = 6) {
  return banco.prepare(`
    SELECT rota, criado_em, dispositivo, navegador, status, area, detalhes
    FROM acessos ORDER BY id DESC LIMIT ?
  `).all(Math.max(1, Math.min(20, Number(limite) || 6))).map(item => ({
    rota: item.rota,
    criadoEm: item.criado_em,
    dispositivo: item.dispositivo,
    navegador: item.navegador,
    status: item.status ?? null,
    area: item.area,
    detalhes: item.detalhes || ''
  }))
}

module.exports = {
  registrar,
  atualizarStatus,
  contarKpis,
  serieDiaria,
  ranking,
  distribuicao,
  listar,
  registrosRelatorio,
  rotasDisponiveis,
  recentes
}
