const instituicaoModelo = require('../../modelos/instituicaoModelo')
const campusModelo = require('../../modelos/campiModelo')
const cursoModelo = require('../../modelos/cursoModelo')
const notaCorteModelo = require('../../modelos/notaCorteModelo')
const custoCidadeModelo = require('../../modelos/custoCidadeModelo')

function persistirInstituicoes(instituicoes) {
  const stats = { inseridos: 0, atualizados: 0, erros: 0 }
  for (const inst of instituicoes) {
    try {
      const resultado = instituicaoModelo.inserirOuAtualizar(inst)
      if (resultado.acao === 'inserido') stats.inseridos++
      else stats.atualizados++
    } catch (e) {
      stats.erros++
    }
  }
  return stats
}

function persistirCampi(campi) {
  const stats = { inseridos: 0, atualizados: 0, erros: 0 }
  for (const campus of campi) {
    try {
      const resultado = campusModelo.inserirOuAtualizar(campus)
      if (resultado.acao === 'inserido') stats.inseridos++
      else stats.atualizados++
    } catch (e) {
      stats.erros++
    }
  }
  return stats
}

function persistirCursos(cursos) {
  const stats = { inseridos: 0, atualizados: 0, erros: 0 }
  for (const curso of cursos) {
    try {
      const resultado = cursoModelo.inserirOuAtualizar(curso)
      if (resultado.acao === 'inserido') stats.inseridos++
      else stats.atualizados++
    } catch (e) {
      stats.erros++
    }
  }
  return stats
}

function persistirNotas(notas) {
  const stats = { inseridos: 0, atualizados: 0, erros: 0 }
  for (const nota of notas) {
    try {
      const resultado = notaCorteModelo.inserirOuAtualizar(nota)
      if (resultado.acao === 'inserido') stats.inseridos++
      else stats.atualizados++
    } catch (e) {
      stats.erros++
    }
  }
  return stats
}

function persistirCustos(custos) {
  const stats = { inseridos: 0, atualizados: 0, erros: 0 }
  for (const custo of custos) {
    try {
      const resultado = custoCidadeModelo.inserirOuAtualizar(custo)
      if (resultado.acao === 'inserido') stats.inseridos++
      else stats.atualizados++
    } catch (e) {
      stats.erros++
    }
  }
  return stats
}

module.exports = { persistirInstituicoes, persistirCampi, persistirCursos, persistirNotas, persistirCustos }
