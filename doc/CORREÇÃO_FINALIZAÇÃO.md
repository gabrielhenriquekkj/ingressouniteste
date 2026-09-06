# PLANO DE CORREÇÃO E FINALIZAÇÃO — INGRESSO UNIVERSITÁRIO

> **Projeto Integrador I — Grupo 3 — IFMT — 2026**

Este documento deve ser utilizado como **especificação de implementação e correção do projeto existente**.

O projeto já possui uma base funcional. **NÃO recriar o projeto do zero.**
A tarefa é analisar o código existente, preservar o que já funciona, corrigir inconsistências, ampliar a abrangência dos dados e finalizar as funcionalidades pendentes.

---

# 1. OBJETIVO PRINCIPAL

Transformar o estado atual do **Ingresso Universitário** em uma plataforma nacional de consulta de instituições públicas de ensino superior, cursos, notas de corte, custos/indicadores da cidade, auxílios e oportunidades.

O sistema deve abranger:

* universidades federais;
* universidades estaduais;
* universidades municipais;
* institutos federais;
* centros federais de educação tecnológica;
* outras instituições públicas de ensino superior reconhecidas nas bases oficiais.

## REGRA FUNDAMENTAL

A aplicação **não pode depender de uma lista fixa de 8 instituições, 6 cidades ou qualquer quantidade limitada de instituições**.

Os dados devem ser descobertos e atualizados por fontes públicas.

Instituições privadas devem ser excluídas do catálogo principal.

---

# 2. REGRA MAIS IMPORTANTE: PRESERVAR O PROJETO ATUAL

Antes de modificar qualquer arquivo:

1. analisar a estrutura existente;
2. executar o projeto;
3. verificar quais endpoints funcionam;
4. verificar quais páginas funcionam;
5. verificar o banco atual;
6. verificar os scripts de mineração;
7. verificar os dados atualmente armazenados;
8. identificar funcionalidades já implementadas.

## NÃO fazer

* não apagar o frontend funcional;
* não substituir toda a arquitetura;
* não recriar o banco sem necessidade;
* não remover endpoints existentes sem criar compatibilidade;
* não remover funcionalidades funcionando;
* não trocar SQLite por outro banco;
* não trocar Express;
* não trocar JavaScript vanilla;
* não trocar a arquitetura MVC sem necessidade.

As alterações devem ser incrementais.

---

# 3. PROBLEMAS ATUAIS QUE DEVEM SER CORRIGIDOS

O README atual apresenta algumas informações que não correspondem ao objetivo final do projeto.

Corrigir obrigatoriamente:

## 3.1 SiSU limitado a 2023

Atualmente existem referências a:

```text
SiSU 2023
```

e:

```text
npm run minerar:sisu
→ Coleta notas de corte do SiSU 2023
```

Isso deve ser removido.

O sistema deve possuir suporte a múltiplos anos:

```text
2023
2024
2025
2026
anos futuros
```

O ano não pode ficar hard-coded no código.

---

# 4. SISTEMA DE NOTAS DE CORTE

## 4.1 Objetivo

Criar um sistema de mineração capaz de coletar dados históricos de processos seletivos e armazenar cada edição separadamente.

A estrutura deve permitir:

```text
instituição
    ↓
curso
    ↓
processo seletivo
    ↓
ano
    ↓
chamada
    ↓
modalidade
    ↓
nota
```

---

# 5. FONTE DO SISU

A prioridade de coleta deve ser:

### Prioridade 1 — fonte oficial

MEC / SiSU / Portal Brasileiro de Dados Abertos / Dados Abertos do MEC.

### Prioridade 2 — fonte oficial alternativa

Relatórios ou arquivos publicados por órgãos públicos relacionados ao processo.

### Prioridade 3 — fonte secundária

Somente quando não existir o dado oficial necessário.

Toda fonte secundária deve ser marcada como:

```text
fonte_tipo = "secundaria"
```

Nunca apresentar uma fonte secundária como se fosse oficial.

---

# 6. COLETOR SISU

Modificar:

```text
api/src/mineracao/coletores/coletorSisu.js
```

para que ele NÃO seja específico de 2023.

