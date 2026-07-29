const app = require('./app')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const PORTA = process.env.PORT || 3000

// Inicializa a tabela no banco antes de subir o servidor
require('../iniciarBanco')

app.listen(PORTA, () => console.log(`Servidor rodando na porta ${PORTA}`))
