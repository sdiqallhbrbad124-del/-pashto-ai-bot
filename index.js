const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const pino = require('pino')

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState('./session')

  const { version } =
    await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    browser: ['Wisal Bot', 'Chrome', '1.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  if (!sock.authState.creds.registered) {

    const phoneNumber = '+93703930172'

    setTimeout(async () => {

      const code =
        await sock.requestPairingCode(phoneNumber)

      console.log(`
======================
PAIR CODE: ${code}
======================
`)

    }, 4000)
  }

  sock.ev.on('connection.update', ({ connection }) => {

    if (connection === 'open') {
      console.log('✅ BOT CONNECTED')
    }

  })

  sock.ev.on('messages.upsert', async ({ messages }) => {

    const msg = messages[0]

    if (!msg.message) return

    const from = msg.key.remoteJid

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''

    if (
      text.includes('ته څوک یې') ||
      text.includes('ته څوک يي')
    ) {

      await sock.sendMessage(from, {
        text:
          'زه د ویصال احمد بوټ یم 🤖\nزه د ویصال احمد لخوا جوړ شوی یم.'
      })

    }

  })

}

startBot()
