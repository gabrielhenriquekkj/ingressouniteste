function cardResultado(curso) {
  const base = caminhoBase()
  const demanda = curso.demanda || ''
  const nomeInst = curso.instituicao_nome || curso.instituicao || ''
  const sigla = curso.sigla || ''
  const cidade = curso.cidade || ''
  const uf = curso.uf || curso.estado || ''
  const grau = curso.grau || ''
  const modalidade = curso.modalidade || ''
  const campus = curso.campus_nome || ''
  const categoria = curso.categoria_administrativa || ''
  const turno = curso.turno || ''
  const tipoInst = curso.tipo_instituicao || ''
  const favoritado = estaFavoritado(curso.id)
  const favLabel = favoritado ? t('favoritos.botaoFavoritado') : t('favoritos.botaoFavoritar')
  const iconeFav = favoritado ? ICONES.estrela : ICONES.estrelaVazia
  const destino = base + '/paginas/detalhes.html?id=' + encodeURIComponent(curso.id)

  return '<article data-curso-id="' + escapeHTML(curso.id) + '" data-destino="' + escapeHTML(destino) + '" ' +
    'class="app-card curso-card" role="link" tabindex="0" aria-label="Ver detalhes de ' + escapeHTML(curso.nome) + '">' +
    '<div class="curso-card-topo">' +
    '<div style="min-width:0">' +
    '<span class="eyebrow">' + escapeHTML(sigla || nomeInst) + '</span>' +
    '<h3>' + escapeHTML(curso.nome) + '</h3>' +
    '<p class="instituicao">' + escapeHTML(nomeInst) + '</p>' +
    '</div>' +
    '<button type="button" data-favoritar="' + escapeHTML(curso.id) + '" ' +
    'data-nome="' + escapeHTML(curso.nome) + '" ' +
    'data-instituicao="' + escapeHTML(nomeInst) + '" ' +
    'data-sigla="' + escapeHTML(sigla) + '" ' +
    'data-cidade="' + escapeHTML(cidade) + '" ' +
    'data-estado="' + escapeHTML(uf) + '" ' +
    'data-grau="' + escapeHTML(grau) + '" ' +
    'data-modalidade="' + escapeHTML(modalidade) + '" ' +
    'aria-label="' + favLabel + ' ' + escapeHTML(curso.nome) + '" ' +
    'aria-pressed="' + favoritado + '" data-favoritado="' + favoritado + '" ' +
    'class="icon-btn" title="' + favLabel + '">' + iconeFav + '</button>' +
    '</div>' +
    '<div class="metadados">' +
    (categoria ? '<span class="badge">' + escapeHTML(categoria) + '</span>' : '') +
    (tipoInst ? '<span class="badge">' + escapeHTML(String(tipoInst).replace(/_/g, ' ')) + '</span>' : '') +
    (grau ? '<span class="badge">' + escapeHTML(grau) + '</span>' : '') +
    (modalidade ? '<span class="badge badge-sucesso">' + escapeHTML(modalidade) + '</span>' : '') +
    (turno ? '<span class="badge">' + escapeHTML(turno) + '</span>' : '') +
    (cidade ? '<span class="badge">' + escapeHTML(cidade) + '/' + escapeHTML(uf) + '</span>' : '') +
    (campus ? '<span class="badge badge-alerta">' + escapeHTML(campus) + '</span>' : '') +
    (demanda ? badge(rotuloDemanda(demanda), corDemanda(demanda)) : '') +
    '</div>' +
    '<div class="acoes"><span class="bento-seta">Ver detalhes →</span></div>' +
    '</article>'
}

function botaoFavorito(curso, grande) {
  const favoritado = estaFavoritado(curso.id)
  const classe = favoritado ? 'btn-primary' : 'btn-outline'
  const nomeInst = curso.instituicao_nome || curso.instituicao || ''
  const rotulo = favoritado
    ? t('favoritos.removerAria', { nome: curso.nome })
    : t('favoritos.adicionarAria', { nome: curso.nome })
  const iconeFav = favoritado ? ICONES.estrela : ICONES.estrelaVazia

  return '<button type="button" data-favoritar="' + escapeHTML(curso.id) + '" ' +
    'data-nome="' + escapeHTML(curso.nome) + '" ' +
    'data-instituicao="' + escapeHTML(nomeInst) + '" ' +
    'data-sigla="' + escapeHTML(curso.sigla || '') + '" ' +
    'data-cidade="' + escapeHTML(curso.cidade || '') + '" ' +
    'data-estado="' + escapeHTML(curso.uf || curso.estado || '') + '" ' +
    'data-grau="' + escapeHTML(curso.grau || '') + '" ' +
    'data-modalidade="' + escapeHTML(curso.modalidade || '') + '" ' +
    'aria-label="' + escapeHTML(rotulo) + '" aria-pressed="' + favoritado + '" data-favoritado="' + favoritado + '" ' +
    'class="btn ' + classe + (grande ? '' : ' btn-sm') + '">' +
    iconeFav + '<span>' + (favoritado ? t('favoritos.botaoFavoritado') : t('favoritos.botaoFavoritar')) + '</span>' +
    '</button>'
}