Criar uma rotina conceitualmente semelhante a:

```javascript
coletarSisu(ano)
```

ou:

```javascript
coletarTodosAnosDisponiveis()
```

## O coletor deve:

1. descobrir os arquivos/relatórios disponíveis;
2. identificar o ano;
3. baixar o arquivo;
4. identificar formato:

   * CSV;
   * XLSX;
   * XLS;
   * ZIP;
   * HTML;
5. extrair os dados;
6. normalizar nomes;
7. relacionar instituição;
8. relacionar curso;
9. identificar modalidade;
10. identificar chamada;
11. validar nota;
12. persistir no banco;
13. registrar fonte;
14. registrar data da coleta.

---

# 7. SI SU 2026

Não assumir que um arquivo CSV de 2026 estará disponível.

O sistema deve verificar automaticamente se existe publicação oficial.

Fluxo:

```text
Consultar fontes oficiais
        ↓
Encontrou 2026?
   ┌────┴────┐
   │         │
  SIM       NÃO
   │         │
   ▼         ▼
Processar   Registrar
dados       indisponibilidade
   │
   ▼
Banco
```

Se 2026 ainda não estiver disponível em determinada fonte:

```text
não inventar dados
não gerar nota
não copiar 2025 como 2026
não apagar dados anteriores
```

Quando o MEC publicar o dado, uma nova execução da mineração deve conseguir importá-lo.

---

# 8. NOTA DE CORTE PARCIAL X HISTÓRICA

O banco deve diferenciar:

## Nota parcial

Valor divulgado durante o período de inscrições do processo seletivo.

Pode variar diariamente.

## Nota histórica/final

Valor consolidado após o encerramento do processo, quando disponível.

Criar campo:

```text
tipo_nota
```

com valores como:

```text
parcial
final
```

Se a fonte não permitir determinar isso com segurança:

```text
tipo_nota = "nao_identificado"
```

Não inventar.

---

# 9. ESTRUTURA RECOMENDADA PARA `notas_corte`

Manter compatibilidade com a tabela existente, mas acrescentar campos necessários.

Exemplo:

```sql
id
curso_id
ano
processo_seletivo
chamada
modalidade_acesso
nota_minima
tipo_nota
fonte_url
fonte_tipo
coletado_em
atualizado_em
```

Criar índice:

```sql
CREATE INDEX idx_notas_corte_busca
ON notas_corte(curso_id, ano, chamada, modalidade_acesso);
```

Criar restrição de unicidade adequada para impedir duplicação da mesma informação.

---

# 10. PROBLEMA COM FONTE DE TERCEIROS

O projeto atualmente utiliza um CSV hospedado em GitHub para dados do SiSU.

Isso não deve ser a fonte principal.

Se continuar sendo utilizado como fallback:

```text
fonte_tipo = "secundaria"
```

e a interface deve permitir saber que aquele dado não veio diretamente do MEC.

---

# 11. CATÁLOGO NACIONAL DE INSTITUIÇÕES

O sistema deve deixar de pensar em:

```text
8 instituições
```

e passar a trabalhar com:

```text
todas as instituições públicas encontradas nas fontes oficiais.
```

A mineração deve descobrir:

```text
Instituições
    ↓
Campi
    ↓
Cursos
```

---

# 12. INSTITUIÇÕES

A tabela `instituicoes` deve possuir, sempre que possível:

```text
id
codigo_ies
nome
sigla
categoria_administrativa
organizacao_academica
site
situacao
fonte_url
coletado_em
atualizado_em
```

Exemplos de categoria:

```text
federal
estadual
municipal
```

---

# 13. CAMPI

A tabela `campi` deve ser utilizada como entidade própria.

Estrutura mínima:

```text
id
instituicao_id
codigo_campus
nome
municipio
codigo_municipio_ibge
uf
endereco
site
latitude
longitude
fonte_url
coletado_em
atualizado_em
```

Relacionamento:

```text
instituicao 1 ─── N campi
```

---

# 14. CURSOS

A tabela `cursos` deve ser vinculada à instituição e, quando possível, ao campus.

Estrutura recomendada:

