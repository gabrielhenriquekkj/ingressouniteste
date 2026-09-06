const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const {
  normalizarTexto, normalizarNomeInstituicao, normalizarSigla,
  normalizarUF, normalizarModalidade, normalizarGrau,
  normalizarTurno, normalizarProcesso, normalizarCategoria,
  normalizarTipoInstituicao
} = require('../mineracao/normalizadores/normalizarInstituicao')

describe('Normalizadores', () => {
  describe('normalizarTexto', () => {
    it('deve remover acentos', () => {
      assert.equal(normalizarTexto('Universidade Federal de Mato Grosso'), 'universidade federal de mato grosso')
    })

    it('deve limpar espacos extras', () => {
      assert.equal(normalizarTexto('  Universidade   Federal  '), 'universidade federal')
    })

    it('deve retornar vazio para input vazio', () => {
      assert.equal(normalizarTexto(''), '')
      assert.equal(normalizarTexto(null), '')
    })
  })

  describe('normalizarSigla', () => {
    it('deve converter para maiusculas', () => {
      assert.equal(normalizarSigla('ufmt'), 'UFMT')
    })
  })

  describe('normalizarUF', () => {
    it('deve normalizar UF para 2 caracteres', () => {
      assert.equal(normalizarUF('mt'), 'MT')
      assert.equal(normalizarUF('Mato Grosso'), 'MA')
    })
  })

  describe('normalizarModalidade', () => {
    it('deve identificar EAD', () => {
      assert.equal(normalizarModalidade('EAD'), 'ead')
      assert.equal(normalizarModalidade('Ensino a Distancia'), 'ead')
      assert.equal(normalizarModalidade('Virtual'), 'ead')
    })

    it('deve identificar semipresencial', () => {
      assert.equal(normalizarModalidade('Semipresencial'), 'semipresencial')
      assert.equal(normalizarModalidade('Hibrido'), 'semipresencial')
    })

    it('deve defaultar para presencial', () => {
      assert.equal(normalizarModalidade('Presencial'), 'presencial')
      assert.equal(normalizarModalidade(''), 'presencial')
    })
  })

  describe('normalizarGrau', () => {
    it('deve identificar tecnologico', () => {
      assert.equal(normalizarGrau('Tecnologico'), 'Tecnologico')
    })

    it('deve identificar licenciatura', () => {
      assert.equal(normalizarGrau('Licenciatura'), 'Licenciatura')
    })

    it('deve defaultar para Bacharelado', () => {
      assert.equal(normalizarGrau(''), 'Bacharelado')
    })
  })

  describe('normalizarProcesso', () => {
    it('deve identificar sisu', () => {
      assert.equal(normalizarProcesso('SiSU'), 'sisu')
    })

    it('deve identificar prouni', () => {
      assert.equal(normalizarProcesso('ProUni'), 'prouni')
    })
  })

  describe('normalizarCategoria', () => {
    it('deve identificar federal', () => {
      assert.equal(normalizarCategoria('Federal'), 'federal')
    })

    it('deve identificar estadual', () => {
      assert.equal(normalizarCategoria('Estadual'), 'estadual')
      assert.equal(normalizarCategoria('Do Estado'), 'estadual')
    })

    it('deve identificar municipal', () => {
      assert.equal(normalizarCategoria('Municipal'), 'municipal')
    })

    it('deve identificar privada', () => {
      assert.equal(normalizarCategoria('Particular'), 'privada')
      assert.equal(normalizarCategoria('Privada'), 'privada')
    })
  })

  describe('normalizarTipoInstituicao', () => {
    it('deve identificar universidade', () => {
      assert.equal(normalizarTipoInstituicao('Universidade'), 'universidade')
    })

    it('deve identificar instituto federal', () => {
      assert.equal(normalizarTipoInstituicao('Instituto Federal'), 'instituto_federal')
    })

    it('deve identificar cefet', () => {
      assert.equal(normalizarTipoInstituicao('CEFET'), 'cefet')
    })
  })
})
