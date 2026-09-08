# PLANO DE IMPLEMENTAÇÃO — Ingresso Universitário

## Objetivo

Implementar as três pendências atuais do projeto:

1. Integração com APIs/fontes externas para dados do SiSU e IBGE;
2. Testes automatizados;
3. Preparação e execução do deploy em produção.

Este documento deve ser usado pelo OpenCode como **plano de execução técnica**.

> Regra principal: antes de implementar qualquer item, inspecionar o código real e confirmar como a funcionalidade atual está estruturada. Não assumir que a documentação representa 100% do estado atual.

---

# 1. Integração com APIs externas — SiSU e IBGE

## Objetivo

Substituir ou complementar os dados de demonstração com integração externa, mantendo a arquitetura existente.

A documentação atual já prevê os serviços:

```text
api/src/servicos/
├── integracaoSisu.js
└── integracaoCustoVida.js
```

A implementação deve preservar essa separação.

## 1.1 Auditoria antes da implementação

Verificar:

- conteúdo atual de `integracaoSisu.js`;
- conteúdo atual de `integracaoCustoVida.js`;
- modelos relacionados;
- estrutura das tabelas `notas_corte` e `custos_cidade`;
- seed atual;
- endpoints que consomem esses dados;
- existência de `fetch`, Axios ou outro cliente HTTP;
- variáveis de ambiente existentes;
- tratamento de erros;
- fallback `dadosDemo.js`.

Classificar o estado encontrado antes de alterar.

## 1.2 Integração SiSU

### Requisito

Criar uma camada de integração responsável por obter dados externos de notas de corte quando uma fonte oficial/API adequada estiver disponível.

Não colocar chamadas HTTP diretamente em:

- controladores;
- modelos;
- arquivos de rota;
- frontend.

O fluxo esperado é:

```text
Rota
  ↓
Controlador
  ↓
Serviço de integração
  ↓
Fonte/API externa
  ↓
Normalização
  ↓
Modelo
  ↓
SQLite
```

### Regras

- Não inventar endpoint de API.
- Não inventar formato de resposta.
- Não gravar dados externos sem validação.
- Registrar a fonte dos dados quando possível.
- Registrar data/hora de atualização.
- Tratar timeout.
- Tratar HTTP 4xx/5xx.
- Tratar resposta inválida.
- Não deixar indisponibilidade da API externa derrubar toda a aplicação.
- Manter os dados locais como fallback quando apropriado.

### Normalização

A integração deve transformar o formato externo para o formato interno usado pela tabela:

```text
notas_corte
├── id
├── curso_id
├── modalidade_acesso
├── ano
├── chamada
└── nota_minima
```

Se a fonte externa não fornecer correspondência segura com um curso/instituição existente, não associar automaticamente.

Marcar o registro como não processado ou registrar o motivo no log, conforme a arquitetura existente.

## 1.3 Integração IBGE / custos de cidade

### Objetivo

Usar fonte oficial do IBGE para dados que possam ser obtidos por sua API e que sejam pertinentes ao sistema.

Importante:

> IBGE não deve ser tratado automaticamente como fonte de todos os custos de vida. Primeiro verificar quais indicadores oficiais realmente estão disponíveis e quais correspondem ao requisito de custos.

O sistema atualmente possui:

```text
custos_cidade
├── cidade
├── estado
├── moradia
├── alimentacao
├── transporte
├── outros
└── mes_referencia
```

Não preencher campos artificialmente apenas porque a API não fornece aquele indicador.

Quando não houver dado oficial correspondente:

```text
NÃO DISPONÍVEL
```

ou manter o dado local já existente, dependendo da regra definida no serviço.

## 1.4 Configuração

Credenciais, URLs e configurações externas devem ficar fora do código.

Exemplo conceitual:

```env
PORT=3000
ORIGEM_PERMITIDA=*
SISU_API_URL=
IBGE_API_URL=
```

Não commitar:

- tokens;
- chaves;
- senhas;
- credenciais;
- `.env` real.

Criar/atualizar `.env.example` com valores fictícios ou vazios.

## 1.5 Resiliência

As integrações devem possuir:

- timeout;
- tratamento de erro;
- validação de resposta;
- logs;
- fallback;
- comportamento previsível quando a fonte estiver indisponível.

Evitar loops de retry agressivos.

## 1.6 Atualização dos dados