```text
id
instituicao_id
campus_id
codigo_curso
nome
grau
modalidade
turno
duracao_semestres
situacao
fonte_url
coletado_em
atualizado_em
```

---

# 15. FILTRO DE CURSOS

O sistema deve priorizar cursos de graduação.

Não misturar automaticamente:

* ensino médio;
* cursos técnicos;
* pós-graduação;
* extensão;
* cursos livres.

Especial atenção aos Institutos Federais.

Um IF pode possuir cursos:

```text
técnicos
tecnológicos
bacharelados
licenciaturas
pós-graduação
```

O catálogo de graduação deve apresentar somente os cursos definidos pelo escopo da aplicação.

---

# 16. IDENTIFICAÇÃO DE INSTITUIÇÕES PÚBLICAS

Não confiar somente no nome da instituição.

Utilizar, quando disponível:

```text
código oficial da IES
```

como identificador.

A normalização deve evitar situações como:

```text
Universidade Federal de Mato Grosso
UFMT

Universidade Fed. de Mato Grosso
UFMT - Cuiabá
```

serem tratadas como quatro instituições.

Devem representar a mesma IES quando os identificadores oficiais confirmarem isso.

---

# 17. DADOS DO INEP

Modificar:

```text
coletorINEP.js
```

para trabalhar com dados oficiais disponíveis do INEP.

O coletor deve identificar:

* instituição;
* código IES;
* campus;
* município;
* UF;
* curso;
* código do curso;
* grau;
* modalidade;
* situação.

Não confiar apenas em números escritos no README.

Após a mineração, o sistema deve calcular os números reais:

```text
quantidade de instituições
quantidade de campi
quantidade de cursos
```

e gerar relatório da execução.

---

# 18. NÚMEROS DO README

Remover afirmações rígidas como:

```text
2.600+ instituições
27.270 campi
46.317 cursos
```

como se fossem números permanentes.

Substituir por:

```text
O sistema calcula automaticamente a quantidade atual de registros
existentes no banco após cada mineração.
```

Se o README quiser mostrar estatísticas, usar:

```text
última execução:
X instituições
Y campi
Z cursos
```

---

# 19. CUSTO DE VIDA

Existe um problema conceitual importante.

O projeto atualmente chama:

```text
PIB per capita
```

de:

```text
custo de vida
```

Isso deve ser corrigido.

PIB per capita NÃO é custo de vida.

---

# 20. NOVA METODOLOGIA DE CUSTOS

A aplicação deve diferenciar:

### Dados reais de custo

Quando houver fonte adequada.

Exemplos:

* aluguel;
* transporte;
* alimentação;
* tarifas públicas;
* indicadores de preços.

### Indicadores econômicos

Exemplos:

* PIB per capita;
* renda;
* indicadores socioeconômicos.

Esses dados podem ajudar a contextualizar a cidade, mas devem ser apresentados como indicadores, e não como custo de vida real.

---

# 21. TABELA `custos_cidade`

Expandir para algo semelhante a:

```text
id
codigo_municipio_ibge
cidade
uf
moradia
alimentacao
transporte
outros
custo_estimado_total
mes_referencia
fonte_url
fonte_tipo
coletado_em
atualizado_em
```

Se um valor não estiver disponível:

```text
NULL
```

e não:

```text
0
```

porque:

```text
0 ≠ dado desconhecido
```

---

# 22. IBGE

O coletor deve utilizar fontes oficiais do IBGE quando aplicável.

Não apresentar automaticamente:

```text
PIB per capita = custo de vida
```

Se PIB per capita continuar sendo utilizado, apresentar claramente:

```text
Indicador econômico
```

---

# 23. AUXÍLIOS E BOLSAS

Não afirmar:

```text
10.742 auxílios para todas as instituições
```

sem comprovação.

O sistema deve diferenciar:

```text
encontrado
não encontrado
indisponível
```

A ausência de um registro não significa que a instituição não ofereça auxílio.

---

# 24. COLETOR DE AUXÍLIOS

Modificar:

```text
coletorAuxilios.js
```

para priorizar:

1. site oficial da instituição;
2. pró-reitoria de assistência estudantil;
3. editais oficiais;
4. páginas institucionais;
5. outras fontes públicas confiáveis.

