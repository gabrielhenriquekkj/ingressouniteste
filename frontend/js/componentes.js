// componentes.js — Componentes de UI reutilizaveis

function cardResultado(curso) {
  const base = caminhoBase()
  const demanda = curso.demanda || ''
  const nomeInst = curso.instituicao_nome || curso.instituicao || ''
  const sigla = curso.sigla || ''
  const cidade = curso.cidade || ''
  const estado = curso.estado || ''
  const grau = curso.grau || ''
  const modalidade = curso.modalidade || ''
  const favoritado = estaFavoritado(curso.id)

  const favClasses = favoritado
    ? 'bg-amber-500 text-white border-amber-500'
    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'

  const favLabel = favoritado ? 'Favoritado' : 'Favoritar'

  return '<a href="' + base + '/paginas/detalhes.html?id=' + curso.id + '" ' +
    'class="block bg-white rounded-2xl ring-1 ring-gray-200 p-5 hover:shadow-lg hover:ring-indigo-300 transition group">' +
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
    'data-estado="' + escapeHTML(estado) + '" ' +
    'data-grau="' + escapeHTML(grau) + '" ' +
    'data-modalidade="' + escapeHTML(modalidade) + '" ' +
    'aria-pressed="' + favoritado + '" ' +
    'class="shrink-0 p-2 rounded-full border transition ' + favClasses + '" title="' + favLabel + '">' +
    '<span class="sr-only">' + favLabel + '</span>' +
    (favoritado ? ICONES.estrela : ICONES.estrela) +
    '</button>' +
    '</div>' +
    '<div class="mt-3 flex flex-wrap gap-1.5">' +
    (grau ? '<span class="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">' + escapeHTML(grau) + '</span>' : '') +
    (modalidade ? '<span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">' + escapeHTML(modalidade) + '</span>' : '') +
    (cidade ? '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">' + escapeHTML(cidade) + '/' + escapeHTML(estado) + '</span>' : '') +
    (demanda ? badge(rotuloDemanda(demanda), corDemanda(demanda)) : '') +
    '</div>' +
    '</a>'
}

function botaoFavorito(curso, grande) {
  const favoritado = estaFavoritado(curso.id)
  const cls = grande
    ? (favoritado ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50')
    : (favoritado ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50')
  const tamanho = grande ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-xs'

  const nomeInst = curso.instituicao_nome || curso.instituicao || ''

  return '<button type="button" data-favoritar="' + curso.id + '" ' +
    'data-nome="' + escapeHTML(curso.nome) + '" ' +
    'data-instituicao="' + escapeHTML(nomeInst) + '" ' +
    'data-sigla="' + escapeHTML(curso.sigla || '') + '" ' +
    'data-cidade="' + escapeHTML(curso.cidade || '') + '" ' +
    'data-estado="' + escapeHTML(curso.estado || '') + '" ' +
    'data-grau="' + escapeHTML(curso.grau || '') + '" ' +
    'data-modalidade="' + escapeHTML(curso.modalidade || '') + '" ' +
    'aria-pressed="' + favoritado + '" ' +
    'class="inline-flex items-center gap-2 rounded-full border font-semibold transition ' + cls + ' ' + tamanho + '">' +
    ICONES.estrela +
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
    '<th class="text-right py-3 px-3 font-semibold text-gray-700">Nota M\u00ednima</th>' +
    '</tr></thead><tbody>'

  for (const nota of notas) {
    const cor = nota.modalidade_acesso === 'SiSU'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700'
    html += '<tr class="border-b border-gray-100 hover:bg-gray-50">' +
      '<td class="py-3 px-3">' + badge(nota.modalidade_acesso || '\u2014', cor) + '</td>' +
      '<td class="py-3 px-3">' + nota.ano + '</td>' +
      '<td class="py-3 px-3">' + nota.chamada + '\u00aa chamada</td>' +
      '<td class="py-3 px-3 text-right font-bold text-gray-900">' + (nota.nota_minima ? nota.nota_minima.toFixed(1) : '\u2014') + '</td>' +
      '</tr>'
  }
  html += '</tbody></table></div>'
  return html
}

function linhaFonte(fonte, atualizado) {
  if (!fonte && !atualizado) return ''
  let texto = ''
  if (fonte) texto += 'Fonte: ' + escapeHTML(String(fonte))
  if (atualizado) texto += (texto ? ' \u00b7 ' : '') + 'Atualizado em: ' + escapeHTML(String(atualizado))
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
      return '<div class="bg-white rounded-xl ring-1 ring-gray-200 p-4">' +
        '<div class="flex items-start justify-between gap-3">' +
        '<div class="flex-1">' +
        '<h4 class="font-bold text-gray-900">' + escapeHTML(a.nome) + '</h4>' +
        badge(a.tipo || 'aux\u00edlio', cor) +
        (a.descricao ? '<p class="mt-2 text-sm text-gray-600">' + escapeHTML(a.descricao) + '</p>' : '') +
        '</div>' +
        (a.url ? '<a href="' + a.url + '" target="_blank" rel="noopener" class="text-indigo-600 text-sm hover:underline whitespace-nowrap">Mais info &#8599;</a>' : '') +
        '</div></div>'
    }).join('') +
    '</div>'
}
