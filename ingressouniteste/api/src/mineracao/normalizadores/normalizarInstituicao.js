function normalizarTexto(texto) {
  if (!texto) return ''
  return texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
}

function normalizarNomeInstituicao(nome) {
  if (!nome) return ''
  let n = normalizarTexto(nome)
  n = n.replace(/\b(universidade|faculdade|instituto|centro|escola)\b/g, '').trim()
  n = n.replace(/\b(federal|estadual|municipal|do estado|de mato grosso|do sul|da grande)\b/g, '').trim()
  return n || normalizarTexto(nome)
}

function normalizarSigla(sigla) {
  if (!sigla) return ''
  return sigla.toUpperCase().trim()
}

function normalizarUF(uf) {
  if (!uf) return ''
  return uf.toUpperCase().trim().substring(0, 2)
}

function normalizarModalidade(modalidade) {
  if (!modalidade) return 'presencial'
  const m = normalizarTexto(modalidade)
  if (m.includes('ead') || m.includes('distancia') || m.includes('virtual')) return 'ead'
  if (m.includes('semipresencial') || m.includes('hibrid') || m.includes('hybrid')) return 'semipresencial'
  return 'presencial'
}

function normalizarGrau(grau) {
  if (!grau) return 'Bacharelado'
  const g = normalizarTexto(grau)
  if (g.includes('tecnolog')) return 'Tecnologico'
  if (g.includes('licenciatura')) return 'Licenciatura'
  if (g.includes('bacharelado')) return 'Bacharelado'
  return grau
}

function normalizarTurno(turno) {
  if (!turno) return null
  const t = normalizarTexto(turno)
  if (t.includes('manha') || t.includes('matutino')) return 'Matutino'
  if (t.includes('tarde') || t.includes('vespertino')) return 'Vespertino'
  if (t.includes('noite') || t.includes('noturno')) return 'Noturno'
  if (t.includes('integral') || t.includes('completo')) return 'Integral'
  return turno
}

function normalizarProcesso(processo) {
  if (!processo) return null
  const p = normalizarTexto(processo)
  if (p.includes('sisu')) return 'sisu'
  if (p.includes('prouni')) return 'prouni'
  if (p.includes('comvest')) return 'comvest'
  if (p.includes('unesp')) return 'unesp'
  if (p.includes('unicamp')) return 'unicamp'
  if (p.includes('enem')) return 'enem'
  return processo.toLowerCase()
}

function normalizarCategoria(categoria) {
  if (!categoria) return null
  const c = normalizarTexto(categoria)
  if (c.includes('federal')) return 'federal'
  if (c.includes('estadual') || c.includes('estado')) return 'estadual'
  if (c.includes('municipal') || c.includes('municipio')) return 'municipal'
  if (c.includes('particular') || c.includes('privada')) return 'privada'
  return categoria.toLowerCase()
}

function normalizarTipoInstituicao(tipo) {
  if (!tipo) return null
  const t = normalizarTexto(tipo)
  if (t.includes('universidade')) return 'universidade'
  if (t.includes('instituto federal')) return 'instituto_federal'
  if (t.includes('cefet')) return 'cefet'
  if (t.includes('centro universitario')) return 'centro_universitario'
  if (t.includes('faculdade')) return 'faculdade'
  return 'outra'
}

module.exports = {
  normalizarTexto, normalizarNomeInstituicao,
  normalizarSigla, normalizarUF, normalizarModalidade, normalizarGrau,
  normalizarTurno, normalizarProcesso, normalizarCategoria, normalizarTipoInstituicao
}