Cada registro deve conter:

```text
instituicao_id
nome
tipo
descricao
url
fonte_url
coletado_em
```

---

# 25. MERCADO DE TRABALHO E ESTÁGIOS

A funcionalidade RF5 está atualmente pendente.

Implementar de forma conservadora.

Não inventar:

```text
salário médio
demanda
quantidade de vagas
```

quando não houver fonte confiável.

---

# 26. RF5 — ESTRUTURA

Criar possibilidade de armazenar:

```text
curso_id
regiao
cargo
demanda
salario_medio
vagas_estagio
fonte
fonte_url
periodo_referencia
coletado_em
```

Quando não houver dado:

```text
Dados indisponíveis
```

---

# 27. GROQ

O Groq NÃO deve ser utilizado como fonte de dados.

Ele deve ser utilizado somente para:

* normalização;
* classificação;
* desambiguação;
* interpretação de textos não estruturados.

Exemplo:

```text
"Engenharia de Software - Noturno"
```

pode ser normalizado.

Mas o Groq não deve receber a instrução:

```text
"qual é a nota de corte da UFMT?"
```

e ser utilizado como banco de dados.

---

# 28. REGRA PARA GROQ

O resultado do Groq deve obrigatoriamente ser estruturado em JSON.

Exemplo:

```json
{
  "sucesso": true,
  "resultado": {
    "nome_normalizado": "Engenharia de Software",
    "turno": "noturno",
    "confianca": 0.96
  }
}
```

Se a resposta não for válida:

```text
não salvar
```

---

# 29. LIMITES DO GROQ

Como o projeto utiliza recursos gratuitos:

* evitar chamadas desnecessárias;
* processar somente itens ambíguos;
* usar cache;
* não processar registros já normalizados;
* executar chamadas sequencialmente;
* implementar timeout;
* implementar retry limitado;
* não interromper toda a mineração se o Groq falhar.

Se o Groq estiver indisponível:

```text
continuar mineração
```

quando a normalização puder ser feita deterministicamente.

---

# 30. PERSISTÊNCIA

Criar ou manter:

```text
persistirMineracao.js
```

Todos os coletores devem utilizar persistência idempotente.

Executar a mineração duas vezes não pode duplicar os registros.

Usar:

```text
INSERT ... ON CONFLICT ...
```

ou estratégia equivalente.

---

# 31. HISTÓRICO

Não apagar automaticamente dados históricos.

Exemplo:

```text
SiSU 2023
SiSU 2024
SiSU 2025
SiSU 2026
```

devem coexistir.

Uma nova mineração atualiza somente a edição correspondente.

---

# 32. FONTE E DATA

Dados minerados devem possuir rastreabilidade.

Adicionar, quando aplicável:

```text
fonte_url
fonte_tipo
coletado_em
```

A interface deve mostrar algo como:

```text
Fonte: MEC
Coletado em: 04/09/2026
```

ou:

```text
Fonte: IBGE
Referência: 2025
```

Não apresentar data de coleta como se fosse data de referência do dado.

---

# 33. LOG DAS MINERAÇÕES

Manter:

```text
execucoes_mineracao
```

Campos:

```text
id
tipo
inicio
fim
status
registros_processados
registros_inseridos
registros_atualizados
registros_ignorados
erros
mensagem
```

Status:

```text
executando
sucesso
sucesso_com_alertas
erro
```

---

# 34. FALHA DE UMA FONTE

Se uma fonte falhar:

```text
não apagar dados antigos.
```

Exemplo:

```text
Banco possui SiSU 2025.

Coleta de SiSU 2026 falha.

Resultado:
SiSU 2025 continua disponível.
SiSU 2026 fica indisponível.
```

Nunca substituir dados válidos por `NULL` devido a uma falha de coleta.

---

# 35. API

Manter compatibilidade com os endpoints existentes.

Atualizar:

```text
GET /api/notas-corte
```

ou endpoints equivalentes para aceitar:

```text
ano
chamada
modalidade
tipo_nota
```

quando aplicável.

---

# 36. BUSCA NACIONAL

O endpoint:

```text
GET /api/busca
```

