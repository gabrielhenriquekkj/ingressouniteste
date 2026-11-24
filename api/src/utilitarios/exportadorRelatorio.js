const FORMANDOS = ['csv', 'json', 'pdf']
const CABECALHOS = ['Data', 'Hora', 'Rota', 'Metodo', 'Dispositivo', 'Navegador', 'Sistema', 'IP anonimizado', 'Status', 'Area', 'Detalhes']

function linhasDoRelatorio(relatorio) {
  return (relatorio.dados || []).map(item => {
    const data = String(item.criadoEm || '')
    return [
      item.dia || '',
      data.includes('T') ? data.slice(11, 19) : '',
      item.rota || '',
      item.metodo || '',
      item.dispositivo || '',
      item.navegador || '',
      item.sistema || '',
      item.ipHash || '',
      item.status == null ? '' : String(item.status),
      item.area || '',
      item.detalhes || ''
    ]
  })
}

function csv(relatorio) {
  const escapar = valor => `"${String(valor ?? '').replace(/"/g, '""')}"`
  const linhas = [
    ['Relatorio', relatorio.nome],
    ['Gerado em', relatorio.geradoEm || new Date().toISOString()],
    ['Periodo', `${relatorio.filtros.inicio} a ${relatorio.filtros.fim}`],
    ['Pagina', relatorio.filtros.rota || 'Todas'],
    ['Total de registros', String(relatorio.totalRegistros)],
    [],
    CABECALHOS,
    ...linhasDoRelatorio(relatorio)
  ]
  const texto = linhas.map(linha => linha.map(escapar).join(';')).join('\r\n')
  return Buffer.concat([Buffer.from('\uFEFF', 'utf8'), Buffer.from(texto, 'utf8')])
}

function json(relatorio) {
  return Buffer.from(JSON.stringify({
    meta: {
      id: relatorio.id,
      nome: relatorio.nome,
      formatoOriginal: relatorio.formato,
      geradoEm: relatorio.geradoEm,
      filtros: relatorio.filtros,
      totalRegistros: relatorio.totalRegistros,
      resumo: relatorio.resumo
    },
    colunas: CABECALHOS,
    dados: relatorio.dados
  }, null, 2), 'utf8')
}

function textoSeguroPdf(valor, tamanho = 105) {
  return String(valor ?? '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
    .slice(0, tamanho)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function pdf(relatorio) {
  const meta = [
    `Gerado em: ${relatorio.geradoEm || new Date().toISOString()}`,
    `Periodo: ${relatorio.filtros.inicio} a ${relatorio.filtros.fim}`,
    `Pagina: ${relatorio.filtros.rota || 'Todas'} | Registros: ${relatorio.totalRegistros}`
  ]
  const topo = (relatorio.resumo?.ranking || []).slice(0, 5)
    .map((item, indice) => `${indice + 1}. ${item.rota} - ${item.total} acessos`)
  const linhas = [
    ...linhasDoRelatorio(relatorio).map(linha => linha.join(' | ')),
    '',
    'TOP 5 PAGINAS',
    ...topo
  ]

  const porPagina = 42
  const paginas = []
  for (let indice = 0; indice < linhas.length; indice += porPagina) {
    paginas.push(linhas.slice(indice, indice + porPagina))
  }
  if (!paginas.length) paginas.push([])

  const objetos = []
  const reservar = () => { objetos.push(null); return objetos.length }
  const idPaginas = reservar()
  const idCatalogo = reservar()
  const idFonte = reservar()
  const idFonteNegrito = reservar()
  const idsConteudo = paginas.map(() => reservar())
  const idsPagina = paginas.map(() => reservar())

  objetos[idFonte - 1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  objetos[idFonteNegrito - 1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
  objetos[idPaginas - 1] = `<< /Type /Pages /Kids [${idsPagina.map(id => `${id} 0 R`).join(' ')}] /Count ${idsPagina.length} >>`
  objetos[idCatalogo - 1] = `<< /Type /Catalog /Pages ${idPaginas} 0 R >>`

  paginas.forEach((pagina, indicePagina) => {
    const partes = ['BT', '/F2 16 Tf', '40 800 Td', `(${textoSeguroPdf(relatorio.nome, 60)}) Tj`, '/F1 9 Tf']
    if (indicePagina === 0) {
      for (const linha of meta) partes.push('0 -20 Td', `(${textoSeguroPdf(linha, 95)}) Tj`)
        partes.push('0 -16 Td', '(DATA HORA | ROTA | METODO | DISPOSITIVO | NAVEGADOR | SISTEMA | IP | STATUS | AREA | DETALHES) Tj')
    }
    for (const linha of pagina) {
      partes.push('0 -14 Td', `(${textoSeguroPdf(linha)}) Tj`)
    }
    partes.push('ET')
    const conteudo = partes.join('\n')
    objetos[idsConteudo[indicePagina] - 1] =
      `<< /Length ${Buffer.byteLength(conteudo, 'latin1')} >>\nstream\n${conteudo}\nendstream`
    objetos[idsPagina[indicePagina] - 1] =
      `<< /Type /Page /Parent ${idPaginas} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${idFonte} 0 R /F2 ${idFonteNegrito} 0 R >> >> /Contents ${idsConteudo[indicePagina]} 0 R >>`
  })

  let documento = '%PDF-1.4\n'
  const deslocamentos = [0]
  objetos.forEach((objeto, indice) => {
    deslocamentos.push(Buffer.byteLength(documento, 'latin1'))
    documento += `${indice + 1} 0 obj\n${objeto}\nendobj\n`
  })
  const posicaoXref = Buffer.byteLength(documento, 'latin1')
  documento += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
  for (const deslocamento of deslocamentos.slice(1)) {
    documento += `${String(deslocamento).padStart(10, '0')} 00000 n \n`
  }
  documento += `trailer\n<< /Size ${objetos.length + 1} /Root ${idCatalogo} 0 R >>\nstartxref\n${posicaoXref}\n%%EOF`
  return Buffer.from(documento, 'latin1')
}

function exportar(relatorio, formatoSolicitado) {
  const formato = FORMANDOS.includes(formatoSolicitado) ? formatoSolicitado : relatorio.formato
  const payload = { ...relatorio, geradoEm: relatorio.geradoEm || relatorio.criado_em }
  if (formato === 'csv') return { conteudo: csv(payload), tipo: 'text/csv; charset=utf-8', extensao: 'csv' }
  if (formato === 'json') return { conteudo: json(payload), tipo: 'application/json; charset=utf-8', extensao: 'json' }
  return { conteudo: pdf(payload), tipo: 'application/pdf', extensao: 'pdf' }
}

function nomeArquivo(relatorio, extensao) {
  const base = String(relatorio.nome || 'relatorio')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'relatorio'
  return `${base}-${relatorio.id}.${extensao}`
}

module.exports = { exportar, nomeArquivo, CABECALHOS }
