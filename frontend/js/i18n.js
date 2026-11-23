const CHAVE_IDIOMA = 'ingresso_universitario_idioma'

let idiomaAtual = 'pt'

function idiomaSuportado(codigo) {
  return IDIOMAS.some(function (idioma) { return idioma.codigo === codigo })
}

function obterIdioma() {
  return idiomaAtual
}

function obterLocale() {
  const idioma = IDIOMAS.find(function (item) { return item.codigo === idiomaAtual })
  return idioma ? idioma.htmlLang : 'pt-BR'
}

function nomeIdioma(codigo) {
  const idioma = IDIOMAS.find(function (item) { return item.codigo === codigo })
  return idioma ? idioma.rotulo : codigo
}

function detectarIdiomaInicial() {
  try {
    const salvo = localStorage.getItem(CHAVE_IDIOMA)
    if (idiomaSuportado(salvo)) return salvo
  } catch (e) {}
  const preferido = String(navigator.language || '').toLowerCase().split('-')[0]
  if (idiomaSuportado(preferido)) return preferido
  return 'pt'
}

function t(chave, params) {
  const dicionario = TRADUCOES[idiomaAtual] || TRADUCOES.pt
  let texto = dicionario[chave]
  if (texto === undefined) texto = TRADUCOES.pt[chave]
  if (texto === undefined) return chave
  if (params) {
    Object.keys(params).forEach(function (nome) {
      texto = texto.split('{' + nome + '}').join(String(params[nome]))
    })
  }
  return texto
}

function tp(chave, quantidade, params) {
  const sufixo = Number(quantidade) === 1 ? 'Um' : 'Varios'
  return t(chave + sufixo, Object.assign({ quantidade: quantidade }, params || {}))
}

function aplicarTraducoesNoDocumento() {
  document.querySelectorAll('[data-i18n]').forEach(function (elemento) {
    elemento.textContent = t(elemento.getAttribute('data-i18n'))
  })
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (elemento) {
    elemento.setAttribute('placeholder', t(elemento.getAttribute('data-i18n-placeholder')))
  })
  document.querySelectorAll('[data-i18n-aria-label]').forEach(function (elemento) {
    elemento.setAttribute('aria-label', t(elemento.getAttribute('data-i18n-aria-label')))
  })
  document.querySelectorAll('[data-i18n-content]').forEach(function (elemento) {
    elemento.setAttribute('content', t(elemento.getAttribute('data-i18n-content')))
  })
}

function atualizarSeletoresIdioma() {
  const rotulo = t('idioma.selecionar') + ': ' + nomeIdioma(idiomaAtual)
  document.querySelectorAll('[data-seletor-idioma]').forEach(function (seletor) {
    seletor.value = idiomaAtual
    seletor.setAttribute('aria-label', rotulo)
    seletor.title = rotulo
  })
}

function sincronizarAtributosIdioma() {
  document.documentElement.lang = obterLocale()
}

function definirIdioma(codigo) {
  if (!idiomaSuportado(codigo)) return
  if (codigo !== idiomaAtual) {
    idiomaAtual = codigo
    try {
      localStorage.setItem(CHAVE_IDIOMA, codigo)
    } catch (e) {}
    sincronizarAtributosIdioma()
    aplicarTraducoesNoDocumento()
  }
  atualizarSeletoresIdioma()
  document.dispatchEvent(new CustomEvent('idioma:alterado', { detail: { idioma: idiomaAtual } }))
}

function formatarNumero(valor) {
  if (valor == null || valor === '' || isNaN(Number(valor))) return '\u2014'
  return Number(valor).toLocaleString(obterLocale())
}

document.addEventListener('DOMContentLoaded', function () {
  idiomaAtual = detectarIdiomaInicial()
  sincronizarAtributosIdioma()
  aplicarTraducoesNoDocumento()
  atualizarSeletoresIdioma()
})