deve permitir pesquisar:

```text
nome do curso
nome da instituição
sigla
cidade
UF
categoria administrativa
modalidade
grau
```

Exemplo:

```text
/api/busca?nome=computacao&estado=MT
```

---

# 37. PAGINAÇÃO

Não carregar dezenas de milhares de cursos de uma vez.

Implementar:

```text
pagina
limite
```

Exemplo:

```text
/api/cursos?pagina=1&limite=20
```

Limite máximo recomendado:

```text
100
```

---

# 38. FRONTEND

Preservar:

```text
index.html
paginas/detalhes.html
paginas/favoritos.html
```

Melhorar para suportar a quantidade nacional de dados.

---

# 39. FILTROS DO FRONTEND

Adicionar, quando possível:

```text
Estado
Cidade
Instituição
Tipo de instituição
Curso
Grau
Modalidade
Turno
```

Não carregar todas as instituições em um único dropdown gigantesco.

Utilizar:

* busca;
* carregamento sob demanda;
* paginação;
* filtros dependentes.

---

# 40. DETALHES DO CURSO

A página de detalhes deve apresentar:

## Instituição

* nome;
* sigla;
* tipo;
* campus;
* cidade;
* UF;
* site oficial.

## Curso

* nome;
* grau;
* modalidade;
* turno;
* duração.

## Notas

* ano;
* processo;
* chamada;
* modalidade;
* nota;
* fonte;
* data.

## Cidade

* indicadores/custos disponíveis;
* período;
* fontes.

## Auxílios

* nome;
* tipo;
* descrição;
* link oficial.

## Mercado

* dados disponíveis;
* período;
* fonte.

---

# 41. DADOS AUSENTES

Nunca inventar dados.

Utilizar mensagens diferentes:

```text
Dados não disponíveis.
```

```text
Fonte não encontrada.
```

```text
Esta instituição não participou do SiSU nesta edição.
```

quando isso puder ser comprovado.

Não utilizar:

```text
R$ 0
nota 0
salário R$ 0
0 vagas
```

para representar ausência.

---

# 42. SISU NÃO REPRESENTA TODAS AS INSTITUIÇÕES PÚBLICAS

Essa regra deve ficar explícita no sistema.

Nem toda instituição pública necessariamente participa do SiSU.

Portanto:

```text
instituição pública
        ≠
instituição participante do SiSU
```

Se não houver nota de corte SiSU:

```text
Nota de corte SiSU indisponível.
```

Isso não significa que a instituição seja privada ou que não tenha processo seletivo.

---

# 43. PROUNI

O projeto atualmente menciona:

```text
SiSU e ProUni
```

Mas o escopo principal é de instituições públicas.

O ProUni é destinado a instituições privadas.

Portanto, revisar RF2.

Não apresentar ProUni como nota de corte de instituições públicas.

Se o projeto decidir manter informações do ProUni, tratar como módulo separado e claramente identificado.

Não misturar:

```text
SiSU
```

com:

```text
ProUni
```

---

# 44. BANCO DE DADOS

Manter:

```text
SQLite
better-sqlite3
WAL
Foreign Keys
Prepared Statements
```

Não trocar o banco.

Garantir relacionamentos:

```text
instituicoes
     │
     ├── campi
     │     └── cursos
     │
     └── auxilios_bolsas

cursos
     ├── notas_corte
     └── mercado_estagios

campi
     └── cidade

cidades
     └── custos
```

---

# 45. ÍNDICES

Garantir índices para:

```text
instituicoes.nome
instituicoes.sigla
instituicoes.uf
instituicoes.categoria_administrativa

campi.instituicao_id
campi.codigo_municipio_ibge

cursos.instituicao_id
cursos.campus_id
cursos.nome
cursos.codigo_curso

notas_corte.curso_id
notas_corte.ano

favoritos.sessao_usuario
```

---

# 46. MIGRAÇÃO DO BANCO

Não apagar o banco atual sem necessidade.

Criar migração para adicionar campos/tabelas.

Antes de executar:

```text
backup do banco
```

A migração deve ser repetível ou detectar estruturas já existentes.

---

# 47. SCRIPTS NPM

