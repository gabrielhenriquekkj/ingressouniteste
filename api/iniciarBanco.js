const banco = require('./src/configuracoes/conexaoBanco')

// DDL das novas tabelas para o sistema de Ingresso Universitario
banco.exec(`
  -- Tabela de instituicoes (universidades/faculdades)
  CREATE TABLE IF NOT EXISTS instituicoes (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    nome   TEXT NOT NULL,
    sigla  TEXT,
    cidade TEXT NOT NULL,
    estado TEXT NOT NULL,
    site   TEXT
  );

  -- Tabela de cursos de cada instituicao
  CREATE TABLE IF NOT EXISTS cursos (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    instituicao_id     INTEGER NOT NULL REFERENCES instituicoes(id),
    nome               TEXT NOT NULL,
    grau               TEXT,
    modalidade         TEXT,
    duracao_semestres  INTEGER
  );

  -- Notas de corte por processo seletivo (SiSU, ProUni)
  CREATE TABLE IF NOT EXISTS notas_corte (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id           INTEGER NOT NULL REFERENCES cursos(id),
    modalidade_acesso  TEXT,
    ano                INTEGER NOT NULL,
    chamada            INTEGER NOT NULL,
    nota_minima        REAL,
    UNIQUE(curso_id, modalidade_acesso, ano, chamada)
  );

  -- Custos estimados de moradia/despesas por cidade
  CREATE TABLE IF NOT EXISTS custos_cidade (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    cidade         TEXT NOT NULL,
    estado         TEXT NOT NULL,
    moradia        REAL,
    alimentacao    REAL,
    transporte     REAL,
    outros         REAL,
    mes_referencia TEXT,
    UNIQUE(cidade, estado, mes_referencia)
  );

  -- Bolsas e auxilios oferecidos pela instituicao
  CREATE TABLE IF NOT EXISTS auxilios_bolsas (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    instituicao_id INTEGER NOT NULL REFERENCES instituicoes(id),
    nome           TEXT NOT NULL,
    tipo           TEXT,
    descricao      TEXT,
    url            TEXT
  );

  -- Indicadores de mercado e estagios por curso/regiao
  CREATE TABLE IF NOT EXISTS mercado_estagios (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id       INTEGER NOT NULL REFERENCES cursos(id),
    regiao         TEXT,
    demanda        TEXT,
    salario_medio  REAL,
    vagas_estagio  INTEGER,
    fonte          TEXT,
    atualizado_em  TEXT
  );

  -- Favoritos dos usuarios (anonimo por sessao)
  CREATE TABLE IF NOT EXISTS favoritos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    sessao_usuario TEXT NOT NULL,
    curso_id       INTEGER REFERENCES cursos(id),
    instituicao_id INTEGER REFERENCES instituicoes(id),
    criado_em      TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(sessao_usuario, curso_id)
  );

  -- Indices para performance
  CREATE INDEX IF NOT EXISTS idx_instituicoes_nome ON instituicoes(nome);
  CREATE INDEX IF NOT EXISTS idx_instituicoes_cidade ON instituicoes(cidade, estado);
  CREATE INDEX IF NOT EXISTS idx_cursos_instituicao ON cursos(instituicao_id);
  CREATE INDEX IF NOT EXISTS idx_notas_curso ON notas_corte(curso_id, ano);
  CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos(sessao_usuario);
`)

console.log('Tabelas do Ingresso Universitario criadas/verificadas com sucesso.')

