Especificação do site — Cursos e Notas de Corte de MT

Objetivo

Criar um site simples para pesquisar cursos de graduação das universidades e institutos federais de Mato Grosso, mostrando informações oficiais do MEC/Sisu.

Funcionalidades

- [ ] Todos os botões do site devem funcionar corretamente.
- [ ] Ter pesquisa por nome do curso.
- [ ] Ter filtros por universidade/instituto, cidade e curso.
- [ ] Permitir ordenar os cursos pela nota de corte.
- [ ] Mostrar a nota de corte baseada nos dados oficiais do Sisu/MEC.
- [ ] Mostrar o ano/edição do Sisu usado como referência.
- [ ] Mostrar a modalidade de concorrência da nota de corte, como ampla concorrência ou cotas.
- [ ] Mostrar a nota do Ranking MEC do curso, quando disponível.
- [ ] Não inventar ou estimar notas que não estejam nos dados oficiais.
- [ ] Quando não houver nota disponível, informar claramente que o dado não está disponível.

Informações de cada curso

Cada curso deve apresentar:

- Nome do curso
- Instituição
- Campus
- Cidade
- Turno
- Modalidade
- Nota de corte do Sisu
- Ano do Sisu
- Nota do Ranking MEC
- Link/site oficial da instituição

Instituições de Mato Grosso

O site deve incluir todas as universidades e institutos federais de Mato Grosso que tenham cursos elegíveis para aparecer no sistema.

A lista deve ser obtida de fontes oficiais do MEC e atualizada quando houver mudanças.

Dados

A fonte principal para as notas de corte deve ser o Sisu/MEC e seus dados abertos oficiais.

Os dados devem ser organizados por:

"Instituição → Campus → Curso → Turno → Modalidade → Nota de corte"

O sistema deve guardar a edição/ano da informação para evitar apresentar uma nota antiga como se fosse atual.

Interface

A página inicial deve ter:

1. Campo de pesquisa.
2. Filtro de instituição.
3. Filtro de cidade.
4. Filtro de curso.
5. Lista/ranking dos cursos.
6. Nota de corte em destaque.
7. Nota do Ranking MEC.
8. Botão para ver detalhes do curso.

Ranking

O ranking deve permitir ordenar os cursos por:

- Maior nota de corte
- Menor nota de corte
- Nota do Ranking MEC

A nota de corte e a nota do Ranking MEC devem ficar claramente identificadas para não serem confundidas.

Importante

Os dados devem ser apresentados como informações de referência. A nota de corte pode variar entre edições e modalidades, portanto o site deve sempre mostrar o ano e a modalidade correspondente.

A implementação deve priorizar dados oficiais do MEC/Sisu.