Criar mecanismo explícito de atualização.

Pode ser:

```text
Atualização manual
        ou
Job agendado
        ↓
Serviço externo
        ↓
Validação
        ↓
Normalização
        ↓
Banco
```

Não adicionar scheduler complexo sem necessidade.

Se a aplicação ainda não possuir mecanismo de tarefas, começar com uma função/serviço reutilizável e um comando administrativo simples.

---

# 2. Testes automatizados

## Objetivo

Criar uma suíte de testes que proteja:

- modelos;
- serviços;
- endpoints;
- validações;
- regras principais do frontend quando possível.

## 2.1 Primeiro passo

Inspecionar:

- `package.json`;
- scripts existentes;
- estrutura atual;
- possibilidade de testar SQLite em banco temporário;
- existência de funções puras reutilizáveis.

Escolher uma ferramenta compatível com Node.js e a estrutura atual, evitando adicionar dependências desnecessárias.

## 2.2 Prioridade de testes

### P0 — obrigatório

Testar:

- conexão/configuração do banco;
- modelos principais;
- RF1 — busca;
- RF2 — notas de corte;
- RF3 — custos;
- RF4 — bolsas/auxílios;
- RF5 — mercado/estágios;
- RF6 — favoritos;
- `/api/health`;
- validações;
- tratamento de erros.

### P1

Testar:

- serviços de integração;
- normalização de dados externos;
- fallback quando APIs externas falham;
- segurança de entradas;
- casos de dados vazios.

### P2

Testar:

- componentes utilitários do frontend;
- funções como `formatarMoeda`, `debounce`, `escapeHTML`;
- fluxos de interface que sejam facilmente automatizáveis.

## 2.3 Casos mínimos

### Busca

Testar:

- busca sem filtros;
- filtro por nome;
- filtro por cidade;
- filtro por estado;
- combinação de filtros;
- nenhum resultado;
- entrada inválida.

### Curso

Testar:

- curso existente;
- curso inexistente;
- detalhes completos;
- notas;
- bolsas;
- mercado;
- custos relacionados.

### Favoritos

Testar:

- criar favorito;
- listar favoritos;
- remover favorito;
- evitar duplicação, caso essa seja a regra existente;
- sessão inexistente;
- curso inexistente.

### Segurança

Testar:

- entrada com caracteres especiais;
- parâmetros inválidos;
- tentativa de injeção SQL;
- payload acima do limite;
- erros sem exposição de stack trace.

## 2.4 Integrações externas

Os testes não devem depender da disponibilidade real de APIs externas.

Usar mocks/stubs para:

```text
API externa
    ↓
mock
    ↓
serviço de integração
```

Testar:

- resposta válida;
- resposta vazia;
- resposta inválida;
- timeout;
- HTTP 4xx;
- HTTP 5xx.

## 2.5 Critério de conclusão

Considerar os testes implementados quando:

```text
npm test
```

ou o comando definido no `package.json` executar a suíte sem erro.

Registrar:

- quantidade de testes;
- quantidade aprovados;
- quantidade falhos;
- cobertura, se configurada;
- limitações conhecidas.

---

# 3. Deploy em produção

## Objetivo

Preparar o projeto para execução real em ambiente de produção.

## 3.1 Auditoria

Antes do deploy, verificar:

- `package.json`;
- scripts de produção;
- porta configurável;
- `.env`;
- CORS;
- armazenamento do SQLite;
- diretórios persistentes;
- logs;
- tratamento de erros;
- build do frontend, se necessário;
- dependências;
- Node.js suportado.

## 3.2 Requisitos de produção

Garantir:

- configuração por variável de ambiente;
- `NODE_ENV=production`, quando utilizado;
- CORS configurado corretamente;
- secrets fora do Git;
- banco persistente;
- backups do SQLite;
- logs;
- health check;
- tratamento de erros;
- processo reiniciável;
- HTTPS quando houver proxy/plataforma responsável por TLS.

## 3.3 SQLite

Como o projeto usa SQLite:

```text
db/
└── banco.sqlite
```

é obrigatório confirmar que o ambiente de produção possui armazenamento persistente.

Não colocar o banco em filesystem efêmero sem estratégia de persistência.

Definir:

- localização do banco;
- backup;
- restauração;
- permissões;
- migração/seed.

## 3.4 Endpoint de saúde