// Verifica se ja existem dados seed
const totalInstituicoes = banco.prepare('SELECT COUNT(*) AS total FROM instituicoes').get().total
if (totalInstituicoes === 0) {
  console.log('Populando banco com dados iniciais...')

  // Instituicoes
  const inserirInstituicao = banco.prepare(
    'INSERT INTO instituicoes (nome, sigla, cidade, estado, site) VALUES (?, ?, ?, ?, ?)'
  )
  const instituicoes = [
    ['Universidade Federal de Mato Grosso', 'UFMT', 'Cuiaba', 'MT', 'https://www.ufmt.br'],
    ['Universidade Federal de Mato Grosso do Sul', 'UFMS', 'Campo Grande', 'MS', 'https://www.ufms.br'],
    ['Universidade do Estado de Mato Grosso', 'UNEMAT', 'Sinop', 'MT', 'https://www.unemat.br'],
    ['Instituto Federal de Mato Grosso', 'IFMT', 'Cuiaba', 'MT', 'https://www.ifmt.edu.br'],
    ['Universidade Federal da Grande Dourados', 'UFGD', 'Dourados', 'MS', 'https://www.ufgd.edu.br'],
    ['Universidade Católica Dom Bosco', 'UCDB', 'Campo Grande', 'MS', 'https://www.ucdb.br'],
    ['Universidade Anhanguera', 'UNIAN', 'Cuiaba', 'MT', 'https://www.anhanguera.com'],
    ['Universidade de Cuiaba', 'UNIC', 'Cuiaba', 'MT', 'https://www.unic.br'],
  ]
  for (const inst of instituicoes) inserirInstituicao.run(...inst)

  // Cursos
  const inserirCurso = banco.prepare(
    'INSERT INTO cursos (instituicao_id, nome, grau, modalidade, duracao_semestres) VALUES (?, ?, ?, ?, ?)'
  )
  const cursos = [
    [1, 'Ciencia da Computacao', 'Bacharelado', 'Presencial', 10],
    [1, 'Engenharia Civil', 'Bacharelado', 'Presencial', 10],
    [1, 'Direito', 'Bacharelado', 'Presencial', 10],
    [1, 'Medicina', 'Bacharelado', 'Presencial', 12],
    [2, 'Administracao', 'Bacharelado', 'Presencial', 8],
    [2, 'Engenharia de Computacao', 'Bacharelado', 'Presencial', 10],
    [2, 'Psicologia', 'Bacharelado', 'Presencial', 10],
    [3, 'Engenharia Florestal', 'Bacharelado', 'Presencial', 10],
    [3, 'Ciencias Contabeis', 'Bacharelado', 'Presencial', 8],
    [4, 'Informatica', 'Tecnologico', 'Presencial', 6],
    [4, 'Redes de Computadores', 'Tecnologico', 'Presencial', 5],
    [4, 'Enfermagem', 'Tecnologico', 'Presencial', 5],
    [5, 'Engenharia Agronomica', 'Bacharelado', 'Presencial', 10],
    [5, 'Farmacia', 'Bacharelado', 'Presencial', 10],
    [6, 'Psicologia', 'Bacharelado', 'Presencial', 10],
    [6, 'Biomedicina', 'Bacharelado', 'Presencial', 10],
    [7, 'Sistema de Informacao', 'Tecnologico', 'EAD', 5],
    [7, 'Gestao de Recursos Humanos', 'Tecnologico', 'EAD', 4],
    [8, 'Marketing', 'Tecnologico', 'Presencial', 4],
    [8, 'Publicidade e Propaganda', 'Tecnologico', 'Presencial', 4],
  ]
  for (const curso of cursos) inserirCurso.run(...curso)

  // Notas de corte (dados de exemplo)
  const inserirNota = banco.prepare(
    'INSERT INTO notas_corte (curso_id, modalidade_acesso, ano, chamada, nota_minima) VALUES (?, ?, ?, ?, ?)'
  )
  const notas = [
    [1, 'SiSU', 2025, 1, 780.5],
    [1, 'SiSU', 2025, 2, 750.0],
    [1, 'ProUni', 2025, 1, 850.0],
    [2, 'SiSU', 2025, 1, 720.0],
    [2, 'SiSU', 2025, 2, 695.0],
    [3, 'SiSU', 2025, 1, 810.0],
    [3, 'ProUni', 2025, 1, 900.0],
    [4, 'SiSU', 2025, 1, 890.0],
    [4, 'SiSU', 2025, 2, 870.0],
    [5, 'SiSU', 2025, 1, 650.0],
    [5, 'ProUni', 2025, 1, 720.0],
    [6, 'SiSU', 2025, 1, 710.0],
    [7, 'SiSU', 2025, 1, 750.0],
    [7, 'ProUni', 2025, 1, 800.0],
    [8, 'SiSU', 2025, 1, 600.0],
    [10, 'SiSU', 2025, 1, 580.0],
    [10, 'SiSU', 2025, 2, 540.0],
    [11, 'SiSU', 2025, 1, 560.0],
    [12, 'SiSU', 2025, 1, 700.0],
    [13, 'SiSU', 2025, 1, 620.0],
    [14, 'SiSU', 2025, 1, 740.0],
    [15, 'SiSU', 2025, 1, 760.0],
    [16, 'SiSU', 2025, 1, 680.0],
    [17, 'ProUni', 2025, 1, 500.0],
    [18, 'ProUni', 2025, 1, 480.0],
  ]
  for (const nota of notas) inserirNota.run(...nota)

  // Custos por cidade
  const inserirCusto = banco.prepare(
    'INSERT INTO custos_cidade (cidade, estado, moradia, alimentacao, transporte, outros, mes_referencia) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const custos = [
    ['Cuiaba', 'MT', 800, 600, 200, 300, '2025-08'],
    ['Campo Grande', 'MS', 750, 550, 180, 280, '2025-08'],
    ['Sinop', 'MT', 600, 500, 150, 250, '2025-08'],
    ['Dourados', 'MS', 550, 480, 140, 230, '2025-08'],
    ['Rondonopolis', 'MT', 500, 450, 130, 220, '2025-08'],
    ['Tangara da Serra', 'MT', 520, 460, 135, 225, '2025-08'],
  ]
  for (const custo of custos) inserirCusto.run(...custo)

  // Auxilios e bolsas
  const inserirAuxilio = banco.prepare(
    'INSERT INTO auxilios_bolsas (instituicao_id, nome, tipo, descricao, url) VALUES (?, ?, ?, ?, ?)'
  )
  const auxilios = [
    [1, 'Bolsa Permanencia', 'bolsa', 'Bolsa para estudantes de baixa renda que permanecem ate o final do semestre', 'https://www.ufmt.br/bolsas'],
    [1, 'Auxilio Alimentacao', 'auxilio', 'Auxilio mensal de R$500,00 para estudantes carentes', 'https://www.ufmt.br/auxilios'],
    [1, 'Bolsa Iniciacao Cientifica', 'bolsa', 'Bolsa para estudantes que participam de projetos de pesquisa', 'https://www.ufmt.br/pibic'],
    [2, 'Bolsa ProUni', 'bolsa', 'Bolsa integral ou parcial do Programa Universidade para Todos', 'https://www.ufms.br/prouni'],
    [2, 'Auxilio Moradia', 'auxilio', 'Auxilio para estudantes de outras cidades', 'https://www.ufms.br/moradia'],
    [3, 'Bolsa FAPEMAT', 'bolsa', 'Bolsa de pesquisa da fundacao estadual', 'https://www.unemat.br/fapemat'],
    [4, 'Bolsa PIBITI', 'bolsa', 'Programa Institucional de Bolsas de Iniciacao a Docencia e Tecnica', 'https://www.ifmt.edu.br/pibiti'],
    [4, 'Auxilio Transporte', 'auxilio', 'Auxilio transporte para estudantes de baixa renda', 'https://www.ifmt.edu.br/transporte'],
    [5, 'Bolsa ProUni', 'bolsa', 'Bolsa do Programa Universidade para Todos', 'https://www.ufgd.br/prouni'],
    [5, 'Auxilio Alimentacao', 'auxilio', 'Auxilio mensal para alimentacao', 'https://www.ufgd.br/auxilios'],
    [6, 'Bolsa Dom Bosco', 'bolsa', 'Bolsa proporcional para estudantes da comunidade', 'https://www.ucdb.br/bolsas'],
    [6, 'Auxilio Biblioteca', 'auxilio', 'Auxilio para material didatico', 'https://www.ucdb.br/auxilios'],
    [7, 'Bolsa EAD', 'bolsa', 'Desconto de 30% para bolsistas ProUni', 'https://www.anhanguera.com/prouni'],
    [8, 'Bolsa Merito', 'bolsa', 'Bolsa para estudantes com alto desempenho academico', 'https://www.unic.br/merito'],
  ]
  for (const aux of auxilios) inserirAuxilio.run(...aux)

  // Mercado e estagios
  const inserirMercado = banco.prepare(
    'INSERT INTO mercado_estagios (curso_id, regiao, demanda, salario_medio, vagas_estagio, fonte, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const mercados = [
    [1, 'Centro-Oeste', 'alta', 5500, 25, 'IBGE/InfoJobs', '2025-08-01'],
    [1, 'Nacional', 'alta', 6200, 150, 'Catho', '2025-08-01'],
    [2, 'Centro-Oeste', 'media', 4800, 15, 'IBGE', '2025-08-01'],
    [2, 'Nacional', 'alta', 5500, 100, 'InfoJobs', '2025-08-01'],
    [3, 'Centro-Oeste', 'alta', 6000, 20, 'OAB', '2025-08-01'],
    [3, 'Nacional', 'media', 5800, 120, 'InfoJobs', '2025-08-01'],
    [4, 'Centro-Oeste', 'alta', 12000, 10, 'CRM-MT', '2025-08-01'],
    [4, 'Nacional', 'alta', 15000, 50, 'Conselho Nacional de Saude', '2025-08-01'],
    [5, 'Centro-Oeste', 'media', 4200, 18, 'IBGE', '2025-08-01'],
    [6, 'Centro-Oeste', 'alta', 5000, 12, 'IBGE/InfoJobs', '2025-08-01'],
    [7, 'Centro-Oeste', 'media', 4500, 15, 'CRP', '2025-08-01'],
    [10, 'Centro-Oeste', 'alta', 4000, 20, 'IBGE', '2025-08-01'],
    [11, 'Centro-Oeste', 'alta', 4200, 18, 'IBGE', '2025-08-01'],
    [12, 'Centro-Oeste', 'alta', 4500, 22, 'COREN', '2025-08-01'],
    [13, 'Centro-Oeste', 'media', 4000, 10, 'IBGE', '2025-08-01'],
    [14, 'Centro-Oeste', 'alta', 4800, 12, 'CRF', '2025-08-01'],
    [15, 'Centro-Oeste', 'media', 4500, 15, 'CRP', '2025-08-01'],
    [16, 'Centro-Oeste', 'media', 4200, 10, 'ANFB', '2025-08-01'],
  ]
  for (const mercado of mercados) inserirMercado.run(...mercado)

  console.log('Dados seed inseridos com sucesso.')
} else {
  console.log('Dados ja existem no banco. Pulando seed.')
}