Atualizar os scripts.

Devem existir, no mínimo:

```bash
npm run dev

npm run minerar:instituicoes

npm run minerar:cursos

npm run minerar:sisu

npm run minerar:custos

npm run minerar:auxilios

npm run minerar:tudo

npm test
```

Opcionalmente:

```bash
npm run minerar:sisu -- --ano=2026
```

ou equivalente.

---

# 48. MINERAÇÃO COMPLETA

O comando:

```bash
npm run minerar:tudo
```

deve executar:

```text
1. instituições
2. campi
3. cursos
4. notas SiSU
5. custos/indicadores
6. auxílios
7. validação
8. relatório
```

Uma falha em uma etapa não deve destruir os dados das outras.

---

# 49. AGENDAMENTO

Implementar agendamento para atualização automática.

Sugestão:

```text
catálogo:
mensal

SiSU:
periódico durante período relevante
e atualização histórica após publicação de novos dados

custos:
mensal/trimestral conforme disponibilidade da fonte

auxílios:
semanal ou mensal

mercado:
periódico conforme fonte
```

O cron deve ser configurável por `.env`.

---

# 50. SCRAPING

Todo scraping deve:

* respeitar robots.txt quando aplicável;
* utilizar User-Agent identificável;
* evitar requisições excessivas;
* utilizar intervalo entre requisições;
* não executar scraping paralelo agressivo;
* utilizar cache;
* tratar timeout;
* tratar HTTP 404;
* tratar HTTP 429;
* tratar HTTP 500;
* registrar erro.

---

# 51. NÃO QUEBRAR POR UMA FONTE

Cada coletor deve ser independente.

Exemplo:

```text
INEP falhou
↓
SiSU ainda pode executar.

IBGE falhou
↓
SiSU ainda pode executar.

Groq falhou
↓
dados determinísticos continuam.
```

---

# 52. TESTES AUTOMATIZADOS

Implementar testes.

Cobrir no mínimo:

## Banco

* criação;
* foreign keys;
* índices;
* upsert;
* ausência de duplicação.

## API

* `/api/health`;
* `/api/busca`;
* `/api/instituicoes`;
* `/api/cursos`;
* notas;
* custos;
* favoritos.

## Mineração

* parser CSV;
* parser XLSX, se utilizado;
* normalização;
* validação;
* persistência;
* tratamento de erro;
* idempotência.

---

# 53. TESTE CRÍTICO DE IDEMPOTÊNCIA

Executar:

```bash
npm run minerar:tudo
```

duas vezes.

O número de registros duplicados deve ser:

```text
0
```

---

# 54. TESTE DE FALHA

Simular:

```text
fonte indisponível
```

Resultado esperado:

```text
execução registrada como erro/alerta
dados anteriores preservados
API continua funcionando
```

---

# 55. TESTE DE SI SU

Testar pelo menos:

```text
2023
2024
2025
2026
```

Quando determinado ano não possuir arquivo oficial disponível:

```text
não criar dados falsos
```

Quando houver arquivo:

```text
importar automaticamente
```

---

# 56. TESTE DE INSTITUIÇÃO PÚBLICA

Testar instituições:

* federal;
* estadual;
* municipal;
* instituto federal.

Confirmar:

```text
instituição
→ campus
→ curso
```

---

# 57. README

Depois das alterações, atualizar completamente o `README.md`.

Remover informações falsas ou rígidas.

Não afirmar:

```text
4.643 notas de corte do SiSU 2023
```

como característica permanente.

Substituir por explicação do sistema de mineração histórica.

---

# 58. README — ESTATÍSTICAS

As estatísticas devem ser geradas automaticamente.

Exemplo:

```text
Última atualização dos dados:

Instituições: X
Campi: Y
Cursos: Z
Notas de corte: W
Municípios: N
```

---

# 59. README — FONTES

Documentar claramente:

```text
INEP
MEC
SiSU
IBGE
sites oficiais das instituições
outras fontes públicas utilizadas
```

Para cada fonte:

```text
nome
tipo
finalidade
URL
frequência
```

---

# 60. VARIÁVEIS DE AMBIENTE

Atualizar `.env.example`.

Incluir:

