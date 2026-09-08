# Prompt de Reestruturação Arquitetural (MVC)

**Atue como um Engenheiro de Software Sênior especializado em arquitetura de sistemas web.**

Preciso reorganizar e reestruturar a arquitetura do meu aplicativo web para o padrão **MVC (Model-View-Controller)**.

Por favor, siga estas diretrizes para a reestruturação:

---

## 1. Nomenclatura e Idioma das Pastas
* Toda a estrutura de pastas e diretórios deve ser nomeada em **português (PT-BR)** (exemplo: `modelos/`, `visoes/`, `controladores/`, `configuracoes/`, `intermediarios/`, `servicos/`, `utilitarios/`, `documentos/`).

## 2. Divisão de Responsabilidades
* **Modelos (`modelos/`):** Isole a lógica de negócios, regras de domínio, validações de dados e interações/consultas ao banco de dados.
* **Visões (`visoes/`):** Mantenha apenas a lógica de apresentação e interface com o usuário, sem regras de negócio ou de banco acopladas.
* **Controladores (`controladores/`):** Intermedie as requisições HTTP/rotas, gerenciando o fluxo de dados e a comunicação entre as Visões e os Modelos.

## 3. Boas Práticas e Clean Code
* Aplique princípios **SOLID** e conceitos de *Clean Architecture* onde apropriado.
* Elimine acoplamentos fortes, dependências circulares e código duplicado (DRY - *Don't Repeat Yourself*).
* Garanta o tratamento adequado de erros e exceções nas camadas corretas.

## 4. REGRA CRÍTICA: Fase de Planejamento e Bloqueio de Execução
**NÃO inicie a reescrita ou reprogramação do código imediatamente.**

Antes de refatorar qualquer arquivo de código, você deve:
1. Criar uma pasta chamada `doc/` (ou `documentos/`).
2. Criar e salvar nessa pasta o arquivo `reestruturacao.md` contento o plano detalhado de execução e planejamento da reprogramação, incluindo:
   - Análise do estado atual da aplicação.
   - Proposta da nova árvore de diretórios (com nomes de pastas em PT-BR).
   - Mapeamento de onde cada arquivo/função atual será alocado.
   - Estratégia de migração e plano de testes.
3. **Aguardar a aprovação:** Pare a execução após gerar a explicação do plano e o arquivo `reestruturacao.md`. **NÃO modifique nem reprograme os arquivos do projeto até que eu analise o documento e envie explicitamente a palavra "OK".**

---

### Código / Estrutura Atual do Projeto:

```text
[Cole o seu código ou cole a estrutura de arquivos atual do projeto aqui]
```
