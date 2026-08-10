// dadosDemo.js — Dados de demonstracao para fallback quando a API nao esta disponivel

const ESTADOS_DEMO = ['MT', 'MS']
const CIDADES_DEMO = {
  '': ['Cuiab\u00e1', 'Campo Grande', 'Sinop', 'Dourados', 'Rondon\u00f3polis', 'Tangar\u00e1 da Serra'],
  'MT': ['Cuiab\u00e1', 'Sinop', 'Rondon\u00f3polis', 'Tangar\u00e1 da Serra'],
  'MS': ['Campo Grande', 'Dourados']
}

const CURSOS_DEMO = [
  { id: 1, nome: 'Ci\u00eancia da Computa\u00e7\u00e3o', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 10, instituicao_nome: 'Universidade Federal de Mato Grosso', sigla: 'UFMT', cidade: 'Cuiab\u00e1', estado: 'MT', demanda: 'alta' },
  { id: 2, nome: 'Engenharia Civil', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 10, instituicao_nome: 'Universidade Federal de Mato Grosso', sigla: 'UFMT', cidade: 'Cuiab\u00e1', estado: 'MT', demanda: 'media' },
  { id: 3, nome: 'Direito', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 10, instituicao_nome: 'Universidade Federal de Mato Grosso', sigla: 'UFMT', cidade: 'Cuiab\u00e1', estado: 'MT', demanda: 'alta' },
  { id: 4, nome: 'Medicina', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 12, instituicao_nome: 'Universidade Federal de Mato Grosso', sigla: 'UFMT', cidade: 'Cuiab\u00e1', estado: 'MT', demanda: 'alta' },
  { id: 5, nome: 'Administra\u00e7\u00e3o', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 8, instituicao_nome: 'Universidade Federal de Mato Grosso do Sul', sigla: 'UFMS', cidade: 'Campo Grande', estado: 'MS', demanda: 'media' },
  { id: 6, nome: 'Engenharia de Computa\u00e7\u00e3o', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 10, instituicao_nome: 'Universidade Federal de Mato Grosso do Sul', sigla: 'UFMS', cidade: 'Campo Grande', estado: 'MS', demanda: 'alta' },
  { id: 7, nome: 'Psicologia', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 10, instituicao_nome: 'Universidade Federal de Mato Grosso do Sul', sigla: 'UFMS', cidade: 'Campo Grande', estado: 'MS', demanda: 'media' },
  { id: 8, nome: 'Engenharia Florestal', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 10, instituicao_nome: 'Universidade do Estado de Mato Grosso', sigla: 'UNEMAT', cidade: 'Sinop', estado: 'MT', demanda: 'media' },
  { id: 9, nome: 'Ci\u00eancias Cont\u00e1beis', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 8, instituicao_nome: 'Universidade do Estado de Mato Grosso', sigla: 'UNEMAT', cidade: 'Sinop', estado: 'MT', demanda: 'media' },
  { id: 10, nome: 'Inform\u00e1tica', grau: 'Tecn\u00f3logo', modalidade: 'Presencial', duracao_semestres: 6, instituicao_nome: 'Instituto Federal de Mato Grosso', sigla: 'IFMT', cidade: 'Cuiab\u00e1', estado: 'MT', demanda: 'alta' },
  { id: 11, nome: 'Redes de Computadores', grau: 'Tecn\u00f3logo', modalidade: 'Presencial', duracao_semestres: 5, instituicao_nome: 'Instituto Federal de Mato Grosso', sigla: 'IFMT', cidade: 'Cuiab\u00e1', estado: 'MT', demanda: 'alta' },
  { id: 12, nome: 'Enfermagem', grau: 'Tecn\u00f3logo', modalidade: 'Presencial', duracao_semestres: 5, instituicao_nome: 'Instituto Federal de Mato Grosso', sigla: 'IFMT', cidade: 'Cuiab\u00e1', estado: 'MT', demanda: 'alta' },
  { id: 13, nome: 'Engenharia Agron\u00f4mica', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 10, instituicao_nome: 'Universidade Federal da Grande Dourados', sigla: 'UFGD', cidade: 'Dourados', estado: 'MS', demanda: 'media' },
  { id: 14, nome: 'Farm\u00e1cia', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 10, instituicao_nome: 'Universidade Federal da Grande Dourados', sigla: 'UFGD', cidade: 'Dourados', estado: 'MS', demanda: 'alta' },
  { id: 15, nome: 'Psicologia', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 10, instituicao_nome: 'Universidade Cat\u00f3lica Dom Bosco', sigla: 'UCDB', cidade: 'Campo Grande', estado: 'MS', demanda: 'media' },
  { id: 16, nome: 'Biomedicina', grau: 'Bacharelado', modalidade: 'Presencial', duracao_semestres: 10, instituicao_nome: 'Universidade Cat\u00f3lica Dom Bosco', sigla: 'UCDB', cidade: 'Campo Grande', estado: 'MS', demanda: 'media' },
  { id: 17, nome: 'Sistema de Informa\u00e7\u00e3o', grau: 'Tecn\u00f3logo', modalidade: 'EAD', duracao_semestres: 5, instituicao_nome: 'Universidade Anhanguera', sigla: 'UNIAN', cidade: 'Cuiab\u00e1', estado: 'MT', demanda: 'media' },
  { id: 18, nome: 'Gest\u00e3o de Recursos Humanos', grau: 'Tecn\u00f3logo', modalidade: 'EAD', duracao_semestres: 4, instituicao_nome: 'Universidade Anhanguera', sigla: 'UNIAN', cidade: 'Cuiab\u00e1', estado: 'MT', demanda: 'media' },
  { id: 19, nome: 'Marketing', grau: 'Tecn\u00f3logo', modalidade: 'Presencial', duracao_semestres: 4, instituicao_nome: 'Universidade de Cuiab\u00e1', sigla: 'UNIC', cidade: 'Cuiab\u00e1', estado: 'MT', demanda: 'media' },
  { id: 20, nome: 'P\u00fablicidade e Propaganda', grau: 'Tecn\u00f3logo', modalidade: 'Presencial', duracao_semestres: 4, instituicao_nome: 'Universidade de Cuiab\u00e1', sigla: 'UNIC', cidade: 'Cuiab\u00e1', estado: 'MT', demanda: 'media' }
]

