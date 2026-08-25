exec# Plano de Correcao — Revisão Completa do Sistema

**Data da revisão:** 2026-08-25
**Metodologia:** Análise manual de todo o código (backend + frontend + consistência entre camadas)
**Total de problemas encontrados:** 42

---

## Resumo Executivo

| Severidade | Quantidade | Descrição |
|------------|-----------|-----------|
| **Crítica** | 6 | Bugs que causam perda de dados, falhas de segurança ou quebram funcionalidade |
| **Alta** | 12 | Inconsistências de contrato, código morto, erros lógicos |
| **Média** | 14 | Melhorias de qualidade, padronização, acessibilidade |
| **Baixa** | 10 | Estilo, redundâncias, otimizações menores |

---

## Erros Críticos (Corrigir IMEDIATAMENTE)

### C1. DELETE de favorito sem autorização — frontend não envia `sessao_usuario`
- **Arquivo:** `frontend/js/favoritos.js:101`
- **Problema:** A chamada `api('DELETE', '/favoritos/' + favorito.id)` não envia `?sessao_usuario=...`. O backend em `favoritoControlador.js:51-53` só verifica ownership se `sessao` estiver presente. Sem ele, **qualquer pessoa pode deletar qualquer favorito** pelo ID.
- **Correção:** Enviar a sessão: `api('DELETE', '/favoritos/' + favorito.id + '?sessao_usuario=' + encodeURIComponent(obterSessao()))`

### C2. ID do favorito nunca é capturado da API — DELETE sync quebrado
- **Arquivo:** `frontend/js/favoritos.js:69, 85-89`
- **Problema:** `adicionarFavorito()` faz POST à API e recebe `{ dados: { id: ... } }`, mas **nunca lê a resposta**. O favorito local fica com `id: Date.now()` (13 dígitos). A condição `String(favorito.id).length < 15` na linha 100 passa (13 < 15), então tenta DELETE com ID inexistente → 404 silencioso.
- **Correção:** Capturar a resposta da API e atualizar o ID local:
  ```javascript
  const resp = await api('POST', '/favoritos', {...})
  if (resp && resp.dados && resp.dados.id) {
    favoritoLocal.id = resp.dados.id
    salvarFavoritosLocal(lista)
  }
  ```

### C3. `<button>` dentro de `<a>` — elemento interativo aninhado
- **Arquivo:** `frontend/js/componentes.js:20-48`
- **Problema:** O `cardResultado()` renderiza um `<button data-favoritar>` **dentro** de um `<a>`. Padrão HTML proíbe contenido interativo dentro de outro contenido interativo. Causa comportamento imprevisível em screen readers e alguns browsers.
- **Correção:** Trocar o `<a>` por `<div>` com `onclick` ou mover o botão para fora do link.

### C4. Animação de remoção de card nunca funciona — `data-curso-id` inexistente
- **Arquivo:** `frontend/js/favoritos.js:146-158`
- **Problema:** A animação depende de `alvo.closest('[data-curso-id]')`, mas `cardResultado()` em `componentes.js:20` nunca gera um atributo `data-curso-id`. `cartao` é sempre `null` e a animação nunca executa.
- **Correção:** Adicionar `data-curso-id="' + curso.id + '"` no elemento wrapper do card em `cardResultado()`.

### C5. Busca não inclui `sigla` —pesquisa por "UFMT" retorna vazio
- **Arquivo:** `api/src/modelos/cursoModelo.js:13`
- **Problema:** O SQL busca `c.nome LIKE ? OR i.nome LIKE ?`, mas **não inclui `i.sigla`**. Digitar "UFMT", "IFMT" etc. na busca retorna zero resultados da API, mesmo que os dados existam.
- **Correção:** Adicionar `OR i.sigla LIKE ?` e o parâmetro correspondente.

### C6. Campo `demanda` nunca existe nos resultados de busca
- **Arquivo:** `api/src/modelos/cursoModelo.js:4-6` + `frontend/js/componentes.js:46`
- **Problema:** A query de busca faz `SELECT c.*` da tabela `cursos`, que **não tem coluna `demanda`**. Essa coluna está em `mercado_estagios`. O badge de demanda no card de busca nunca renderiza para dados da API.
- **Correção:** Fazer LEFT JOIN com `mercado_estagios` para incluir `demanda`, ou remover o badge da busca.

---

## Erros Altos (Corrigir em breve)

