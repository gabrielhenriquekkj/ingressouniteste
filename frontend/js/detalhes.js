// Modulo de detalhes do curso (RF2-RF6)
;(function () {
  const carregando = document.getElementById('carregando')
  const conteudoCurso = document.getElementById('conteudoCurso')
  const erroCarregamento = document.getElementById('erroCarregamento')

  // Elementos do cabecalho
  const nomeCurso = document.getElementById('nomeCurso')
  const nomeInstituicao = document.getElementById('nomeInstituicao')
  const badgeGrau = document.getElementById('badgeGrau')
  const badgeModalidade = document.getElementById('badgeModalidade')
  const badgeDuracao = document.getElementById('badgeDuracao')
  const badgeLocal = document.getElementById('badgeLocal')
  const btnFavoritar = document.getElementById('btnFavoritar')
  const iconeFavorito = document.getElementById('iconeFavorito')
  const textoFavorito = document.getElementById('textoFavorito')

  // Obtem o ID do curso da URL
  function obterIdCurso() {
    const params = new URLSearchParams(window.location.search)
    return parseInt(params.get('id'))
  }

  // Abas
  function configurarAbas() {
    document.querySelectorAll('.aba').forEach(aba => {
      aba.addEventListener('click', () => {
        document.querySelectorAll('.aba').forEach(a => {
          a.classList.remove('border-indigo-600', 'text-indigo-600')
          a.classList.add('border-transparent', 'text-gray-500')
        })
        aba.classList.remove('border-transparent', 'text-gray-500')
        aba.classList.add('border-indigo-600', 'text-indigo-600')

        document.querySelectorAll('.secao-aba').forEach(s => s.classList.add('hidden'))
        document.getElementById(`aba-${aba.dataset.aba}`).classList.remove('hidden')
      })
    })
  }

  // Renderiza tabela de notas de corte
  function renderizarNotas(notas) {
    const container = document.getElementById('tabelaNotas')
    if (!notas || notas.length === 0) {
      container.innerHTML = '<p class="text-gray-500">Nenhuma nota de corte registrada para este curso.</p>'
      return
    }

    let html = `
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Processo</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Ano</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Chamada</th>
            <th class="text-right py-3 px-4 font-semibold text-gray-700">Nota Minima</th>
          </tr>
        </thead>
        <tbody>
    `
    for (const nota of notas) {
      html += `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
          <td class="py-3 px-4">
            <span class="inline-block px-2 py-1 rounded-full text-xs font-medium ${nota.modalidade_acesso === 'SiSU' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}">
              ${nota.modalidade_acesso || 'Nao informado'}
            </span>
          </td>
          <td class="py-3 px-4">${nota.ano}</td>
          <td class="py-3 px-4">${nota.chamada}a chamada</td>
          <td class="py-3 px-4 text-right font-bold text-gray-900">${nota.nota_minima ? nota.nota_minima.toFixed(1) : '-'}</td>
        </tr>
      `
    }
    html += '</tbody></table>'
    container.innerHTML = html
  }

  // Renderiza painel de custos
  function renderizarCustos(custo) {
    const container = document.getElementById('painelCustos')
    if (!custo) {
      container.innerHTML = '<p class="text-gray-500">Nenhum dado de custo disponivel para esta cidade.</p>'
      return
    }

    const total = (custo.moradia || 0) + (custo.alimentacao || 0) + (custo.transporte || 0) + (custo.outros || 0)

    container.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="bg-blue-50 rounded-xl p-4 text-center">
          <div class="text-2xl mb-1">&#127968;</div>
          <div class="text-sm text-gray-600">Moradia</div>
          <div class="text-lg font-bold text-gray-900">${ApiModulo.formatarMoeda(custo.moradia)}</div>
        </div>
        <div class="bg-green-50 rounded-xl p-4 text-center">
          <div class="text-2xl mb-1">&#127828;</div>
          <div class="text-sm text-gray-600">Alimentacao</div>
          <div class="text-lg font-bold text-gray-900">${ApiModulo.formatarMoeda(custo.alimentacao)}</div>
        </div>
        <div class="bg-orange-50 rounded-xl p-4 text-center">
          <div class="text-2xl mb-1">&#128652;</div>
          <div class="text-sm text-gray-600">Transporte</div>
          <div class="text-lg font-bold text-gray-900">${ApiModulo.formatarMoeda(custo.transporte)}</div>
        </div>
        <div class="bg-purple-50 rounded-xl p-4 text-center">
          <div class="text-2xl mb-1">&#128176;</div>
          <div class="text-sm text-gray-600">Outros</div>
          <div class="text-lg font-bold text-gray-900">${ApiModulo.formatarMoeda(custo.outros)}</div>
        </div>
      </div>
      <div class="bg-indigo-50 rounded-xl p-4 text-center border-2 border-indigo-200">
        <div class="text-sm text-indigo-600 font-medium">Total Estimado Mensal</div>
        <div class="text-2xl font-bold text-indigo-700">${ApiModulo.formatarMoeda(total)}</div>
        <div class="text-xs text-gray-500 mt-1">Referencia: ${custo.mes_referencia || 'Nao informado'}</div>
      </div>
    `
  }

  // Renderiza lista de bolsas e auxilios
  function renderizarBolsas(bolsas) {
    const container = document.getElementById('listaBolsas')
    if (!bolsas || bolsas.length === 0) {
      container.innerHTML = '<p class="text-gray-500">Nenhuma bolsa ou auxilio encontrado para esta instituicao.</p>'
      return
    }

    let html = '<div class="space-y-3">'
    for (const bolsa of bolsas) {
      html += `
        <div class="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <h4 class="font-bold text-gray-900">${bolsa.nome}</h4>
              <span class="inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${bolsa.tipo === 'bolsa' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                ${bolsa.tipo || 'auxilio'}
              </span>
              ${bolsa.descricao ? `<p class="mt-2 text-sm text-gray-600">${bolsa.descricao}</p>` : ''}
            </div>
            ${bolsa.url ? `<a href="${bolsa.url}" target="_blank" class="text-indigo-600 text-sm hover:underline whitespace-nowrap">Mais info &#8599;</a>` : ''}
          </div>
        </div>
      `
    }
    html += '</div>'
    container.innerHTML = html
  }

  // Renderiza painel de mercado e estagios
  function renderizarMercado(dados) {
    const container = document.getElementById('painelMercado')
    if (!dados || dados.length === 0) {
      container.innerHTML = '<p class="text-gray-500">Nenhum dado de mercado disponivel para este curso.</p>'
      return
    }

    let html = '<div class="space-y-4">'
    for (const item of dados) {
      const corDemanda = item.demanda === 'alta' ? 'bg-green-100 text-green-700' :
                         item.demanda === 'media' ? 'bg-yellow-100 text-yellow-700' :
                         'bg-red-100 text-red-700'
      html += `
        <div class="border border-gray-200 rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-gray-900">${item.regiao || 'Regiao nao informada'}</h4>
            <span class="px-3 py-1 rounded-full text-xs font-bold ${corDemanda}">
              Demanda: ${item.demanda || 'Nao informado'}
            </span>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div class="text-xs text-gray-500">Salario Medio</div>
              <div class="font-bold text-gray-900">${ApiModulo.formatarMoeda(item.salario_medio)}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Vagas de Estagio</div>
              <div class="font-bold text-gray-900">${item.vagas_estagio || 'Nao informado'}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Fonte</div>
              <div class="font-bold text-gray-900">${item.fonte || 'Nao informado'}</div>
            </div>
          </div>
          ${item.atualizado_em ? `<div class="text-xs text-gray-400 mt-2">Atualizado em: ${item.atualizado_em}</div>` : ''}
        </div>
      `
    }
    html += '</div>'
    container.innerHTML = html
  }

  // Carrega os detalhes do curso
  async function carregarDetalhes() {
    const cursoId = obterIdCurso()
    if (!cursoId) {
      carregando.classList.add('hidden')
      erroCarregamento.classList.remove('hidden')
      return
    }

    try {
      const resultado = await ApiModulo.detalharCurso(cursoId)
      const curso = resultado.dados

      // Preenche cabecalho
      nomeCurso.textContent = curso.nome
      nomeInstituicao.textContent = `${curso.instituicao_nome} ${curso.sigla ? `(${curso.sigla})` : ''}`
      badgeGrau.textContent = curso.grau || 'Grau nao informado'
      badgeModalidade.textContent = curso.modalidade || 'Modalidade nao informada'
      badgeDuracao.textContent = curso.duracao_semestres ? `${curso.duracao_semestres} semestres` : 'Duracao nao informada'
      badgeLocal.textContent = `${curso.cidade}/${curso.estado}`

      // Renderiza secoes
      renderizarNotas(curso.notas_corte)
      renderizarCustos(curso.custos)
      renderizarBolsas(curso.auxilios_bolsas)
      renderizarMercado(curso.mercado_estagios)

      // Configura favorito
      let ehFavorito = false
      try {
        const favs = await ApiModulo.listarFavoritos()
        ehFavorito = favs.dados.some(f => f.curso_id === curso.id)
      } catch { /* ignora erro ao checar favoritos */ }

      function atualizarBotaoFavorito() {
        iconeFavorito.textContent = ehFavorito ? '&#9829;' : '&#9825;'
        textoFavorito.textContent = ehFavorito ? 'Favoritado' : 'Favoritar'
        btnFavoritar.className = ehFavorito
          ? 'bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600 transition flex items-center gap-2 whitespace-nowrap'
          : 'bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2 whitespace-nowrap'
      }

      atualizarBotaoFavorito()

      btnFavoritar.addEventListener('click', async () => {
        try {
          if (ehFavorito) {
            // Para remover, precisamos do ID do favorito
            const favs = await ApiModulo.listarFavoritos()
            const fav = favs.dados.find(f => f.curso_id === curso.id)
            if (fav) {
              await ApiModulo.removerFavorito(fav.id)
              ehFavorito = false
              ApiModulo.exibirToast('Removido dos favoritos.', 'sucesso')
            }
          } else {
            await ApiModulo.adicionarFavorito(curso.id, curso.instituicao_id)
            ehFavorito = true
            ApiModulo.exibirToast('Adicionado aos favoritos!', 'sucesso')
          }
          atualizarBotaoFavorito()
        } catch (erro) {
          ApiModulo.exibirToast(erro.message || 'Erro ao atualizar favorito.', 'erro')
        }
      })

      // Mostra conteudo
      carregando.classList.add('hidden')
      conteudoCurso.classList.remove('hidden')

      // Configura abas
      configurarAbas()

      // Atualiza titulo da pagina
      document.title = `${curso.nome} — Ingresso Universitario`

    } catch (erro) {
      carregando.classList.add('hidden')
      erroCarregamento.classList.remove('hidden')
    }
  }

  // Inicializa
  carregarDetalhes()
})()
