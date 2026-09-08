const banco = require('./src/configuracoes/conexaoBanco')
const migracao001 = require('./migracoes/001_escala_nacional')

// DDL das tabelas para o sistema de Ingresso Universitário
banco.exec(`
  -- Tabela de instituicoes (universidades/faculdades)
  CREATE TABLE IF NOT EXISTS instituicoes (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome                      TEXT NOT NULL,
    sigla                     TEXT,
    cidade                    TEXT,
    estado                    TEXT,
    site                      TEXT,
    categoria_administrativa  TEXT,
    tipo_instituicao          TEXT,
    codigo_ies                TEXT,
    fonte_url                 TEXT,
    coletado_em               TEXT,
    ativo                     INTEGER DEFAULT 1,
    created_at                TEXT DEFAULT (datetime('now','localtime')),
    updated_at                TEXT DEFAULT (datetime('now','localtime'))
  );

  -- Tabela de campi
  CREATE TABLE IF NOT EXISTS campi (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    instituicao_id          INTEGER NOT NULL REFERENCES instituicoes(id),
    nome                    TEXT NOT NULL,
    codigo_campus           TEXT,
    codigo_municipio_ibge   TEXT,
    cidade                  TEXT,
    uf                      TEXT,
    endereco                TEXT,
    site_oficial            TEXT,
    fonte_url               TEXT,
    coletado_em             TEXT,
    ativo                   INTEGER DEFAULT 1,
    created_at              TEXT DEFAULT (datetime('now','localtime')),
    updated_at              TEXT DEFAULT (datetime('now','localtime'))
  );

  -- Tabela de cursos de cada instituicao
  CREATE TABLE IF NOT EXISTS cursos (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    instituicao_id          INTEGER NOT NULL REFERENCES instituicoes(id),
    campus_id               INTEGER REFERENCES campi(id),
    codigo_curso            TEXT,
    nome                    TEXT NOT NULL,
    grau                   TEXT,
    modalidade              TEXT,
    turno                   TEXT,
    duracao_semestres       INTEGER,
    codigo_municipio_ibge   TEXT,
    cidade                  TEXT,
    uf                      TEXT,
    fonte_url               TEXT,
    coletado_em             TEXT,
    ativo                   INTEGER DEFAULT 1,
    created_at              TEXT DEFAULT (datetime('now','localtime')),
    updated_at              TEXT DEFAULT (datetime('now','localtime'))
  );

  -- Notas de corte por processo seletivo (SiSU, ProUni)
  CREATE TABLE IF NOT EXISTS notas_corte (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id           INTEGER NOT NULL REFERENCES cursos(id),
    modalidade_acesso  TEXT,
    processo           TEXT,
    ano                INTEGER NOT NULL,
    chamada            INTEGER NOT NULL,
    nota_minima        REAL,
    nota_corte         REAL,
    turno              TEXT,
    fonte_url          TEXT,
    coletado_em        TEXT,
    created_at         TEXT DEFAULT (datetime('now','localtime')),
    updated_at         TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(curso_id, modalidade_acesso, ano, chamada)
  );

  -- Custos estimados de moradia/despesas por cidade
  CREATE TABLE IF NOT EXISTS custos_cidade (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_municipio_ibge   TEXT,
    cidade                  TEXT NOT NULL,
    estado                  TEXT,
    uf                      TEXT,
    moradia                 REAL,
    alimentacao             REAL,
    transporte              REAL,
    outros                  REAL,
    custo_total             REAL,
    mes_referencia          TEXT,
    tipo_fonte              TEXT DEFAULT 'estimativa',
    fonte_url               TEXT,
    coletado_em             TEXT,
    created_at              TEXT DEFAULT (datetime('now','localtime')),
    updated_at              TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(cidade, uf, mes_referencia)
  );

  -- Bolsas e auxilios oferecidos pela instituicao
  CREATE TABLE IF NOT EXISTS auxilios_bolsas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    instituicao_id  INTEGER NOT NULL REFERENCES instituicoes(id),
    campus_id       INTEGER REFERENCES campi(id),
    nome            TEXT NOT NULL,
    tipo            TEXT,
    descricao       TEXT,
    publico_alvo    TEXT,
    valor           REAL,
    requisitos      TEXT,
    periodicidade   TEXT,
    url             TEXT,
    coletado_em     TEXT
  );

  -- Indicadores de mercado e estagios por curso/regiao
  CREATE TABLE IF NOT EXISTS mercado_estagios (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id        INTEGER NOT NULL REFERENCES cursos(id),
    regiao          TEXT,
    demanda         TEXT,
    salario_medio   REAL,
    vagas_estagio   INTEGER,
    fonte           TEXT,
    fonte_url       TEXT,
    tipo_dado       TEXT DEFAULT 'estimativa',
    atualizado_em   TEXT
  );

  -- Favoritos dos usuarios (anonimo por sessao)
  CREATE TABLE IF NOT EXISTS favoritos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    sessao_usuario  TEXT NOT NULL,
    curso_id        INTEGER REFERENCES cursos(id),
    instituicao_id  INTEGER REFERENCES instituicoes(id),
    criado_em       TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(sessao_usuario, curso_id)
  );

  -- Execucoes de mineracao (log)
  CREATE TABLE IF NOT EXISTS execucoes_mineracao (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo                  TEXT NOT NULL,
    inicio                TEXT NOT NULL,
    fim                   TEXT,
    status                TEXT DEFAULT 'em_andamento',
    itens_processados     INTEGER DEFAULT 0,
    itens_inseridos       INTEGER DEFAULT 0,
    itens_atualizados     INTEGER DEFAULT 0,
    itens_ignorados       INTEGER DEFAULT 0,
    erros                 INTEGER DEFAULT 0,
    observacoes           TEXT
  );

  -- Aliases de instituicoes (para deduplicacao)
  CREATE TABLE IF NOT EXISTS instituicoes_aliases (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    instituicao_id  INTEGER NOT NULL REFERENCES instituicoes(id),
    alias           TEXT NOT NULL,
    fonte           TEXT,
    created_at      TEXT DEFAULT (datetime('now','localtime'))
  );

  -- Indices para performance
  CREATE INDEX IF NOT EXISTS idx_instituicoes_nome ON instituicoes(nome);
  CREATE INDEX IF NOT EXISTS idx_instituicoes_cidade ON instituicoes(cidade, estado);
  CREATE INDEX IF NOT EXISTS idx_inst_categoria ON instituicoes(categoria_administrativa);
  CREATE INDEX IF NOT EXISTS idx_inst_tipo ON instituicoes(tipo_instituicao);
  CREATE INDEX IF NOT EXISTS idx_inst_uf ON instituicoes(estado);
  CREATE INDEX IF NOT EXISTS idx_inst_codigo ON instituicoes(codigo_ies);
  CREATE INDEX IF NOT EXISTS idx_inst_ativo ON instituicoes(ativo);
  CREATE INDEX IF NOT EXISTS idx_cursos_instituicao ON cursos(instituicao_id);
  CREATE INDEX IF NOT EXISTS idx_cursos_campus ON cursos(campus_id);
  CREATE INDEX IF NOT EXISTS idx_cursos_uf ON cursos(uf);
  CREATE INDEX IF NOT EXISTS idx_cursos_nome ON cursos(nome);
  CREATE INDEX IF NOT EXISTS idx_cursos_ativo ON cursos(ativo);
  CREATE INDEX IF NOT EXISTS idx_campi_instituicao ON campi(instituicao_id);
  CREATE INDEX IF NOT EXISTS idx_campi_uf ON campi(uf);
  CREATE INDEX IF NOT EXISTS idx_campi_cidade ON campi(cidade);
  CREATE INDEX IF NOT EXISTS idx_campi_ibge ON campi(codigo_municipio_ibge);
  CREATE INDEX IF NOT EXISTS idx_notas_curso ON notas_corte(curso_id, ano);
  CREATE INDEX IF NOT EXISTS idx_notas_processo ON notas_corte(processo);
  CREATE INDEX IF NOT EXISTS idx_custos_ibge ON custos_cidade(codigo_municipio_ibge);
  CREATE INDEX IF NOT EXISTS idx_custos_uf ON custos_cidade(uf);
  CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos(sessao_usuario);
  CREATE INDEX IF NOT EXISTS idx_execucoes_tipo ON execucoes_mineracao(tipo);
  CREATE INDEX IF NOT EXISTS idx_aliases_instituicao ON instituicoes_aliases(instituicao_id);
`)