### A1. Respostas de sucesso inconsistentes — 11 endpoints sem campo `mensagem`
- **Arquivos:** `buscaControlador.js:15`, `universidadeControlador.js:15,33,45,65,86,99,115,127`, `favoritoControlador.js:35`
- **Problema:** 11 das 13 respostas de sucesso retornam `{ sucesso, dados }` **sem o campo `mensagem`**. Apenas `adicionarFavorito` e `removerFavorito` retornam os 3 campos. Isso quebra o contrato documentado no README.
- **Correção:** Adicionar `"mensagem": "Operação realizada com sucesso."` (ou similar) a todas as respostas de sucesso.

### A2. Busca usa endpoint `/cursos` em vez de `/busca`
- **Arquivo:** `frontend/js/busca.js:79`
- **Problema:** `buscarCursos()` chama `/cursos?...` (que retorna só cursos). O endpoint `/busca` retorna **tanto instituições quanto cursos**. O frontend ignora resultados de instituições.
- **Correção:** Mudar para `api('GET', '/busca?' + params.toString())` e extrair `resultado.dados.cursos`.

### A3. Estrela preenchida nos dois estados — feedback visual insuficiente
- **Arquivo:** `frontend/js/componentes.js:39`
- **Problema:** `(favoritado ? ICONES.estrela : ICONES.estrela)` — ambos os ramos retornam a **mesma estrela preenchida**. Não há diferença visual entre favoritado e não favoritado (só muda cor via CSS).
- **Correção:** Criar `ICONES.estrelaVazia` com `fill="none"` e `stroke="currentColor"` para o estado não favoritado.

### A4. `var` usado exclusivamente em `busca.js` — inconsistência com outros arquivos
- **Arquivo:** `frontend/js/busca.js` (todo o arquivo)
- **Problema:** Todas as variáveis usam `var` (escopo de função), enquanto outros arquivos usam `let`/`const` (escopo de bloco). Risco de bugs por hoisting.
- **Correção:** Substituir todos `var` por `const` ou `let` conforme o caso.

### A5. `atualizarContadorFavoritos()` nunca funciona — elemento não existe
- **Arquivo:** `frontend/js/util.js:147-153`
- **Problema:** A função busca `document.getElementById('contadorFavoritos')`, mas **nenhuma página HTML** possui esse elemento. A função sempre retorna na linha 149. Código morto.
- **Correção:** Adicionar `<span id="contadorFavoritos">` na navbar (em `montarNavbar()`) ou remover a função.

### A6. Serviços reescritos mas nunca importados por ninguém
- **Arquivos:** `api/src/servicos/integracaoSisu.js`, `api/src/servicos/integracaoCustoVida.js`
- **Problema:** Os serviços foram reescritos para orquestrar modelos, mas **nenhum controlador ou rota os importa**. Continuam sendo código morto.
- **Correção:** Integrar os serviços nos controladores, ou removê-los se não são necessários.

### A7. `validarFavorito` aceita `instituicao_id: NaN` sem erro
- **Arquivo:** `api/src/utilitarios/validadores.js:32,40`
- **Problema:** `parseInt(undefined)` retorna `NaN`. A condição `if (instituicaoId && instituicaoId <= 0)` é falsa para `NaN` (falsy), então passa silenciosamente. `NaN || null` → `null`. O `instituicao_id` fica `NULL` no banco, que pode violar a foreign key.
- **Correção:** Adicionar verificação explícita: `if (instituicaoId && (isNaN(instituicaoId) || instituicaoId <= 0))`.

### A8. `busca.js` chama `sincronizarComAPI()` mas `favoritos.js` também — duplicação
- **Arquivo:** `frontend/js/busca.js:15`, `frontend/js/favoritos.js:32`
- **Problema:** `sincronizarComAPI()` é chamada em `busca.js` mas só é definida em `favoritos.js`. Se `favoritos.js` não for carregado antes de `busca.js`, dá erro. A ordem de `<script>` no HTML é frágil.
- **Correção:** Garantir ordem de carregamento ou mover `sincronizarComAPI()` para `util.js`.

### A9. Botão "Carregar Mais" mantém posição after page update
- **Arquivo:** `frontend/js/busca.js:54-61`
- **Problema:** O evento de click no `btnCarregarMais` usa `listaCompleta.slice(paginaAtual, ...)`, mas se `executarBusca()` é chamado novamente, `paginaAtual` volta a 0 e `listaCompleta` é substituída, mas o listener antigo ainda referencia a closure antiga via `paginaAtual` global.
- **Correção:** Verificar se o listener está reutilizando variáveis globais corretamente (funciona por ser global, mas é frágil).

