const banco = require('../../configuracoes/conexaoBanco')
const log = require('../log/execucoesMineracao')

const AUXILIOS_POR_TIPO = {
  federal: [
    { nome: 'Bolsa Permanência', tipo: 'bolsa', descricao: 'Bolsa estudantil para estudantes de baixa renda matriculados em cursos de graduação presencial em instituições federais', valor: 450.00, publico_alvo: 'Estudantes de baixa renda', requisitos: 'Renda familiar per capita inferior a 1,5 salário mínimo', periodicidade: 'Mensal' },
    { nome: 'Auxílio Alimentação', tipo: 'auxilio', descricao: 'Auxílio financeiro para alimentação no Restaurante Universitário (RU)', valor: 336.00, publico_alvo: 'Todos os estudantes', requisitos: 'Matrícula ativa', periodicidade: 'Mensal' },
    { nome: 'Auxílio Moradia', tipo: 'auxilio', descricao: 'Auxílio para estudantes que necessitam se deslocar para outra cidade para estudar', valor: 500.00, publico_alvo: 'Estudantes de outras cidades', requisitos: 'Comprovante de residência em outra cidade', periodicidade: 'Mensal' },
    { nome: 'Auxílio Transporte', tipo: 'auxilio', descricao: 'Auxílio para deslocamento entre residência e campus', valor: 250.00, publico_alvo: 'Todos os estudantes', requisitos: 'Matrícula ativa', periodicidade: 'Mensal' },
    { nome: 'Bolsa Monitoria', tipo: 'bolsa', descricao: 'Bolsa para estudantes que atuam como monitores em disciplinas', valor: 400.00, publico_alvo: 'Estudantes com bom desempenho acadêmico', requisitos: 'Aprovação em processo seletivo de monitoria', periodicidade: 'Mensal' },
    { nome: 'Bolsa Iniciação Científica', tipo: 'bolsa', descricao: 'Bolsa para estudantes participantes de projetos de pesquisa (PIBIC)', valor: 400.00, publico_alvo: 'Estudantes de graduação', requisitos: 'Seleção em edital PIBIC', periodicidade: 'Mensal' },
    { nome: 'Auxílio Necessidade Especial', tipo: 'auxilio', descricao: 'Auxílio para estudantes com deficiência ou necessidade especial', valor: 600.00, publico_alvo: 'Estudantes com deficiência', requisitos: 'Laudo médico ou atestado de necessidade especial', periodicidade: 'Mensal' },
    { nome: 'Quota Social', tipo: 'bolsa', descricao: 'Reserva de vagas para estudantes de escolas públicas com renda familiar baixa', valor: null, publico_alvo: 'Estudantes de escolas públicas', requisitos: 'Renda familiar per capita inferior a 1,5 salário mínimo', periodicidade: 'Única' },
  ],
  estadual: [
    { nome: 'Bolsa Permanência', tipo: 'bolsa', descricao: 'Bolsa estudantil para estudantes de baixa renda', valor: 400.00, publico_alvo: 'Estudantes de baixa renda', requisitos: 'Renda familiar per capita inferior a 1,5 salário mínimo', periodicidade: 'Mensal' },
    { nome: 'Auxílio Alimentação', tipo: 'auxilio', descricao: 'Auxílio para alimentação', valor: 300.00, publico_alvo: 'Todos os estudantes', requisitos: 'Matrícula ativa', periodicidade: 'Mensal' },
    { nome: 'Auxílio Moradia', tipo: 'auxilio', descricao: 'Auxílio para estudantes de outras cidades', valor: 450.00, publico_alvo: 'Estudantes de outras cidades', requisitos: 'Comprovante de residência em outra cidade', periodicidade: 'Mensal' },
    { nome: 'Bolsa Monitoria', tipo: 'bolsa', descricao: 'Bolsa para monitores', valor: 350.00, publico_alvo: 'Estudantes com bom desempenho', requisitos: 'Seleção em processo seletivo', periodicidade: 'Mensal' },
    { nome: 'Quota Social', tipo: 'bolsa', descricao: 'Reserva de vagas para estudantes de escolas públicas', valor: null, publico_alvo: 'Estudantes de escolas públicas', requisitos: 'Renda familiar per capita inferior a 1,5 salário mínimo', periodicidade: 'Única' },
  ],
  municipal: [
    { nome: 'Bolsa Permanência', tipo: 'bolsa', descricao: 'Bolsa estudantil municipal', valor: 350.00, publico_alvo: 'Estudantes de baixa renda', requisitos: 'Renda familiar per capita inferior a 1,5 salário mínimo', periodicidade: 'Mensal' },
    { nome: 'Auxílio Alimentação', tipo: 'auxilio', descricao: 'Auxílio para alimentação', valor: 250.00, publico_alvo: 'Todos os estudantes', requisitos: 'Matrícula ativa', periodicidade: 'Mensal' },
    { nome: 'Transporte Escolar', tipo: 'auxilio', descricao: 'Auxílio de transporte para estudantes da região', valor: 200.00, publico_alvo: 'Estudantes do município', requisitos: 'Residência no município', periodicidade: 'Mensal' },
  ],
  privada: [
    { nome: 'PROUNI', tipo: 'bolsa', descricao: 'Programa Universidade para todos - bolsas integrais e parciais para estudantes de baixa renda', valor: null, publico_alvo: 'Estudantes de baixa renda', requisitos: 'Renda familiar per capita até 3 salários mínimos', periodicidade: 'Anual' },
    { nome: 'FIES', tipo: 'financiamento', descricao: 'Fundo de Financiamento Estudantil - financiamento com juros baixos para cursos de graduação', valor: null, publico_alvo: 'Estudantes de baixa renda', requisitos: 'Renda familiar per capita até 5 salários mínimos', periodicidade: 'Mensal' },
    { nome: 'Bolsa Institucional', tipo: 'bolsa', descricao: 'Bolsa oferecida pela própria instituição para estudantes com bom desempenho acadêmico', valor: null, publico_alvo: 'Estudantes com bom desempenho', requisitos: 'Bom desempenho acadêmico', periodicidade: 'Mensal' },
    { nome: 'Desconto Social', tipo: 'desconto', descricao: 'Desconto para estudantes de baixa renda com comprovante', valor: null, publico_alvo: 'Estudantes de baixa renda', requisitos: 'Comprovante de renda', periodicidade: 'Mensal' },
  ]
}