```env
PORT=3000
ORIGEM_PERMITIDA=*

GROQ_API_KEY=
GROQ_MODEL=

CRON_HABILITADO=true
CRON_SISU=
CRON_CUSTOS=
CRON_AUXILIOS=
CRON_MERCADO=

USER_AGENT_MINERACAO=IngressoUniversitario/1.0
```

Nunca colocar API key no Git.

---

# 61. SEGURANÇA

Manter:

```text
Helmet
CORS
prepared statements
validação
escape HTML
limite de payload
tratamento global de erros
```

Nunca retornar:

```text
stack trace
```

ao usuário.

---

# 62. PERFORMANCE

A busca nacional deve continuar rápida.

Meta:

```text
resposta normal ≤ 2 segundos
```

Para isso:

* índices;
* paginação;
* queries eficientes;
* prepared statements;
* evitar SELECT gigantes;
* evitar carregar banco inteiro na memória.

---

# 63. FRONTEND — RESPONSIVIDADE

Garantir:

```text
desktop
tablet
celular
```

---

# 64. ACESSIBILIDADE

Manter:

```text
WCAG AA
ARIA
navegação por teclado
focus-visible
contraste
labels
mensagens de erro
estados de carregamento
```

---

# 65. FAVORITOS

Manter o funcionamento atual com:

```text
localStorage
sessao_usuario
API
```

Não exigir cadastro de usuário.

---

# 66. TRATAMENTO DE DADOS

Todo dado externo deve passar por:

```text
COLETA
 ↓
PARSE
 ↓
NORMALIZAÇÃO
 ↓
VALIDAÇÃO
 ↓
DEDUPLICAÇÃO
 ↓
PERSISTÊNCIA
 ↓
LOG
```

Nunca:

```text
COLETA → BANCO
```

sem validação.

---

# 67. VALIDAÇÃO

Validar:

## Nota

```text
nota >= 0
nota <= 1000
```

quando aplicável à escala do processo.

## Ano

```text
ano >= 2010
ano <= ano atual + margem futura
```

## Instituição

Deve possuir identificação válida.

## Curso

Deve possuir nome válido.

---

# 68. NORMALIZAÇÃO

Criar funções reutilizáveis para:

```text
normalizarNomeInstituicao()
normalizarNomeCurso()
normalizarUF()
normalizarCidade()
normalizarTurno()
normalizarModalidade()
normalizarGrau()
```

Não duplicar essa lógica em cada coletor.

---

# 69. DADOS OFICIAIS X DADOS ESTIMADOS

A interface deve distinguir:

### Oficial

Dado publicado por órgão/instituição oficial.

### Secundário

Dado obtido de fonte pública não oficial.

### Estimado

Valor calculado pelo sistema.

### Indisponível

Nenhuma informação confiável encontrada.

---

# 70. BADGES

Os badges existentes devem continuar.

Exemplo:

```text
Fonte oficial
Fonte secundária
Estimativa
Atualizado em...
```

---

# 71. NÃO INVENTAR DADOS

Esta regra é obrigatória.

Se não houver informação:

```text
null
```

ou:

```text
indisponível
```

Nunca gerar um valor plausível apenas para preencher a tela.

O Groq também não pode inventar dados.

---

# 72. CRITÉRIOS DE CONCLUSÃO

O projeto só pode ser considerado finalizado quando:

* [ ] catálogo nacional funcionando;
* [ ] instituições federais funcionando;
* [ ] instituições estaduais funcionando;
* [ ] instituições municipais funcionando quando presentes nas fontes;
* [ ] IFs funcionando;
* [ ] campi funcionando;
* [ ] cursos de graduação funcionando;
* [ ] SiSU histórico por múltiplos anos;
* [ ] sistema preparado para 2026;
* [ ] sistema preparado para anos futuros;
* [ ] fonte oficial priorizada;
* [ ] fontes secundárias identificadas;
* [ ] custos corretamente classificados;
* [ ] PIB não apresentado como custo de vida;
* [ ] auxílios sem afirmações falsas;
* [ ] RF5 implementado ou claramente marcado como indisponível quando não houver fonte;
* [ ] Groq utilizado somente quando necessário;
* [ ] persistência idempotente;
* [ ] logs de mineração;
* [ ] fallback;
* [ ] dados antigos preservados;
* [ ] testes automatizados;
* [ ] README atualizado;
* [ ] `.env.example` atualizado;
* [ ] frontend responsivo;
* [ ] acessibilidade mantida;
* [ ] API funcionando;
* [ ] favoritos funcionando;
* [ ] projeto executável do zero.