### A10. `escapeHTML()` cria DOM element a cada chamada — performance
- **Arquivo:** `frontend/js/util.js:3-7`
- **Problema:** Cada chamada cria `document.createElement('div')`, cria text node, append, lê innerHTML. Chamado dezenas de vezes por renderização de página.
- **Correção:** Cache do elemento ou usar abordagem de string replacement.

### A11. `cacheBusca` nunca é invalidada
- **Arquivo:** `frontend/js/busca.js:4, 73-74`
- **Problema:** Uma vez cacheado, resultado nunca é evicted. Se dados mudam no backend, frontend mostra dados stale até reload completo.
- **Correção:** Adicionar TTL ou limpar cache quando `sincronizarComAPI()` completa.

### A12. `Content-Type: application/json` em requests GET
- **Arquivo:** `frontend/js/api.js:12`
- **Problema:** Header `Content-Type` é enviado em todas as requests, incluindo GET que não tem body. Inofensivo mas desnecessário.
- **Correção:** Só enviar quando `corpo` estiver presente.

---

## Erros Médios (Corrigir quando possível)

### M1. Acesso negado no DELETE nunca é testado pelo frontend
- **Arquivo:** `frontend/js/favoritos.js:100-102`
- **Problema:** Mesmo com a correção de C1, se o backend retornar 403, o `.catch(function(){})` silencia o erro. O usuário não recebe feedback.
- **Correção:** Tratar erro e mostrar toast de erro.

### M2. `obterFavoritosLocal()` chamado 3 vezes no `removerFavorito`
- **Arquivo:** `frontend/js/favoritos.js:93-95`
- **Problema:** `obterFavoritosLocal()` faz `JSON.parse(localStorage.getItem(...))` 3 vezes seguidas (linhas 93, 94 implicitamente, 95). Desperdício.
- **Correção:** Chamar uma vez e reutilizar: `var lista = obterFavoritosLocal(); var favorito = lista.find(...); var filtrada = lista.filter(...)`

### M3. Nenhum `aria-label` nos botões de favorito
- **Arquivo:** `frontend/js/componentes.js:28-40, 60-72`
- **Problema:** Botões dependem de `<span class="sr-only">` para nome acessível, mas não têm `aria-label`. Screen readers podem não ler a ação completa.
- **Correção:** Adicionar `aria-label="Favoritar [nome do curso]"`.

### M4. CSS classe `tabConteudo` nunca é definida
- **Arquivo:** `frontend/paginas/detalhes.html:59-62`
- **Problema:** Todas as 4 seções de aba têm `class="tabConteudo"`, mas essa classe **não existe** em nenhum CSS. Markup morto.
- **Correção:** Remover a classe ou adicionar estilos se era pretendida.

### M5. `.animate-spin` do CSS customizado sobrepõe o do Tailwind
- **Arquivo:** `frontend/css/estilo.css:22-24`
- **Problema:** Define `.animate-spin` com 0.6s que sobrepõe o `.animate-spin` do Tailwind (1s). Conflito.
- **Correção:** Renomear para `.animate-girar`.

### M6. `.text-gray-500` redundante com Tailwind
- **Arquivo:** `frontend/css/estilo.css:74-76`
- **Problema:** Define cor idêntica ao padrão do Tailwind. Peso morto.
- **Correção:** Remover a regra.

### M7. Comparação case-sensitive de `modalidade_acesso`
- **Arquivo:** `frontend/js/componentes.js:88`
- **Problema:** `nota.modalidade_acesso === 'SiSU'` — se o banco tiver `'sisu'` (minúsculo), perde a cor azul.
- **Correção:** Usar `.toLowerCase()`: `nota.modalidade_acesso?.toLowerCase() === 'sisu'`.

### M8. `formatarMoeda` não trata `NaN`
- **Arquivo:** `frontend/js/util.js:56-59`
- **Problema:** Se `valor` for string não numérica, `NaN.toLocaleString(...)` retorna `"NaN"`.
- **Correção:** Adicionar `if (isNaN(Number(valor))) return '—'`.

### M9. `escapeHTML()` pode ser bypassed com `null`/`undefined`
- **Arquivo:** `frontend/js/util.js:3-7`
- **Problema:** Se chamado com `null` ou `undefined`, `document.createTextNode(null)` cria nó vazio, mas `innerText` pode variar entre browsers.
- **Correção:** Adicionar guard: `if (!texto) return ''`.

