const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const banco = require('../configuracoes/conexaoBanco')
const migracao003 = require('../../migracoes/003_area_administrativa')
const { garantirAdminInicial } = require('../configuracoes/seedAdmin')

migracao003.executar()
const resultado = garantirAdminInicial()

console.log(`[ADMIN] E-mail: ${resultado.email}`)
if (resultado.senhaGerada) console.log(`[ADMIN] Senha provisória: ${resultado.senha}`)
console.log(`[ADMIN] Total de administradores: ${banco.prepare("SELECT COUNT(*) AS total FROM admin_usuarios WHERE role = 'admin'").get().total}`)
