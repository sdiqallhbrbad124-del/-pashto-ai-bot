const {
default: makeWASocket,
useMultiFileAuthState,
fetchLatestBaileysVersion,
Browsers
} = require('@whiskeysockets/baileys')

const pino = require('pino')

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState('./auth_info')

const { version } =
await fetchLatestBaileysVersion()

const sock = makeWASocket({
version,
auth: state,
printQRInTerminal: false,
logger: pino({ level: 'silent' }),
browser: Browsers.macOS('Safari')
})

sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update',
async ({ connection }) => {

if (connection === 'connecting') {
console.log('CONNECTING...')
}

if (connection === 'open') {
console.log('✅ CONNECTED')
}

})

setTimeout(async () => {

if (!sock.authState.creds.registered) {

const code =
await sock.requestPairingCode(
'93703930172'
)

console.log(`
====================
PAIR CODE:
${code}
====================
`)

}

}, 20000)

}

startBot()
