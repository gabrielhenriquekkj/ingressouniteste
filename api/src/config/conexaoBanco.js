const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

// Garante que a pasta db/ existe e define o caminho do banco SQLite
const pastaDb = path.resolve(__dirname, '../../db')
if (!fs.existsSync(pastaDb)) fs.mkdirSync(pastaDb, { recursive: true })
const caminhoBanco = path.join(pastaDb, 'landing.db')

// Cria conexão síncrona com o banco SQLite
const banco = new DatabaseSync(caminhoBanco)

// Ativa WAL para melhor performance em leitura concorrente
banco.exec('PRAGMA journal_mode = WAL')
banco.exec('PRAGMA foreign_keys = ON')

module.exports = banco
