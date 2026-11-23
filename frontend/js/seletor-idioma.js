function montarSeletorIdioma(sufixo) {
  const id = 'seletorIdioma' + (sufixo || '')
  const opcoes = IDIOMAS.map(function (idioma) {
    return '<option value="' + idioma.codigo + '"' + (idioma.codigo === obterIdioma() ? ' selected' : '') + '>' +
      escapeHTML(idioma.rotuloCurto) + '</option>'
  }).join('')

  return '<div class="flex shrink-0 items-center gap-0.5 sm:gap-1.5">' +
    '<svg class="h-3.5 w-3.5 shrink-0 text-gray-500 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.7 5.7 3.7 9S14.5 18.3 12 21c-2.5-2.7-3.7-5.7-3.7-9S9.5 5.7 12 3z"/>' +
    '</svg>' +
    '<select id="' + id + '" data-seletor-idioma aria-label="' + escapeHTML(t('idioma.selecionar')) + '" ' +
    'class="w-12 cursor-pointer rounded-full border border-gray-200 bg-white/90 px-1 py-1 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-16 sm:px-2 sm:text-sm">' +
    opcoes +
    '</select>' +
    '</div>'
}

document.addEventListener('change', function (evento) {
  const seletor = evento.target.closest('[data-seletor-idioma]')
  if (!seletor) return
  definirIdioma(seletor.value)
})

document.addEventListener('DOMContentLoaded', function () {
  const flutuante = document.getElementById('seletorIdiomaFlutuante')
  if (!flutuante) return
  flutuante.innerHTML = montarSeletorIdioma('Chat')
  atualizarSeletoresIdioma()
})