### M10. Navbar sem menu hamburger para mobile
- **Arquivo:** `frontend/js/util.js:137-144`
- **Problema:** Em telas < 360px, brand + links podem overflow. Não há colapso responsivo.
- **Correção:** Adicionar toggle com classes `md:hidden` / `md:flex`.

### M11. `duracao_semestres` inserido no HTML sem escape
- **Arquivo:** `frontend/js/detalhes.js:90`
- **Problema:** `curso.duracao_semestres + ' semestres'` inserido sem `escapeHTML()`. É número do banco (baixo risco), mas inconsistente.
- **Correção:** Envolver em `escapeHTML(String(...))`.

### M12. `nota.ano` e `nota.chamada` sem escape no HTML
- **Arquivo:** `frontend/js/componentes.js:93-94`
- **Problema:** Inseridos direto no HTML sem `escapeHTML()`. São inteiros do banco (baixo risco), mas inconsistente.
- **Correção:** Envolver em `escapeHTML(String(...))`.

### M13. `CSS.escape()` com suporte limitado
- **Arquivo:** `frontend/js/favoritos.js:114`
- **Problema:** `CSS.escape()` não existe no IE11 e Safari < 12.
- **Correção:** Usar seletor alternativo: `[data-favoritar="${cursoId}"]` (IDs são numéricos, sem caracteres especiais).

### M14. Google Fonts sem `charset="utf-8"`
- **Arquivos:** Todos os 3 HTML files
- **Problema:** `<link>` do Google Fonts não inclui `charset`. Browsers modernos assumem UTF-8, mas versões antigas podem não decodificar.
- **Correção:** Adicionar `charset="utf-8"` ao `<link>`.

---

## Erros Baixos (Melhorias menores)

### B1. Tailwind via CDN não recomendado para produção
- **Arquivo:** Todos os 3 HTML files
- **Problema:** CDN do Tailwind carrega o JIT compiler completo (~400KB) em runtime. FOUC (flash of unstyled content).
- **Correção:** Build com CLI ou PostCSS plugin para CSS otimizado.

### B2. `Array.from()` e arrow functions — sem suporte IE11
- **Arquivo:** `frontend/js/util.js:80`, `frontend/js/detalhes.js:156-157`
- **Problema:** Requer browser moderno (ES6+). IE11 completamente unsupported.
- **Correção:** Documentar requisitos mínimos de browser, ou adicionar polyfills se necessário.

### B3. `Date.now()` para ID pode colidir
- **Arquivo:** `frontend/js/favoritos.js:69`
- **Problema:** Se `adicionarFavorito()` for chamado 2x no mesmo milissegundo, ambos recebem o mesmo ID.
- **Correção:** Usar contador ou UUID.

### B4. Serviços não integram com controladores (código morto pós-reestruturação)
- **Arquivo:** `api/src/servicos/integracaoSisu.js`, `integracaoCustoVida.js`
- **Problema:** Foram reescritos mas continuam sem ser chamados.
- **Correção:** Integrar ou remover.

### B5. `#toast` usa seletor ID — pode conflitar com Tailwind
- **Arquivo:** `frontend/css/estilo.css:39-48`
- **Problema:** Especificidade de ID pode conflitar com utilitários Tailwind no mesmo elemento.
- **Correção:** Usar `@layer` ou classe CSS em vez de seletor ID.

### B6. Navbar não testa `#contadorFavoritos` — `atualizarContadorFavoritos()` dead code
- **Arquivo:** `frontend/js/util.js:147-153`
- **Problema:** Conforme A5 — função nunca encontra o elemento.
- **Correção:** Idêntica a A5.

### B7. `cacheBusca` usa `Map` — pode crescer indefinidamente
- **Arquivo:** `frontend/js/busca.js:4`
- **Problema:** Se o usuário fizer muitas buscas diferentes, o Map cresce sem limite.
- **Correção:** Limitar tamanho ou adicionar eviction policy.

### B8. `link externo` em auxílios não valida URL
- **Arquivo:** `frontend/js/componentes.js:126`
- **Problema:** `href="' + a.url + '"` — se `a.url` for uma string maliciosa (ex: `javascript:alert(1)`), pode ser XSS.
- **Correção:** Validar que URL começa com `http://` ou `https://` antes de renderizar como link.

### B9. Nenhum rate limiting na API
- **Arquivo:** `api/src/app.js`
- **Problema:** Nenhum middleware de rate limiting. API vulnerável a brute-force ou abuso.
- **Correção:** Adicionar `express-rate-limit` ou similar.