function tabelaNotas(notas) {
  if (!notas || notas.length === 0) return estadoVazio(t('notas.vazioCurso'))

  let html = '<div class="tabela-wrap"><table class="tabela"><thead><tr>' +
    '<th scope="col">' + t('notas.processo') + '</th>' +
    '<th scope="col">' + t('notas.ano') + '</th>' +
    '<th scope="col">' + t('notas.chamada') + '</th>' +
    '<th scope="col">' + t('notas.notaCorte') + '</th>' +
    '<th scope="col">' + t('notas.fonte') + '</th>' +
    '</tr></thead><tbody>'

  for (const nota of notas) {
    const processo = nota.processo || nota.modalidade_acesso || ''
    const cor = String(processo).toLowerCase() === 'sisu' ? 'badge-sucesso' : ''
    const fonte = nota.fonte_tipo === 'oficial'
      ? badge(t('notas.oficial'), 'badge-sucesso')
      : badge(t('notas.abertos'), '')
    const notaValor = nota.nota_corte || nota.nota_minima
    html += '<tr>' +
      '<td>' + badge(processo || '\u2014', cor) + '</td>' +
      '<td>' + escapeHTML(String(nota.ano || '')) + '</td>' +
      '<td>' + escapeHTML(t('notas.chamadaNumero', { numero: nota.chamada || '' })) + '</td>' +
      '<td><strong>' + (notaValor ? Number(notaValor).toFixed(1) : t('notas.indisponivel')) + '</strong></td>' +
      '<td>' + fonte + '</td>' +
      '</tr>'
  }
  return html + '</tbody></table></div>'
}

function linhaFonte(fonte, atualizado) {
  if (!fonte && !atualizado) return ''
  let texto = ''
  if (fonte) texto += t('comum.fonte', { valor: escapeHTML(String(fonte)) })
  if (atualizado) texto += (texto ? ' · ' : '') + t('comum.atualizadoEm', { valor: escapeHTML(String(atualizado)) })
  return '<p style="margin-top:1rem;color:var(--text-subtle);font-size:.76rem">' + texto + '</p>'
}

function listaAuxilios(auxilios) {
  if (!auxilios || auxilios.length === 0) return estadoVazio(t('auxilios.vazio'))

  return '<div class="resultados-grid">' + auxilios.map((a) => {
    const cor = a.tipo === 'bolsa' ? 'badge-sucesso' : 'badge-alerta'
    const urlSegura = a.url && /^https?:\/\//i.test(a.url)
      ? '<a href="' + escapeHTML(a.url) + '" target="_blank" rel="noopener noreferrer" class="btn btn-quiet btn-sm">' + t('comum.maisInfo') + '</a>'
      : ''
    return '<article class="app-card">' +
      '<div class="curso-card-topo"><h3>' + escapeHTML(a.nome) + '</h3>' + badge(a.tipo === 'bolsa' ? t('auxilios.bolsa') : t('auxilios.auxilio'), cor) + '</div>' +
      (a.descricao ? '<p style="color:var(--text-muted)">' + escapeHTML(a.descricao) + '</p>' : '') +
      (a.publico_alvo ? '<p style="color:var(--text-subtle);font-size:.78rem">' + escapeHTML(t('comum.publicoAlvo', { valor: a.publico_alvo })) + '</p>' : '') +
      '<div class="acoes">' + urlSegura + (a.coletado_em ? badge(t('comum.dadosAbertos'), '') : '') + '</div>' +
      '</article>'
  }).join('') + '</div>'
}

function detalhesCampus(campi) {
  if (!campi || campi.length === 0) return ''

  let html = '<section style="margin-top:1.5rem"><h2>' + t('comum.campi') + '</h2><div class="resultados-grid">'
  for (const c of campi) {
    html += '<article class="app-card">' +
      '<h3>' + escapeHTML(c.nome) + '</h3>' +
      (c.cidade ? '<p style="color:var(--text-muted)">' + escapeHTML(c.cidade) + '/' + escapeHTML(c.uf || '') + '</p>' : '') +
      (c.endereco ? '<p style="color:var(--text-subtle);font-size:.78rem">' + escapeHTML(c.endereco) + '</p>' : '') +
      (c.site_oficial && /^https?:\/\//i.test(c.site_oficial)
        ? '<a href="' + escapeHTML(c.site_oficial) + '" target="_blank" rel="noopener noreferrer" class="btn btn-quiet btn-sm">' + t('comum.siteOficial') + '</a>'
        : '') +
      '</article>'
  }
  return html + '</div></section>'
}

document.addEventListener('click', function (evento) {
  const cartao = evento.target.closest('[data-curso-id][data-destino]')
  if (!cartao || evento.target.closest('button, a')) return
  window.location.href = cartao.getAttribute('data-destino')
})

document.addEventListener('keydown', function (evento) {
  if (evento.key !== 'Enter' && evento.key !== ' ') return
  const cartao = evento.target.closest('[data-curso-id][data-destino]')
  if (!cartao) return
  evento.preventDefault()
  window.location.href = cartao.getAttribute('data-destino')
})