console.log('Tabelas do Ingresso Universitário criadas/verificadas com sucesso.')

// Verifica se ja existem dados seed
const totalInstituicoes = banco.prepare('SELECT COUNT(*) AS total FROM instituicoes').get().total
if (totalInstituicoes === 0) {
  console.log('Populando banco com dados iniciais...')

  // Instituições (dados seed legados — apenas públicas)
  const inserirInstituicao = banco.prepare(
    `INSERT INTO instituicoes (nome, sigla, cidade, estado, site, categoria_administrativa, tipo_instituicao)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const instituicoes = [
    ['Universidade Federal de Mato Grosso', 'UFMT', 'Cuiaba', 'MT', 'https://www.ufmt.br', 'federal', 'universidade'],
    ['Universidade Federal de Mato Grosso do Sul', 'UFMS', 'Campo Grande', 'MS', 'https://www.ufms.br', 'federal', 'universidade'],
    ['Universidade do Estado de Mato Grosso', 'UNEMAT', 'Sinop', 'MT', 'https://www.unemat.br', 'estadual', 'universidade'],
    ['Instituto Federal de Mato Grosso', 'IFMT', 'Cuiaba', 'MT', 'https://www.ifmt.edu.br', 'federal', 'instituto_federal'],
    ['Universidade Federal da Grande Dourados', 'UFGD', 'Dourados', 'MS', 'https://www.ufgd.edu.br', 'federal', 'universidade'],
  ]
  for (const inst of instituicoes) inserirInstituicao.run(...inst)

  // Cursos
  const inserirCurso = banco.prepare(
    `INSERT INTO cursos (instituicao_id, nome, grau, modalidade, duracao_semestres, cidade, uf)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const cursos = [
    [1, 'Ciencia da Computacao', 'Bacharelado', 'Presencial', 10, 'Cuiaba', 'MT'],
    [1, 'Engenharia Civil', 'Bacharelado', 'Presencial', 10, 'Cuiaba', 'MT'],
    [1, 'Direito', 'Bacharelado', 'Presencial', 10, 'Cuiaba', 'MT'],
    [1, 'Medicina', 'Bacharelado', 'Presencial', 12, 'Cuiaba', 'MT'],
    [2, 'Administracao', 'Bacharelado', 'Presencial', 8, 'Campo Grande', 'MS'],
    [2, 'Engenharia de Computacao', 'Bacharelado', 'Presencial', 10, 'Campo Grande', 'MS'],
    [2, 'Psicologia', 'Bacharelado', 'Presencial', 10, 'Campo Grande', 'MS'],
    [3, 'Engenharia Florestal', 'Bacharelado', 'Presencial', 10, 'Sinop', 'MT'],
    [3, 'Ciencias Contabeis', 'Bacharelado', 'Presencial', 8, 'Sinop', 'MT'],
    [4, 'Informatica', 'Tecnologico', 'Presencial', 6, 'Cuiaba', 'MT'],
    [4, 'Redes de Computadores', 'Tecnologico', 'Presencial', 5, 'Cuiaba', 'MT'],
    [5, 'Engenharia Agronomica', 'Bacharelado', 'Presencial', 10, 'Dourados', 'MS'],
    [5, 'Farmacia', 'Bacharelado', 'Presencial', 10, 'Dourados', 'MS'],
  ]
  for (const curso of cursos) inserirCurso.run(...curso)

  // Notas de corte (dados de exemplo)
  const inserirNota = banco.prepare(
    `INSERT INTO notas_corte (curso_id, modalidade_acesso, processo, ano, chamada, nota_minima, nota_corte)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const notas = [
    [1, 'SiSU', 'sisu', 2025, 1, 780.5, 780.5],
    [1, 'SiSU', 'sisu', 2025, 2, 750.0, 750.0],
    [2, 'SiSU', 'sisu', 2025, 1, 720.0, 720.0],
    [3, 'SiSU', 'sisu', 2025, 1, 810.0, 810.0],
    [4, 'SiSU', 'sisu', 2025, 1, 890.0, 890.0],
    [5, 'SiSU', 'sisu', 2025, 1, 650.0, 650.0],
    [10, 'SiSU', 'sisu', 2025, 1, 580.0, 580.0],
  ]
  for (const nota of notas) inserirNota.run(...nota)

  // Custos por cidade
  const inserirCusto = banco.prepare(
    `INSERT INTO custos_cidade (cidade, estado, uf, moradia, alimentacao, transporte, outros, custo_total, mes_referencia)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const custos = [
    ['Cuiaba', 'MT', 'MT', 800, 600, 200, 300, 1900, '2025-08'],
    ['Campo Grande', 'MS', 'MS', 750, 550, 180, 280, 1760, '2025-08'],
    ['Sinop', 'MT', 'MT', 600, 500, 150, 250, 1500, '2025-08'],
    ['Dourados', 'MS', 'MS', 550, 480, 140, 230, 1400, '2025-08'],
  ]
  for (const custo of custos) inserirCusto.run(...custo)

  // Auxílios e bolsas
  const inserirAuxilio = banco.prepare(
    'INSERT INTO auxilios_bolsas (instituicao_id, nome, tipo, descricao, url) VALUES (?, ?, ?, ?, ?)'
  )
  const auxilios = [
    [1, 'Bolsa Permanencia', 'bolsa', 'Bolsa para estudantes de baixa renda', 'https://www.ufmt.br/bolsas'],
    [1, 'Auxilio Alimentacao', 'auxilio', 'Auxilio mensal de R$500,00', 'https://www.ufmt.br/auxilios'],
    [2, 'Bolsa ProUni', 'bolsa', 'Bolsa integral ou parcial', 'https://www.ufms.br/prouni'],
    [4, 'Bolsa PIBITI', 'bolsa', 'Programa de Iniciacao a Docencia e Tecnica', 'https://www.ifmt.edu.br/pibiti'],
    [4, 'Auxilio Transporte', 'auxilio', 'Auxilio transporte para estudantes de baixa renda', 'https://www.ifmt.edu.br/transporte'],
  ]
  for (const aux of auxilios) inserirAuxilio.run(...aux)

  // Mercado e estágios
  const inserirMercado = banco.prepare(
    'INSERT INTO mercado_estagios (curso_id, regiao, demanda, salario_medio, vagas_estagio, fonte) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const mercados = [
    [1, 'Centro-Oeste', 'alta', 5500, 25, 'IBGE'],
    [2, 'Centro-Oeste', 'media', 4800, 15, 'IBGE'],
    [3, 'Centro-Oeste', 'alta', 6000, 20, 'OAB'],
    [4, 'Centro-Oeste', 'alta', 12000, 10, 'CRM'],
    [10, 'Centro-Oeste', 'alta', 4000, 20, 'IBGE'],
  ]
  for (const mercado of mercados) inserirMercado.run(...mercado)

  console.log('Dados seed inseridos com sucesso.')
} else {
  console.log('Dados já existem no banco. Executando migrações...')
  migracao001.executar()
}
