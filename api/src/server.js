const app = require('./app')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const PORTA = process.env.PORT || 3000

// Inicializa a tabela no banco antes de subir o servidor
require('../iniciarBanco')

// Inicia o agendador de mineração
const agendador = require('./mineracao/agendador')
agendador.iniciar()

app.listen(PORTA, () => {
  console.log(`Servidor rodando na porta ${PORTA}`)
  console.log(`Mineração agendada: ${process.env.MINERACAO_ENABLED === 'true' ? 'ATIVADA' : 'DESATIVADA'}`)
})