function listarEstadosDemo() { return ESTADOS_DEMO }
function listarCidadesDemo(estado) { return CIDADES_DEMO[estado] || CIDADES_DEMO[''] }

function buscarCursosDemo(filtros) {
  return CURSOS_DEMO.filter((c) => {
    if (filtros.nome) {
      const n = filtros.nome.toLowerCase()
      if (!c.nome.toLowerCase().includes(n) && !c.instituicao_nome.toLowerCase().includes(n) && !(c.sigla || '').toLowerCase().includes(n)) return false
    }
    if (filtros.estado && c.estado !== filtros.estado) return false
    if (filtros.cidade && c.cidade !== filtros.cidade) return false
    return true
  })
}

function detalheCursoDemo(id) {
  const curso = CURSOS_DEMO.find((c) => String(c.id) === String(id))
  if (!curso) return null
  return Object.assign({}, curso, {
    notas_corte: [
      { modalidade_acesso: 'SiSU', ano: 2025, chamada: 1, nota_minima: 700 },
      { modalidade_acesso: 'ProUni', ano: 2025, chamada: 1, nota_minima: 800 }
    ],
    custos: { moradia: 700, alimentacao: 500, transporte: 180, outros: 250, cidade: curso.cidade, estado: curso.estado },
    auxilios: [
      { nome: 'Bolsa Perman\u00eancia', tipo: 'bolsa', descricao: 'Bolsa para estudantes de baixa renda' },
      { nome: 'Aux\u00edlio Alimenta\u00e7\u00e3o', tipo: 'aux\u00edlio', descricao: 'Aux\u00edlio mensal de R$500' }
    ],
    mercado: { demanda: curso.demanda || 'media', regiao: 'Centro-Oeste', salario_medio: 4500, vagas_estagio: 15, fonte: 'IBGE' }
  })
}
