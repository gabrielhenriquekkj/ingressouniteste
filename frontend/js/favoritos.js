// favoritos.js — Sistema de favoritos (RF6): armazenamento local + sincronizacao com a API.

const CHAVE_FAVORITOS = 'ingresso_universitario_favoritos'
const CHAVE_SESSAO = 'ingresso_universitario_sessao'

function obterSessao() {
  let sessao = localStorage.getItem(CHAVE_SESSAO)
  if (!sessao) {
    sessao = gerarUUID()
    localStorage.setItem(CHAVE_SESSAO, sessao)
  }
  return sessao
}

function obterFavoritosLocal() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_FAVORITOS)) || []
  } catch (e) {
    return []
  }
}

function salvarFavoritosLocal(lista) {
  localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista))
  if (typeof atualizarContadorFavoritos === 'function') atualizarContadorFavoritos()
}

function estaFavoritado(cursoId) {
  return obterFavoritosLocal().some(function (f) { return String(f.curso_id) === String(cursoId) })
}

async function sincronizarComAPI() {
  try {
    var resultado = await api('GET', '/favoritos?sessao_usuario=' + encodeURIComponent(obterSessao()))
    var remotos = (resultado.dados || []).map(function (item) {
      return {
        id: item.id,
        curso_id: item.curso_id,
        nome: item.curso_nome || item.nome || '',
        instituicao: item.instituicao_nome || item.instituicao || '',
        sigla: item.sigla || '',
        cidade: item.cidade || '',
        estado: item.estado || '',
        grau: item.grau || '',
        modalidade: item.modalidade || '',
        instituicao_id: item.instituicao_id || null,
        criado_em: item.criado_em
      }
    })
    var local = obterFavoritosLocal()
    remotos.forEach(function (favorito) {
      if (!favorito.curso_id) return
      if (!local.some(function (f) { return String(f.curso_id) === String(favorito.curso_id) })) {
        local.push(favorito)
      }
    })
    local = local.sort(function (a, b) { return (b.criado_em || '').localeCompare(a.criado_em || '') })
    salvarFavoritosLocal(local)
  } catch (e) {
    // Modo offline
  }
}

function adicionarFavorito(curso) {
  var lista = obterFavoritosLocal()
  if (estaFavoritado(curso.id)) return

  lista.push({
    id: Date.now(),
    curso_id: curso.id,
    nome: curso.nome,
    instituicao: curso.instituicao || '',
    sigla: curso.sigla || '',
    cidade: curso.cidade || '',
    estado: curso.estado || '',
    grau: curso.grau || '',
    modalidade: curso.modalidade || '',
    instituicao_id: curso.instituicao_id || null,
    criado_em: new Date().toISOString()
  })
  salvarFavoritosLocal(lista)
  atualizarBotoesFavorito(curso.id)
  toast(curso.nome + ' adicionado aos favoritos.', 'sucesso')

  api('POST', '/favoritos', {
    sessao_usuario: obterSessao(),
    curso_id: curso.id,
    instituicao_id: curso.instituicao_id || null
  }).catch(function () {})
}

function removerFavorito(cursoId) {
  var favorito = obterFavoritosLocal().find(function (f) { return String(f.curso_id) === String(cursoId) })
  var nome = favorito ? favorito.nome : 'Curso'
  var listaFiltrada = obterFavoritosLocal().filter(function (f) { return String(f.curso_id) !== String(cursoId) })
  salvarFavoritosLocal(listaFiltrada)
  atualizarBotoesFavorito(cursoId)
  toast(nome + ' removido dos favoritos.', 'sucesso')

  if (favorito && favorito.id && String(favorito.id).length < 15) {
    api('DELETE', '/favoritos/' + favorito.id).catch(function () {})
  }
}

function alternarFavorito(curso) {
  if (estaFavoritado(curso.id)) {
    removerFavorito(curso.id)
  } else {
    adicionarFavorito(curso)
  }
}

function atualizarBotoesFavorito(cursoId) {
  document.querySelectorAll('[data-favoritar="' + CSS.escape(String(cursoId)) + '"]').forEach(function (botao) {
    var favoritado = estaFavoritado(cursoId)
    botao.setAttribute('aria-pressed', String(favoritado))
    var rotulo = botao.querySelector('span')
    if (rotulo) rotulo.textContent = favoritado ? 'Favoritado' : 'Favoritar'
    botao.classList.toggle('bg-amber-500', favoritado)
    botao.classList.toggle('text-white', favoritado)
    botao.classList.toggle('border-amber-500', favoritado)
    botao.classList.toggle('bg-white', !favoritado)
    botao.classList.toggle('text-indigo-700', !favoritado)
    botao.classList.toggle('border-indigo-200', !favoritado)
    botao.classList.toggle('hover:bg-indigo-50', !favoritado)
  })
}

document.addEventListener('click', function (evento) {
  var alvo = evento.target.closest('[data-favoritar]')
  if (!alvo) return
  evento.preventDefault()
  evento.stopPropagation()
  alternarFavorito({
    id: alvo.dataset.favoritar,
    nome: alvo.dataset.nome,
    instituicao: alvo.dataset.instituicao,
    sigla: alvo.dataset.sigla,
    cidade: alvo.dataset.cidade,
    estado: alvo.dataset.estado,
    grau: alvo.dataset.grau,
    modalidade: alvo.dataset.modalidade
  })

  var paginaFavoritos = window.location.pathname.includes('favoritos.html')
  var cartao = alvo.closest('[data-curso-id]')
  if (paginaFavoritos && cartao && !estaFavoritado(cartao.dataset.cursoId)) {
    cartao.style.transition = 'opacity 0.3s, transform 0.3s'
    cartao.style.opacity = '0'
    cartao.style.transform = 'scale(0.95)'
    setTimeout(function () {
      cartao.remove()
      var area = document.getElementById('areaFavoritos')
      if (area && area.querySelectorAll('[data-curso-id]').length === 0) {
        area.innerHTML = estadoVazio('Voce ainda nao favoritou nenhum curso.')
      }
    }, 300)
  }
})

function atualizarResumoFavoritos() {
  var resumo = document.getElementById('resumoFavoritos')
  if (!resumo) return
  var quantidade = obterFavoritosLocal().length
  resumo.textContent = quantidade + (quantidade === 1 ? ' favorito' : ' favoritos')
}

function renderizarPaginaFavoritos() {
  var area = document.getElementById('areaFavoritos')
  if (!area) return

  var lista = obterFavoritosLocal()
  atualizarResumoFavoritos()

  if (lista.length === 0) {
    area.innerHTML = estadoVazio('Voce ainda nao favoritou nenhum curso. Use o botao Favoritar na busca ou na pagina de detalhes.')
    return
  }

  area.innerHTML = lista.map(function (favorito) {
    return cardResultado({
      id: favorito.curso_id,
      nome: favorito.nome,
      instituicao_nome: favorito.instituicao,
      sigla: favorito.sigla,
      cidade: favorito.cidade,
      estado: favorito.estado,
      grau: favorito.grau,
      modalidade: favorito.modalidade,
      demanda: ''
    })
  }).join('')
}

document.addEventListener('DOMContentLoaded', function () {
  if (!window.location.pathname.includes('favoritos.html')) return
  montarNavbar('favoritos')
  renderizarPaginaFavoritos()
  sincronizarComAPI().then(function () { renderizarPaginaFavoritos() })
})
