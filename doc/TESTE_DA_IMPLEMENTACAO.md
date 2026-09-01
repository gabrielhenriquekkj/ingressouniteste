# TESTE DA IMPLEMENTAÇÃO — Ingresso Universitário

## Objetivo

Registrar e validar a implementação das três pendências:

1. Integração com APIs/fontes externas;
2. Testes automatizados;
3. Deploy em produção.

Este arquivo deve ser atualizado pelo OpenCode **depois de cada etapa de implementação**.

> Não marcar um item como concluído sem evidência de execução.

---

# 1. Identificação da implementação

**Data:**

**Commit/versão:**

**Responsável:**

**Ambiente:**
- [ ] Desenvolvimento
- [ ] Staging
- [ ] Produção

---

# 2. Teste da integração SiSU

## 2.1 Configuração

- [ ] URL/fonte externa configurada por variável de ambiente.
- [ ] Nenhuma credencial está hardcoded.
- [ ] `.env` não está versionado.
- [ ] `.env.example` está atualizado.

## 2.2 Testes

### Resposta válida

**Esperado:** dados externos são recebidos, validados e normalizados.

**Resultado:**

```text
[ ] PASSOU
[ ] FALHOU
```

**Evidência/log:**

### Resposta vazia

**Esperado:** aplicação não quebra e trata ausência de dados.

```text
[ ] PASSOU
[ ] FALHOU
```

**Evidência:**

### Resposta inválida

**Esperado:** dados inválidos não são gravados no banco.

```text
[ ] PASSOU
[ ] FALHOU
```

### Timeout

**Esperado:** timeout tratado sem derrubar a API.

```text
[ ] PASSOU
[ ] FALHOU
```

### HTTP 4xx/5xx

```text
[ ] PASSOU
[ ] FALHOU
```

## 2.3 Persistência

Verificar:

- [ ] registros possuem curso correspondente;
- [ ] ano está correto;
- [ ] chamada está correta;
- [ ] nota mínima está válida;
- [ ] fonte/data de atualização são preservadas quando aplicável.

---

# 3. Teste da integração IBGE

## 3.1 Configuração

- [ ] Fonte/API configurada por variável de ambiente.
- [ ] URL confirmada.
- [ ] Nenhuma informação inventada.
- [ ] Indicadores utilizados são realmente fornecidos pela fonte.

## 3.2 Testes

### Cidade válida

```text
[ ] PASSOU
[ ] FALHOU
```

### Cidade inexistente

```text
[ ] PASSOU
[ ] FALHOU
```

### Resposta inválida

```text
[ ] PASSOU
[ ] FALHOU
```

### API indisponível

```text
[ ] PASSOU
[ ] FALHOU
```

### Timeout

```text
[ ] PASSOU
[ ] FALHOU
```

## 3.3 Dados

Confirmar:

- [ ] cidade;
- [ ] estado;
- [ ] indicador;
- [ ] período/referência;
- [ ] fonte.

Não preencher `moradia`, `alimentacao`, `transporte` ou `outros` com valores que a fonte não forneça.

---

# 4. Testes automatizados da API

Executar o comando definido no projeto, por exemplo:

```bash
npm test
```

**Comando realmente utilizado:**

```text
[preencher]
```

## Resultado

**Total de testes:**

**Passaram:**

**Falharam:**

**Ignorados:**

**Cobertura, se disponível:**

---

# 5. Testes RF1–RF6

## RF1 — Busca

- [ ] busca sem filtros;
- [ ] busca por nome;
- [ ] busca por cidade;
- [ ] busca por estado;
- [ ] combinação de filtros;
- [ ] nenhum resultado;
- [ ] entrada inválida.

**Resultado:** `PASSOU / FALHOU`

---

## RF2 — Notas de corte

- [ ] curso existente;
- [ ] curso inexistente;
- [ ] notas existentes;
- [ ] notas inexistentes;
- [ ] filtro por ano/chamada, se implementado;
- [ ] resposta HTTP correta.

**Resultado:** `PASSOU / FALHOU`

---

## RF3 — Custos

- [ ] cidade existente;
- [ ] cidade inexistente;
- [ ] dados válidos;
- [ ] ausência de dados tratada;
- [ ] formato monetário correto.

**Resultado:** `PASSOU / FALHOU`

---

## RF4 — Bolsas e auxílios

- [ ] instituição existente;
- [ ] auxílios encontrados;
- [ ] nenhum auxílio;
- [ ] links externos tratados corretamente.

**Resultado:** `PASSOU / FALHOU`

---

## RF5 — Mercado e estágios

- [ ] curso existente;
- [ ] dados encontrados;
- [ ] nenhum dado;
- [ ] salário formatado;
- [ ] demanda tratada.

**Resultado:** `PASSOU / FALHOU`

---

## RF6 — Favoritos

- [ ] adicionar;
- [ ] listar;
- [ ] remover;
- [ ] sessão válida;
- [ ] sessão inválida;
- [ ] curso inválido;
- [ ] persistência.

**Resultado:** `PASSOU / FALHOU`

---