Garantir:

```http
GET /api/health
```

retornando sucesso quando:

- aplicação está ativa;
- banco pode ser acessado.

Se houver integração externa obrigatória para o funcionamento, definir claramente se ela deve ou não fazer parte do health check.

## 3.5 Deploy

A plataforma de hospedagem deve ser escolhida após verificar compatibilidade com:

- Node.js;
- Express;
- SQLite persistente;
- armazenamento de arquivos;
- execução contínua do servidor.

Não escolher uma plataforma apenas por popularidade.

## 3.6 Checklist de produção

Antes de considerar o deploy concluído:

- [ ] variáveis de ambiente configuradas;
- [ ] secrets não estão no Git;
- [ ] banco persistente;
- [ ] backup definido;
- [ ] CORS configurado;
- [ ] health check funcionando;
- [ ] API funcionando;
- [ ] frontend funcionando;
- [ ] favoritos funcionando;
- [ ] logs funcionando;
- [ ] erros não expõem stack trace;
- [ ] integrações externas configuradas;
- [ ] HTTPS;
- [ ] teste pós-deploy executado.

---

# 4. Ordem recomendada de implementação

Não implementar tudo simultaneamente.

## Fase 1 — Auditoria

1. Inspecionar projeto real.
2. Confirmar estado das integrações.
3. Confirmar estado dos testes.
4. Confirmar estado para produção.
5. Gerar relatório de auditoria.

## Fase 2 — Testes

Implementar primeiro os testes da aplicação atual.

Motivo:

> os testes criam uma rede de segurança antes das alterações nas integrações e no deploy.

## Fase 3 — Integrações

1. Implementar serviço SiSU.
2. Implementar serviço relacionado ao IBGE.
3. Criar normalização.
4. Criar validação.
5. Criar fallback.
6. Criar testes dos serviços.
7. Integrar com modelos/banco.
8. Testar endpoints.

## Fase 4 — Produção

1. Corrigir configuração de produção.
2. Garantir persistência do SQLite.
3. Configurar ambiente.
4. Configurar CORS.
5. Configurar logs.
6. Fazer deploy.
7. Executar smoke tests.
8. Registrar resultado.

---

# 5. Critérios gerais de aceite

A implementação será considerada concluída somente quando:

### Integrações

- [ ] SiSU integrado de forma segura ou documentado claramente o bloqueio técnico caso não exista uma fonte adequada disponível.
- [ ] IBGE integrado somente para indicadores realmente suportados.
- [ ] Dados externos validados.
- [ ] Erros externos tratados.
- [ ] Fallback funcionando.
- [ ] Testes dos serviços funcionando.

### Testes

- [ ] Testes automatizados executáveis por comando.
- [ ] RF1–RF6 cobertos pelos testes relevantes.
- [ ] Erros e validações testados.
- [ ] Integrações externas mockadas.
- [ ] Resultado documentado.

### Deploy

- [ ] Aplicação executando em produção.
- [ ] Banco persistente.
- [ ] Variáveis de ambiente configuradas.
- [ ] Health check funcionando.
- [ ] HTTPS.
- [ ] Logs.
- [ ] Backup definido.
- [ ] Smoke test pós-deploy.

---

# 6. Regras para o OpenCode

1. Não reescrever o projeto inteiro.
2. Não trocar a stack sem autorização.
3. Não remover RF1–RF6.
4. Não inventar APIs externas.
5. Não inventar dados.
6. Não colocar chamadas externas nos controladores.
7. Não colocar secrets no código.
8. Não depender de API externa nos testes automatizados.
9. Não considerar deploy concluído sem testar a aplicação.
10. Registrar cada alteração.
11. Atualizar documentação quando houver alteração estrutural.
12. Se algo não puder ser verificado, marcar como `NÃO VERIFICADO`.
13. Se uma integração oficial não estiver disponível ou não puder ser confirmada, não fabricar uma implementação: documentar a limitação e propor uma alternativa tecnicamente segura.

---

# 7. Entregáveis esperados

Ao terminar a implementação, devem existir:

```text
Código atualizado
+
Testes automatizados
+
Configuração de produção
+
Integrações externas
+
Documentação atualizada
+
TESTE_DA_IMPLEMENTACAO.md
```

O `TESTE_DA_IMPLEMENTACAO.md` deve registrar os testes realizados e seus resultados.
