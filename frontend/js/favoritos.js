// favoritos.js — Sistema de favoritos (RF6): armazenamento local + sincronização com a API.

const CHAVE_FAVORITOS = 'ingresso_universitario_favoritos'
const CHAVE_SESSAO = 'ingresso_universitario_sessao'

// Identificador anônimo de sessão (uuid gerado na primeira visita)
function obterSessao() {
  let sessao = localStorage.getItem(CHAVE_SESSAO)
  if (!sessao) {
    sessao = gerarUUID()
    localStorage.setItem(CHAVE_SESSAO, sessao)
  }
  return sessao
}

// Lista de favoritos armazenada localmente (fonte principal, funciona offline)
function obterFavoritosLocal() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_FAVORITOS)) || []
  } catch {
    return []
  }
}

function salvarFavoritosLocal(lista) {
  localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista))
  atualizarContadorFavoritos()
}

// Verifica se um curso já está nos favoritos
function estaFavoritado(cursoId) {
  return obterFavoritosLocal().some((f) => String(f.curso_id) === String(cursoId))
}

// Sincroniza favoritos com a API (melhor esforço — falhas de conexão são ignoradas)
async function sincronizarComAPI() {
  try {
    const resultado = await api('GET', `/favoritos?sessao_usuario=${encodeURIComponent(obterSessao())}`)
    const remotos = (resultado.dados || []).map((item) => ({
      id: item.id,
      curso_id: item.curso_id,
      nome: item.nome || item.curso_nome,
      instituicao: item.instituicao || item.instituicao_nome,
      sigla: item.sigla || '',
      cidade: item.cidade || '',
      estado: item.estado || '',
      grau: item.grau || '',
      modalidade: item.modalidade || '',
      nota_minima: item.nota_minima || null,
      criado_em: item.criado_em
    }))
    let local = obterFavoritosLocal()
    remotos.forEach((favorito) => {
      if (!favorito.curso_id) return
      if (!local.some((f) => String(f.curso_id) === String(favorito.curso_id))) {
        local.push(favorito)
      }
    })
    local = local.sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || ''))
    salvarFavoritosLocal(local)
  } catch {
    // Modo offline: mantém apenas os dados locais
  }
}

// Adiciona um curso aos favoritos (local + tentativa de POST na API)
function adicionarFavorito(curso) {
  const lista = obterFavoritosLocal()
  if (estaFavoritado(curso.id)) return

  lista.push({
    id: Date.now(),
    curso_id: curso.id,
    nome: curso.nome,
    instituicao: curso.instituicao,
    sigla: curso.sigla || '',
    cidade: curso.cidade,
    estado: curso.estado,
    grau: curso.grau || '',
    modalidade: curso.modalidade || '',
    nota_minima: curso.nota_minima || null,
    criado_em: new Date().toISOString()
  })
  salvarFavoritosLocal(lista)
  atualizarBotoesFavorito(curso.id)
  toast(`${curso.nome} adicionado aos favoritos.`, 'sucesso')

  api('POST', '/favoritos', {
    sessao_usuario: obterSessao(),
    curso_id: curso.id
  }).catch(() => {})
}

// Remove um curso dos favoritos (local + tentativa de DELETE na API)
function removerFavorito(cursoId) {
  const favorito = obterFavoritosLocal().find((f) => String(f.curso_id) === String(cursoId))
  const nome = favorito ? favorito.nome : 'Curso'
  const listaFiltrada = obterFavoritosLocal().filter((f) => String(f.curso_id) !== String(cursoId))
  salvarFavoritosLocal(listaFiltrada)
  atualizarBotoesFavorito(cursoId)
  toast(`${nome} removido dos favoritos.`, 'sucesso')

  if (favorito && favorito.id && String(favorito.id).length < 15) {
    api('DELETE', `/favoritos/${favorito.id}`).catch(() => {})
  }
}

// Alterna o estado de favorito de um curso
function alternarFavorito(curso) {
  if (estaFavoritado(curso.id)) {
    removerFavorito(curso.id)
  } else {
    adicionarFavorito(curso)
  }
}

// Atualiza todos os botões de favoritar que apontam para o mesmo curso
function atualizarBotoesFavorito(cursoId) {
  document.querySelectorAll(`[data-favoritar="${CSS.escape(String(cursoId))}"]`).forEach((botao) => {
    const favoritado = estaFavoritado(cursoId)
    botao.setAttribute('aria-pressed', String(favoritado))
    const rotulo = botao.querySelector('span')
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

// Delegação global: qualquer clique em [data-favoritar] aciona o toggle de favorito
document.addEventListener('click', (evento) => {
  const alvo = evento.target.closest('[data-favoritar]')
  if (!alvo) return
  evento.preventDefault()
  alternarFavorito({
    id: alvo.dataset.favoritar,
    nome: alvo.dataset.nome,
    instituicao: alvo.dataset.instituicao,
    sigla: alvo.dataset.sigla,
    cidade: alvo.dataset.cidade,
    estado: alvo.dataset.estado,
    grau: alvo.dataset.grau,
    modalidade: alvo.dataset.modalidade,
    nota_minima: alvo.dataset.nota || null
  })

  // Na página de favoritos, remove o card da grade quando desfavoritado
  const paginaFavoritos = window.location.pathname.includes('favoritos.html')
  const cartao = alvo.closest('[data-curso-id]')
  if (paginaFavoritos && cartao && !estaFavoritado(cartao.dataset.cursoId)) {
    const area = document.getElementById('areaFavoritos')
    if (area) {
      cartao.remove()
      if (area.querySelectorAll('[data-curso-id]').length === 0) {
        area.innerHTML = estadoVazio('Você ainda não favoritou nenhum curso ou universidade.')
      }
    }
  }
})