function coletar() {
  const execucaoId = log.registrarExecucao('auxilios_bolsas')
  const stats = { inseridos: 0, erros: 0 }

  console.log('[COLETOR AUXÍLIOS] Populando auxílios e bolsas para todas as instituições...')

  const instituicoes = banco.prepare('SELECT id, nome, categoria_administrativa FROM instituicoes WHERE ativo = 1').all()
  console.log(`[COLETOR AUXÍLIOS] ${instituicoes.length} instituições encontradas`)

  const stmtExiste = banco.prepare('SELECT id FROM auxilios_bolsas WHERE instituicao_id = ? AND nome = ?')
  const stmtInserir = banco.prepare(`
    INSERT INTO auxilios_bolsas (instituicao_id, nome, tipo, descricao, publico_alvo, valor, requisitos, periodicidade, url, fonte_tipo, coletado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
  `)

  const inserirBatch = banco.transaction((lista) => {
    for (const item of lista) {
      try {
        const existente = stmtExiste.get(item.instituicao_id, item.nome)
        if (existente) continue
        stmtInserir.run(item.instituicao_id, item.nome, item.tipo, item.descricao, item.publico_alvo, item.valor, item.requisitos, item.periodicidade, item.url || null, item.fonte_tipo || 'estimativa')
        stats.inseridos++
      } catch (e) { stats.erros++ }
    }
  })

  const todosInserir = []

  for (const ies of instituicoes) {
    let tipo = 'privada'
    const cat = (ies.categoria_administrativa || '').toLowerCase()
    if (cat.includes('federal')) tipo = 'federal'
    else if (cat.includes('estadual')) tipo = 'estadual'
    else if (cat.includes('municipal')) tipo = 'municipal'

    const auxilios = AUXILIOS_POR_TIPO[tipo] || AUXILIOS_POR_TIPO.privada
    for (const a of auxilios) {
      todosInserir.push({
        instituicao_id: ies.id,
        nome: a.nome,
        tipo: a.tipo,
        descricao: a.descricao,
        publico_alvo: a.publico_alvo,
        valor: a.valor,
        requisitos: a.requisitos,
        periodicidade: a.periodicidade,
        url: null,
        fonte_tipo: 'estimativa'
      })
    }
  }

  inserirBatch(todosInserir)

  console.log(`[COLETOR AUXÍLIOS] ${stats.inseridos} auxílios/bolsas inseridos`)
  log.finalizarExecucao(execucaoId, 'sucesso', { processados: instituicoes.length, inseridos: stats.inseridos, atualizados: 0, erros: stats.erros, observacoes: '' })
  return stats
}

module.exports = { coletar }
