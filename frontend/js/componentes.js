// componentes.js — Componentes de UI reutilizáveis

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

  const favClasses = favoritado
    ? 'bg-amber-500 text-white border-amber-500'
    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'

  const favLabel = favoritado ? 'Favoritado' : 'Favoritar'
  const iconeFav = favoritado ? ICONES.estrela : ICONES.estrelaVazia

  const catCor = categoria === 'federal' ? 'bg-blue-50 text-blue-700'
    : categoria === 'estadual' ? 'bg-orange-50 text-orange-700'
    : categoria === 'municipal' ? 'bg-teal-50 text-teal-700'
    : 'bg-gray-100 text-gray-600'

  return '<div data-curso-id="' + curso.id + '" ' +
    'class="block bg-white rounded-2xl ring-1 ring-gray-200 p-5 hover:shadow-lg hover:ring-indigo-300 transition group cursor-pointer" ' +
    'onclick="window.location.href=\'' + base + '/paginas/detalhes.html?id=' + curso.id + '\'" role="link" tabindex="0">' +
    '<div class="flex items-start justify-between gap-2">' +
    '<div class="flex-1 min-w-0">' +
    '<span class="text-xs font-bold uppercase tracking-wide text-indigo-600">' + escapeHTML(sigla || nomeInst) + '</span>' +
    '<h3 class="mt-1 text-base font-bold text-gray-900 group-hover:text-indigo-700 transition truncate">' + escapeHTML(curso.nome) + '</h3>' +
    '<p class="text-sm text-gray-500 truncate">' + escapeHTML(nomeInst) + '</p>' +
    '</div>' +
    '<button type="button" data-favoritar="' + curso.id + '" ' +
    'data-nome="' + escapeHTML(curso.nome) + '" ' +
    'data-instituicao="' + escapeHTML(nomeInst) + '" ' +
    'data-sigla="' + escapeHTML(sigla) + '" ' +
    'data-cidade="' + escapeHTML(cidade) + '" ' +
    'data-estado="' + escapeHTML(uf) + '" ' +
    'data-grau="' + escapeHTML(grau) + '" ' +
    'data-modalidade="' + escapeHTML(modalidade) + '" ' +
    'aria-label="' + favLabel + ' ' + escapeHTML(curso.nome) + '" ' +
    'aria-pressed="' + favoritado + '" ' +
    'class="shrink-0 p-2 rounded-full border transition ' + favClasses + '" title="' + favLabel + '">' +
    '<span class="sr-only">' + favLabel + '</span>' +
    iconeFav +
    '</button>' +
    '</div>' +
    '<div class="mt-3 flex flex-wrap gap-1.5">' +
    (categoria ? '<span class="text-xs ' + catCor + ' px-2 py-0.5 rounded-full font-medium">' + escapeHTML(categoria) + '</span>' : '') +
    (tipoInst ? '<span class="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">' + escapeHTML(tipoInst.replace('_', ' ')) + '</span>' : '') +
    (grau ? '<span class="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">' + escapeHTML(grau) + '</span>' : '') +
    (modalidade ? '<span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">' + escapeHTML(modalidade) + '</span>' : '') +
    (turno ? '<span class="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">' + escapeHTML(turno) + '</span>' : '') +
    (cidade ? '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">' + escapeHTML(cidade) + '/' + escapeHTML(uf) + '</span>' : '') +
    (campus ? '<span class="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">' + escapeHTML(campus) + '</span>' : '') +
    (demanda ? badge(rotuloDemanda(demanda), corDemanda(demanda)) : '') +
    '</div>' +
    '</div>'
}