# 6. Testes de segurança

## SQL Injection

Entrada de teste:

```text
[preencher sem usar dados reais/sensíveis]
```

Resultado:

```text
[ ] PASSOU
[ ] FALHOU
```

## XSS

Testar entradas com caracteres HTML/script.

Resultado:

```text
[ ] PASSOU
[ ] FALHOU
```

## Payload

Testar limite de 10kb.

```text
[ ] PASSOU
[ ] FALHOU
```

## Erros

Confirmar que respostas 400/404/500 não expõem stack trace.

```text
[ ] PASSOU
[ ] FALHOU
```

---

# 7. Testes de integração externa com mock

Os testes automatizados não devem depender de APIs reais.

### Cenários

| Cenário | Resultado |
|---|---|
| API retorna dados válidos | PASSOU/FALHOU |
| API retorna vazio | PASSOU/FALHOU |
| API retorna JSON inválido | PASSOU/FALHOU |
| API retorna 400 | PASSOU/FALHOU |
| API retorna 500 | PASSOU/FALHOU |
| API demora além do timeout | PASSOU/FALHOU |
| API indisponível | PASSOU/FALHOU |

---

# 8. Teste do frontend

## Busca

- [ ] filtros funcionam;
- [ ] debounce funciona;
- [ ] loading aparece;
- [ ] estado vazio aparece;
- [ ] erro aparece;
- [ ] resultados são exibidos.

## Detalhes

- [ ] curso abre corretamente;
- [ ] abas funcionam;
- [ ] notas carregam;
- [ ] custos carregam;
- [ ] bolsas carregam;
- [ ] mercado carrega.

## Favoritos

- [ ] favoritar;
- [ ] desfavoritar;
- [ ] página de favoritos;
- [ ] persistência;
- [ ] estado vazio.

## Acessibilidade

- [ ] teclado;
- [ ] focus-visible;
- [ ] aria-label;
- [ ] contraste;
- [ ] estados de loading/erro/vazio.

---

# 9. Teste de produção

## Configuração

- [ ] aplicação inicia em modo produção;
- [ ] variáveis de ambiente carregadas;
- [ ] CORS correto;
- [ ] secrets fora do código;
- [ ] banco persistente.

## Health check

```http
GET /api/health
```

Resultado esperado:

```text
HTTP 200
```

Resultado real:

```text
[preencher]
```

---

# 10. Smoke test pós-deploy

Executar em produção:

### API

- [ ] `/api/health`
- [ ] `/api/busca`
- [ ] `/api/instituicoes`
- [ ] `/api/cursos`
- [ ] `/api/favoritos`

### Frontend

- [ ] Home
- [ ] Busca
- [ ] Detalhes
- [ ] Favoritos

### Banco

- [ ] leitura;
- [ ] escrita;
- [ ] persistência após reinício.

---

# 11. Teste de persistência do SQLite

Procedimento:

1. Criar/alterar um registro permitido.
2. Reiniciar a aplicação.
3. Consultar novamente.
4. Confirmar que o dado permanece.

Resultado:

```text
[ ] PASSOU
[ ] FALHOU
```

Se o ambiente for efêmero:

```text
STATUS: BLOQUEADO
MOTIVO:
```

---

# 12. Teste de backup

Confirmar:

- [ ] backup configurado;
- [ ] backup pode ser criado;
- [ ] arquivo de backup pode ser recuperado;
- [ ] restauração foi testada.

Resultado:

```text
[ ] PASSOU
[ ] FALHOU
```

---

# 13. Resultado final

## Integrações

```text
SiSU:   [ ] PASSOU  [ ] FALHOU  [ ] BLOQUEADO
IBGE:   [ ] PASSOU  [ ] FALHOU  [ ] BLOQUEADO
```

## Testes automatizados

```text
[ ] PASSOU
[ ] FALHOU
```

## Deploy

```text
[ ] PASSOU
[ ] FALHOU
[ ] BLOQUEADO
```

## Smoke test

```text
[ ] PASSOU
[ ] FALHOU
```

---

# 14. Resumo de falhas

| ID | Problema | Severidade | Arquivo | Status |
|---|---|---|---|---|
| | | P0/P1/P2 | | |

---

# 15. Critério final de aprovação

A implementação só pode ser considerada **CONCLUÍDA** quando:

- [ ] integração SiSU validada ou bloqueio técnico documentado;
- [ ] integração IBGE validada ou bloqueio técnico documentado;
- [ ] testes automatizados executando;
- [ ] RF1–RF6 testadas;
- [ ] segurança testada;
- [ ] frontend testado;
- [ ] produção funcionando;
- [ ] SQLite persistente;
- [ ] backup definido/testado;
- [ ] smoke test executado;
- [ ] falhas P0 resolvidas.

## Status final

```text
[ ] IMPLEMENTAÇÃO APROVADA
[ ] IMPLEMENTAÇÃO APROVADA COM RESSALVAS
[ ] IMPLEMENTAÇÃO NÃO APROVADA
```

## Observações finais

```text
[preencher pelo OpenCode]
```