### B10. `helmet` com `contentSecurityPolicy: false`
- **Arquivo:** `api/src/app.js:16-17`
- **Problema:** CSP desabilitado completamente. Remove uma camada importante de mitigação de XSS.
- **Correção:** Configurar CSP adequada em vez de desabilitar.

---

## Plano de Correção por Prioridade

### Fase 1 — Críticos (C1-C6) — PRIMEIRO

| # | Arquivo | Correção Resumida |
|---|---------|-------------------|
| C1 | `frontend/js/favoritos.js:101` | Adicionar `?sessao_usuario=` ao DELETE |
| C2 | `frontend/js/favoritos.js:85-89` | Capturar `resp.dados.id` da resposta POST e atualizar ID local |
| C3 | `frontend/js/componentes.js:20` | Trocar `<a>` por `<div>` com click handler, ou mover botão para fora |
| C4 | `frontend/js/componentes.js:20` | Adicionar `data-curso-id` no wrapper do card |
| C5 | `api/src/modelos/cursoModelo.js:13` | Adicionar `OR i.sigla LIKE ?` à query |
| C6 | `api/src/modelos/cursoModelo.js:4` | LEFT JOIN `mercado_estagios` para incluir `demanda` |

### Fase 2 — Altos (A1-A12) — SEGUNDO

| # | Arquivo | Correção Resumida |
|---|---------|-------------------|
| A1 | Todos os controladores | Adicionar `"mensagem"` a todas as respostas de sucesso |
| A2 | `frontend/js/busca.js:79` | Mudar endpoint de `/cursos` para `/busca` |
| A3 | `frontend/js/componentes.js:39` | Criar `ICONES.estrelaVazia` e usar no estado não favoritado |
| A4 | `frontend/js/busca.js` | Substituir `var` por `const`/`let` |
| A5 | `frontend/js/util.js:147-153` | Adicionar `<span id="contadorFavoritos">` na navbar |
| A6 | `api/src/servicos/` | Integrar nos controladores ou remover |
| A7 | `api/src/utilitarios/validadores.js:40` | Verificar `isNaN(instituicaoId)` explicitamente |
| A8 | `frontend/js/busca.js:15` | Garantir que `favoritos.js` é carregado antes |
| A9 | `frontend/js/util.js:3-7` | Cache do elemento div no `escapeHTML` |
| A10 | `frontend/js/busca.js:4` | Adicionar TTL ao cache |
| A11 | `frontend/js/api.js:12` | Só enviar `Content-Type` quando houver body |

### Fase 3 — Médios (M1-M14) — TERCEIRO

Melhorias de acessibilidade, consistência, performance e robustez.

### Fase 4 — Baixos (B1-B10) — ÚLTIMO

Melhorias de produção, segurança avançada e otimizações.

---

## Arquivos que Serão Modificados

| Arquivo | Mudanças |
|---------|----------|
| `frontend/js/favoritos.js` | C1, C2, A8, M1, M2 |
| `frontend/js/componentes.js` | C3, C4, A3, M3, M7, M12, B8 |
| `api/src/modelos/cursoModelo.js` | C5, C6 |
| `api/src/controladores/buscaControlador.js` | A1 |
| `api/src/controladores/universidadeControlador.js` | A1 |
| `api/src/controladores/favoritoControlador.js` | A1 |
| `frontend/js/busca.js` | A2, A4, A10 |
| `frontend/js/util.js` | A5, A9, M8, M9 |
| `api/src/utilitarios/validadores.js` | A7 |
| `api/src/servicos/integracaoSisu.js` | A6 |
| `api/src/servicos/integracaoCustoVida.js` | A6 |
| `frontend/js/api.js` | A12 |
| `frontend/css/estilo.css` | M5, M6 |
| `frontend/js/detalhes.js` | M11 |
| `frontend/paginas/detalhes.html` | M4 |
| `api/src/app.js` | B9, B10 |

---

## Ordem de Execução Recomendada

1. **Fase 1 (Críticos):** Corrigir C1→C6 — segurança e funcionalidade quebrada
2. **Fase 2 (Altos):** Corrigir A1→A12 — consistência e código morto
3. **Testes manuais:** Rodar o servidor e testar todos os 13 endpoints + frontend
4. **Fase 3 (Médios):** Corrigir M1→M14 — qualidade e acessibilidade
5. **Fase 4 (Baixos):** Corrigir B1→B10 — production-readiness
