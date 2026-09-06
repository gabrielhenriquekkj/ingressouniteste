const fs = require('fs')
const path = require('path')
const readline = require('readline')
const banco = require('../../configuracoes/conexaoBanco')
const log = require('../log/execucoesMineracao')

const CAMINHO_MUNICIPIOS = path.resolve(__dirname, '../../../temp/municipios.csv')

const FATORES_REGIAO = {
  'Norte': 0.70, 'Nordeste': 0.65, 'Centro-Oeste': 0.85, 'Sudeste': 1.00, 'Sul': 0.90
}

function estimarCustos(pibPerCapita, regiao) {
  const fator = FATORES_REGIAO[regiao] || 0.80
  const base = pibPerCapita / 12
  const moradia = Math.round(base * 0.35 * fator)
  const alimentacao = Math.round(base * 0.25 * fator)
  const transporte = Math.round(base * 0.15 * fator)
  const outros = Math.round(base * 0.10 * fator)
  const total = moradia + alimentacao + transporte + outros
  return { moradia, alimentacao, transporte, outros, custo_total: total }
}

async function coletar() {
  const execucaoId = log.registrarExecucao('custos_cidade')
  const stats = { inseridos: 0, erros: 0 }

  console.log('[COLETOR CUSTOS] Populando custos de vida por cidade...')

  if (fs.existsSync(CAMINHO_MUNICIPIOS)) {
    return coletarDeCSV(execucaoId, stats)
  }

  console.log('[COLETOR CUSTOS] CSV não encontrado, gerando estimativas a partir das instituições...')
  const instituicoes = banco.prepare("SELECT DISTINCT cidade, estado FROM instituicoes WHERE cidade IS NOT NULL AND cidade != ''").all()
  const stmtExiste = banco.prepare('SELECT id FROM custos_cidade WHERE cidade = ? AND uf = ?')
  const stmtInserir = banco.prepare(`INSERT INTO custos_cidade (codigo_municipio_ibge, cidade, estado, uf, moradia, alimentacao, transporte, outros, custo_total, mes_referencia, tipo_fonte, fonte_url, coletado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))`)

  const PIB_ESTIMADO = {
    'Norte': 22000, 'Nordeste': 18000, 'Centro-Oeste': 35000, 'Sudeste': 42000, 'Sul': 38000
  }
  const UF_REGIAO = {
    'AC': 'Norte', 'AM': 'Norte', 'AP': 'Norte', 'PA': 'Norte', 'RO': 'Norte', 'RR': 'Norte', 'TO': 'Norte',
    'AL': 'Nordeste', 'BA': 'Nordeste', 'CE': 'Nordeste', 'MA': 'Nordeste', 'PB': 'Nordeste', 'PE': 'Nordeste', 'PI': 'Nordeste', 'RN': 'Nordeste', 'SE': 'Nordeste',
    'DF': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'MS': 'Centro-Oeste', 'MT': 'Centro-Oeste',
    'ES': 'Sudeste', 'MG': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
    'PR': 'Sul', 'RS': 'Sul', 'SC': 'Sul'
  }

  const inserirBatch = banco.transaction((lista) => {
    for (const item of lista) {
      try {
        const existente = stmtExiste.get(item.cidade, item.estado)
        if (existente) continue
        const regiao = UF_REGIAO[item.estado] || 'Sudeste'
        const pibBase = PIB_ESTIMADO[regiao] || 30000
        const custos = estimarCustos(pibBase, regiao)
        stmtInserir.run(null, item.cidade, item.estado, item.estado, custos.moradia, custos.alimentacao, custos.transporte, custos.outros, custos.custo_total, 'estimativa', 'estimativa_instituicoes', 'fallback_cidades')
        stats.inseridos++
      } catch (e) { stats.erros++ }
    }
  })
  inserirBatch(instituicoes)

  console.log(`[COLETOR CUSTOS] ${stats.inseridos} cidades populadas (estimativa)`)
  log.finalizarExecucao(execucaoId, 'sucesso', { processados: stats.inseridos, inseridos: stats.inseridos, atualizados: 0, erros: stats.erros, observacoes: 'Estimativa a partir de cidades das instituições' })
  return stats
}

async function coletarDeCSV(execucaoId, stats) {
  const stmtExiste = banco.prepare('SELECT id FROM custos_cidade WHERE codigo_municipio_ibge = ?')
  const stmtInserir = banco.prepare(`INSERT INTO custos_cidade (codigo_municipio_ibge, cidade, estado, uf, moradia, alimentacao, transporte, outros, custo_total, mes_referencia, tipo_fonte, fonte_url, coletado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))`)

  const inserirBatch = banco.transaction((lista) => {
    for (const item of lista) {
      try {
        const existente = stmtExiste.get(item.ibge)
        if (existente) continue
        stmtInserir.run(item.ibge, item.municipio, item.estado, item.uf, item.moradia, item.alimentacao, item.transporte, item.outros, item.custo_total, item.mes_referencia, item.tipo_fonte, item.fonte_url)
        stats.inseridos++
      } catch (e) { stats.erros++ }
    }
  })

  const rl = readline.createInterface({ input: fs.createReadStream(CAMINHO_MUNICIPIOS, { encoding: 'utf-8' }), crlfDelay: Infinity })

  let count = 0
  let batch = []

  for await (const linha of rl) {
    if (count === 0) { count++; continue }
    const p = linha.split(',')
    if (p.length < 13) continue

    const ibge = p[0]
    const municipio = p[1]
    const uf = p[2]
    const regiao = p[3]
    const pibPerCapita = parseFloat(p[9]) || 0

    if (!ibge || !municipio || pibPerCapita <= 0) continue

    const custos = estimarCustos(pibPerCapita, regiao)
    batch.push({ ibge, municipio, estado: '', uf, ...custos, mes_referencia: '2023', tipo_fonte: 'estimativa_pib', fonte_url: 'IBGE_PIB_PerCapita_2023' })

    if (batch.length >= 1000) {
      inserirBatch(batch)
      batch = []
    }
  }
  if (batch.length > 0) inserirBatch(batch)

  console.log(`[COLETOR CUSTOS] ${stats.inseridos} cidades populadas`)
  log.finalizarExecucao(execucaoId, 'sucesso', { processados: stats.inseridos, inseridos: stats.inseridos, atualizados: 0, erros: stats.erros, observacoes: '' })
  return stats
}

module.exports = { coletar }