---

# 73. CRITÉRIO FINAL DE ACEITAÇÃO

Executar:

```bash
npm install
npm run minerar:tudo
npm test
npm run dev
```

O sistema deve:

1. iniciar sem erro;
2. conectar ao SQLite;
3. possuir catálogo público nacional disponível conforme as fontes;
4. permitir pesquisar instituições;
5. permitir pesquisar cursos;
6. mostrar campus/cidade;
7. mostrar notas históricas quando disponíveis;
8. mostrar fonte e data;
9. mostrar custos/indicadores corretamente identificados;
10. mostrar auxílios quando encontrados;
11. mostrar mercado quando houver dados;
12. permitir favoritos;
13. não quebrar quando uma fonte externa estiver indisponível;
14. não duplicar registros ao executar a mineração novamente.

---

# 74. REGRA PARA O AGENTE DE CÓDIGO

Você está trabalhando em um projeto existente.

**Não faça uma reescrita completa.**

Primeiro:

```text
1. inspecione o repositório;
2. identifique o estado real;
3. execute o projeto;
4. identifique o que já funciona;
5. faça backup/migração segura;
6. implemente as alterações;
7. execute os testes;
8. execute a mineração;
9. verifique o banco;
10. verifique a API;
11. verifique o frontend;
12. atualize a documentação.
```

Se alguma funcionalidade já estiver corretamente implementada:

```text
MANTER.
```

Se estiver parcialmente implementada:

```text
CORRIGIR.
```

Se estiver ausente:

```text
IMPLEMENTAR.
```

---

# 75. ORDEM OBRIGATÓRIA DE IMPLEMENTAÇÃO

Para evitar quebrar o sistema, seguir esta ordem:

```text
FASE 1
Análise do projeto atual

↓

FASE 2
Backup + migração do banco

↓

FASE 3
Instituições + campi + cursos nacionais

↓

FASE 4
Sistema histórico de notas SiSU

↓

FASE 5
Custos/indicadores

↓

FASE 6
Auxílios

↓

FASE 7
Mercado e estágios

↓

FASE 8
API

↓

FASE 9
Frontend

↓

FASE 10
Mineração automática + cron

↓

FASE 11
Testes

↓

FASE 12
Documentação

↓

FASE 13
Validação final
```

---

# 76. RESULTADO ESPERADO

Ao final, o **Ingresso Universitário** deve ser uma plataforma nacional capaz de responder:

> “Quais instituições públicas oferecem este curso, onde ficam seus campi, quais são as modalidades disponíveis, quais notas históricas de seleção estão disponíveis, quais custos/indicadores existem naquela cidade e quais auxílios e oportunidades estão disponíveis?”

A aplicação deve utilizar dados reais sempre que possível, indicar claramente suas fontes e nunca preencher informações desconhecidas com dados inventados.

O sistema deve ser preparado para continuar funcionando e recebendo novos dados nos próximos anos **sem precisar alterar manualmente o código para cada novo ano do SiSU ou para cada nova instituição**.

---

# 77. DEFINIÇÃO DE “PRONTO”

O projeto estará pronto quando a equipe puder clonar o repositório, executar:

```bash
npm install
npm run minerar:tudo
npm test
npm run dev
```

e utilizar o sistema sem precisar:

* editar arquivos de código para inserir instituições;
* inserir notas de corte manualmente;
* inserir cursos manualmente;
* inserir cidades manualmente;
* alterar o código para mudar o ano do SiSU;
* inserir dados falsos para preencher campos;
* modificar consultas SQL manualmente.

**A manutenção deve ocorrer pela execução dos coletores e pela atualização das fontes, não pela edição manual do banco.**

---

# FIM DA ESPECIFICAÇÃO