function botaoFavorito(curso, grande) {
  const favoritado = estaFavoritado(curso.id)
  const cls = grande
    ? (favoritado ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50')
    : (favoritado ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50')
  const tamanho = grande ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-xs'
  const iconeFav = favoritado ? ICONES.estrela : ICONES.estrelaVazia

  const nomeInst = curso.instituicao_nome || curso.instituicao || ''

  return '<button type="button" data-favoritar="' + curso.id + '" ' +
    'data-nome="' + escapeHTML(curso.nome) + '" ' +
    'data-instituicao="' + escapeHTML(nomeInst) + '" ' +
    'data-sigla="' + escapeHTML(curso.sigla || '') + '" ' +
    'data-cidade="' + escapeHTML(curso.cidade || '') + '" ' +
    'data-estado="' + escapeHTML(curso.uf || curso.estado || '') + '" ' +
    'data-grau="' + escapeHTML(curso.grau || '') + '" ' +
    'data-modalidade="' + escapeHTML(curso.modalidade || '') + '" ' +
    'aria-label="' + (favoritado ? 'Remover' : 'Adicionar') + ' ' + escapeHTML(curso.nome) + ' dos favoritos" ' +
    'aria-pressed="' + favoritado + '" ' +
    'class="inline-flex items-center gap-2 rounded-full border font-semibold transition ' + cls + ' ' + tamanho + '">' +
    iconeFav +
    '<span>' + (favoritado ? 'Favoritado' : 'Favoritar') + '</span>' +
    '</button>'
}

function tabelaNotas(notas) {
  if (!notas || notas.length === 0) {
    return estadoVazio('Nenhuma nota de corte registrada para este curso.')
  }
  let html = '<div class="overflow-x-auto"><table class="w-full text-sm">' +
    '<thead><tr class="border-b border-gray-200">' +
    '<th class="text-left py-3 px-3 font-semibold text-gray-700">Processo</th>' +
    '<th class="text-left py-3 px-3 font-semibold text-gray-700">Ano</th>' +
    '<th class="text-left py-3 px-3 font-semibold text-gray-700">Chamada</th>' +
    '<th class="text-right py-3 px-3 font-semibold text-gray-700">Nota de Corte</th>' +
    '<th class="text-right py-3 px-3 font-semibold text-gray-700">Fonte</th>' +
    '</tr></thead><tbody>'

  for (const nota of notas) {
    const processo = nota.processo || nota.modalidade_acesso || ''
    const cor = processo.toLowerCase() === 'sisu'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700'
    const fonte = nota.fonte_tipo === 'oficial'
      ? badge('SiSU - Fonte oficial', 'bg-green-100 text-green-700')
      : badge('SiSU - Dados abertos', 'bg-blue-100 text-blue-700')
    const notaValor = nota.nota_corte || nota.nota_minima
    html += '<tr class="border-b border-gray-100 hover:bg-gray-50">' +
      '<td class="py-3 px-3">' + badge(processo || '\u2014', cor) + '</td>' +
      '<td class="py-3 px-3">' + escapeHTML(String(nota.ano || '')) + '</td>' +
      '<td class="py-3 px-3">' + escapeHTML(String(nota.chamada || '')) + '\u00aa chamada</td>' +
      '<td class="py-3 px-3 text-right font-bold text-gray-900">' + (notaValor ? notaValor.toFixed(1) : 'Nota de corte não disponível') + '</td>' +
      '<td class="py-3 px-3 text-right">' + fonte + '</td>' +
      '</tr>'
  }
  html += '</tbody></table></div>'
  return html
}

function linhaFonte(fonte, atualizado) {
  if (!fonte && !atualizado) return ''
  let texto = ''
  if (fonte) texto += 'Fonte: ' + escapeHTML(String(fonte))
  if (atualizado) texto += (texto ? ' · ' : '') + 'Atualizado em: ' + escapeHTML(String(atualizado))
  return '<p class="mt-4 text-xs text-gray-400">' + texto + '</p>'
}

function listaAuxilios(auxilios) {
  if (!auxilios || auxilios.length === 0) {
    return estadoVazio('Nenhuma bolsa ou aux\u00edlio encontrado para esta institui\u00e7\u00e3o.')
  }
  return '<div class="space-y-3">' +
    auxilios.map((a) => {
      const cor = a.tipo === 'bolsa'
        ? 'bg-green-100 text-green-700'
        : 'bg-yellow-100 text-yellow-700'
      const urlSegura = a.url && (a.url.startsWith('http://') || a.url.startsWith('https://'))
        ? '<a href="' + escapeHTML(a.url) + '" target="_blank" rel="noopener" class="text-indigo-600 text-sm hover:underline whitespace-nowrap">Mais info &#8599;</a>'
        : ''
      return '<div class="bg-white rounded-xl ring-1 ring-gray-200 p-4">' +
        '<div class="flex items-start justify-between gap-3">' +
        '<div class="flex-1">' +
        '<h4 class="font-bold text-gray-900">' + escapeHTML(a.nome) + '</h4>' +
        badge(a.tipo || 'aux\u00edlio', cor) +
        (a.descricao ? '<p class="mt-2 text-sm text-gray-600">' + escapeHTML(a.descricao) + '</p>' : '') +
        (a.publico_alvo ? '<p class="mt-1 text-xs text-gray-500">P\u00fablico-alvo: ' + escapeHTML(a.publico_alvo) + '</p>' : '') +
        '</div>' +
        '<div class="text-right shrink-0">' +
        urlSegura +
        (a.coletado_em ? '<p class="mt-1 text-xs text-gray-400">' + badge('Dados abertos', 'bg-gray-100 text-gray-500') + '</p>' : '') +
        '</div>' +
        '</div></div>'
    }).join('') +
    '</div>'
}

function detalhesCampus(campi) {
  if (!campi || campi.length === 0) return ''
  let html = '<div class="mt-6">' +
    '<h3 class="text-lg font-bold text-gray-900 mb-3">Campi</h3>' +
    '<div class="space-y-2">'

  for (const c of campi) {
    html += '<div class="bg-white rounded-xl ring-1 ring-gray-200 p-4">' +
      '<h4 class="font-bold text-gray-900">' + escapeHTML(c.nome) + '</h4>'
    if (c.cidade) html += '<p class="text-sm text-gray-500">' + escapeHTML(c.cidade) + '/' + escapeHTML(c.uf || '') + '</p>'
    if (c.endereco) html += '<p class="text-xs text-gray-400 mt-1">' + escapeHTML(c.endereco) + '</p>'
    if (c.site_oficial) {
      html += '<a href="' + escapeHTML(c.site_oficial) + '" target="_blank" rel="noopener" class="text-indigo-600 text-xs hover:underline mt-1 inline-block">Site oficial &#8599;</a>'
    }
    html += '</div>'
  }

  html += '</div></div>'
  return html
}
