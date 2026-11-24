function montarSeletorIdioma(sufixo) {
  const id = 'seletorIdioma' + (sufixo || '')
  const opcoes = IDIOMAS.map(function (idioma) {
    return '<option value="' + idioma.codigo + '"' + (idioma.codigo === obterIdioma() ? ' selected' : '') +
      ' title="' + escapeHTML(idioma.bandeira + ' ' + idioma.rotulo) + '">' +
      escapeHTML(idioma.bandeira + ' ' + idioma.rotuloCurto) + '</option>'
  }).join('')

  return '<div class="seletor-idioma-wrap">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.7 5.7 3.7 9S14.5 18.3 12 21c-2.5-2.7-3.7-5.7-3.7-9S9.5 5.7 12 3z"/>' +
    '</svg>' +
    '<select id="' + id + '" class="seletor-idioma" data-seletor-idioma aria-label="' + escapeHTML(t('idioma.selecionar')) + '">' +
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
