# Plano de Modificação do Frontend — Ingresso Universitário

> **Projeto Integrador I — Grupo 3**
> Disciplina: Projeto Integrador I — Professor: André Lôbo
> Complementa: `doc/plano_modificacao_ingressouniversidade.md`
> Protótipo de referência: [Figma — Student College Decision App](https://www.figma.com/make/8jqXrpZ5r3QjANhOBLxaaD/Student-College-Decision-App)

---

## 1. Contexto

O frontend atual (`frontend/`) é uma **landing page de captura de leads**:
`index.html` único com Tailwind CSS via CDN, `js/app.js` (máscara de telefone +
Fetch POST para `/api/leads`) e `css/estilo.css` mínimo.

Com a mudança de escopo documentada (consulta/análise de universidades e cursos),
o frontend precisa virar uma **SPA responsiva de consulta**, expondo os dados dos
requisitos RF1–RF6:

- busca de cursos e instituições com filtros;
- notas de corte, custos de moradia, bolsas/auxílios e mercado/estágios no detalhe;
- sistema de favoritos.

> **Nota sobre o protótipo:** o link publicado (`shared-bulk-68320921.figma.site/`)
> renderiza apenas um *code component* placeholder ("Code layer") e o arquivo em
> `figma.com` exige autenticação para extração dos frames. O design apresentado no
> Figma descreve um app que **centraliza informações-chave (admission scores,
> scholarships, job market insights)**, com frame desktop de 1280×1080 e layout
> vertical de blocos. As especificações visuais exatas devem ser confirmadas com o
> grupo consultando o arquivo original no Figma.

### Stack e Linguagens (conforme README.md)

O frontend mantém a stack documentada no `README.md` e usada atualmente:

- **HTML5 semântico** (`<header>`, `<main>`, `<section>`, `<nav>`) nas páginas.
- **Tailwind CSS via CDN** (`<script src="https://cdn.tailwindcss.com"></script>`)
  + `css/estilo.css` para ajustes finos (spinner, transições, contraste).
- **JavaScript ES6+ vanilla** — Fetch API, sem frameworks; scripts carregados por
  `<script src="js/...js">` (mesmo padrão do `app.js` atual), sem `import`/bundler.
- **Backend consumido:** Express/REST em `http://localhost:3000/api` (centralizado
  na constante `URL_API`, como no `app.js` atual).
- **Convenção obrigatória:** variáveis, funções, classes CSS e comentários
  **100% em português brasileiro**; respostas da API tratadas como
  `{ sucesso, dados }` e `{ sucesso, mensagem, erros }`.

---

## 2. Requisitos do Frontend (derivados dos RNFs)

| ID | Requisito | Aplicação no frontend |
|---|---|---|
| RNF1 | Usabilidade/Simplicidade | Informação essencial em até 3 cliques; fluxo linear Home → Busca → Detalhe |
| RNF2 | Desempenho | Buscas e detalhes com resposta ≤ 2s (optimistic UI, cache, estados de loading) |
| RNF3 | Responsividade | Web app funcional em desktop e mobile (breakpoints Tailwind) |
| RNF4 | Confiabilidade | Exibir `fonte`/`atualizado_em` dos dados junto aos valores |
| RNF5 | Acessibilidade | Contraste WCAG AA, `aria`, navegação por teclado, labels claros |

> RF1–RF6 são atendidos em conjunto pelo backend (rotas) e pelas telas abaixo.

---

## 3. Estrutura de Arquivos Proposta

```
frontend/
├── index.html                    # Home: busca com filtros + grid de resultados (RF1)
├── css/
│   └── estilo.css                # Tailwind via CDN + tokens e tweaks de contraste
├── js/
│   ├── api.js                    # Cliente Fetch genérico (GET/POST/DELETE)
│   ├── util.js                   # Formatação (R$, %, datas), getParamsURL, debounce
│   ├── busca.js                  # Home: filtros, debounce, render de cards, paginação
│   ├── detalhes.js               # Detalhe: abas (notas, custos, bolsas, mercado)
│   ├── favoritos.js              # Favoritos: add/remove/lista (localStorage + API)
│   └── componentes.js            # Render de navbar, cards, tabelas, toasts e skeletons
├── paginas/
│   ├── detalhes.html             # Detalhes da instituição/curso (recebe ?id=)
│   └── favoritos.html            # Lista de favoritos salvos
└── assets/
    ├── logo.svg                  # Logo/branding do app
    └── imagens/                  # Imagens auxiliares (hero, ilustrações)
```

> **Alinhamento com o README:** `index.html`, `css/estilo.css` e `js/` seguem a
> estrutura atual do projeto (Tailwind via CDN + JS vanilla). `paginas/` e `assets/`
> são acréscimos; os scripts de `js/` são carregados com `<script src="...">`
> (sem módulos ES), expondo funções globais e reutilizando `api.js`.

---

## 4. Páginas e Fluxo de Navegação

```
             ┌───────────┐
             │  index    │  busca + filtros (RF1)
             └─────┬─────┘
                   │ click num card
             ┌─────▼─────┐
             │ detalhes  │  ?id=<curso> (RF2–RF5) + "Favoritar" (RF6)
             └─────┬─────┘
                   │ navbar → Favoritos
             ┌─────▼─────┐
             │ favoritos │  lista salva (RF6)
             └───────────┘
```

### 4.1 Home / Busca (`index.html`)

- **Header fixo:** logo + link/nav para "Favoritos".
- **Hero:** headline curta ("Escolha com segurança a sua universidade"), busca
  principal e resumo dos 4 pilares (notas, custos, bolsas, mercado).
- **Filtros:** cidade, estado e nome (selects + input livre) e botão de busca.
- **Resultados:** grid de cards (instituição, curso, cidade/UF, nota mínima e
  ícone de favorito); estados de *loading* (skeleton), *vazio* e *erro*.
- **Paginação** ou "carregar mais" (scroll infinito) — decisão do grupo.

### 4.2 Detalhes do Curso (`paginas/detalhes.html`)

- **Cabeçalho:** nome do curso, instituição, cidade/UF, modalidade, grau e
  classificação de demanda (RF5) + botão **Favoritar** (RF6).
- **Abas (RF2–RF5):**
  1. **Notas de corte** — tabela por processo seletivo/ano e chamada (RF2);
  2. **Custos da cidade** — cards de moradia, alimentação, transporte, total
     mensal estimado + fonte/mês de referência (RF3, RNF4);
  3. **Bolsas e auxílios** — lista de cards com tipo, descrição e link (RF4);
  4. **Mercado e estágios** — demanda na região, salário médio e vagas de
     estágio (RF5).
- **CTA:** voltar à busca e favoritar/desfavoritar.

### 4.3 Favoritos (`paginas/favoritos.html`)

- Grid de cards dos cursos/instituições salvos (dados em `localStorage` e/ou via
  API com `sessao_usuario`), com acesso rápido ao detalhe e opção de remover (RF6).

---

## 5. Componentes Reutilizáveis (`js/componentes.js`)

| Componente | Descrição |
|---|---|
| `navbar()` | Header fixo com logo, link Favoritos e contador de favoritos |
| `cardResultado(instituicao)` | Card da busca com highlight de nota mínima |
| `cardInfo(icone, rotulo, valor)` | Card de indicador (custos, demanda) |
| `tabelaNotas(notas)` | Tabela responsiva de notas de corte |
| `listaAuxilios(items)` | Lista de bolsas/auxílios com link externo |
| `toast(mensagem, tipo)` | Feedback de sucesso/erro (padrão já usado hoje) |
| `skeleton()` | Placeholder de carregamento (RNF2) |
| `estadoVazio(mensagem)` / `estadoErro(msg)` | Estados de ausência de dados |
| `badge(texto, cor)` | Rótulos de demanda/seguro (alta, média, baixa) |

**Padrão do projeto (documento anterior):** HTML semântico, Tailwind via CDN,
JavaScript nativo (Fetch API), comentários em PT-BR.

---

## 6. Identidade Visual (a confirmar com o Figma original)

Como o arquivo Figma exige acesso autenticado, recomenda-se **extrair do protótipo**
o design system antes de codar. Padrões sugeridos (alinhados ao app de decisão estudantil):

- **Cores:** tema claro (fundo branco/cinza claro), cor de destaque para CTAs e
  notas de corte (ex.: tom de azul/índigo em hoje) e badges semânticos (verde
  alta demanda, amarelo média, vermelho baixa). Contraste WCAG AA (RNF5).
- **Tipografia:** fonte de boa legibilidade (ex.: Inter/Plus Jakarta — interface
  jovem e informacional), com escala clara de títulos/corpo.
- **Espaçamento:** grid de 12 col, raios de card moderados, sombras suaves.
- **Ícones:** biblioteca leve (SVG inline) — sem dependência de CDN pesado.
- **Estados visuais:** hover, foco visível, disabled e skeletons consistentes.

> **Decisão pendente do grupo:** anexar/descrever no plano as cores e telas exatas
> do Figma para substituir esta seção.

---

## 7. Comportamento do Cliente (JS)

### 7.1 Camada de API (`js/api.js`)

```js
// Retorna JSON tratado; lança erro amigável se a resposta não for ok
async function api(metodo, caminho, corpo) {
  const resposta = await fetch(`${URL_API}${caminho}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined
  })
  return resposta.json()
}
```

- `URL_API` centralizado (mesmo padrão do `app.js` atual).
- Reuso para `GET /instituicoes`, `GET /cursos`, `GET /cursos/:id` e endpoints de
  favoritos — sem duplicação de código.

### 7.2 Busca com debounce (RNF2)

- Filtros de texto com `debounce(300ms)`; selects recarregam resultados.
- Indicador de carregamento (skeleton) durante a espera.
- Cache simples em memória por (filtros) para evitar re-request nas mesmas condições.

### 7.3 Favoritos (RF6)

- Armazena `sessao_usuario` em `localStorage` (uuid gerado na primeira visita).
- `POST /favoritos`, `GET /favoritos`, `DELETE /favoritos/:id`.
- Botão com estado sincronizado ("Favoritar" ↔ "Favoritado") e contador na navbar.

### 7.4 Feedback e erros

- `toast(mensagem, tipo)` para confirmação/erro (reutiliza padrão atual de cores
  verde/vermelho).
- Captura de falhas de conexão com mensagem amigável e opção de tentar novamente.

---

## 8. Fases de Implementação

| Fase | Entregáveis | Requisitos |
|---|---|---|
| **1. Base** | `api.js`, `util.js`, navbar, estrutura de pastas/páginas | — |
| **2. Home/Busca** | `index.html` + `busca.js` + `componentes.js` (filtros, cards, skeleton) | RF1, RNF1–RNF3 |
| **3. Detalhes** | `paginas/detalhes.html` + `detalhes.js` (abas RF2–RF5) | RF2–RF5, RNF2 |
| **4. Favoritos** | `paginas/favoritos.html` + `favoritos.js` + integração API | RF6 |
| **5. Ajustes** | Acessibilidade (aria/foco), contraste, teste em mobile e finalização | RNF5 |

---

## 9. Critérios de Aceite

- [ ] Home exibe resultados em ≤ 2s com skeleton durante a carga (RNF2).
- [ ] Filtros por cidade/estado/nome funcionam (RF1).
- [ ] Detalhe mostra notas de corte, custos, bolsas e mercado — com fonte/data (RF2–RF5, RNF4).
- [ ] Adicionar/remover favoritos funciona e persiste na sessão (RF6).
- [ ] Layout responsivo em ≤ 3 tamanhos de tela (mobile, tablet, desktop) (RNF3).
- [ ] Navegação e contraste adequados (teclado, `aria`, WCAG AA) (RNF5).
- [ ] Informação essencial alcançada em até 3 cliques (RNF1).

---

*Documento gerado em 10/08/2026 — complementa o plano geral de modificação do projeto.*
