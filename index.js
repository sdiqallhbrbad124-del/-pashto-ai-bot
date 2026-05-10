const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const P = require('pino')

async function startBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState('session')

  const { version } =
    await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Wisal-AI', 'Chrome', '5.0']
  })

  sock.ev.on('creds.update', saveCreds)

  // Pairing Code
  if (!sock.authState.creds.registered) {

    const phoneNumber = '93703930172'

    setTimeout(async () => {

      try {

        const code =
          await sock.requestPairingCode(phoneNumber)

        console.log(`
╔════════════════════╗
  PAIRING CODE
  ${code}
╚════════════════════╝
`)

      } catch (err) {

        console.log('PAIR ERROR:', err)

      }

    }, 5000)

  }

  // Connection
  sock.ev.on('connection.update', async (update) => {

    const {
      connection,
      lastDisconnect
    } = update

    if (connection === 'open') {

      console.log('✅ BOT CONNECTED')

    }

    if (connection === 'close') {

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut

      if (shouldReconnect) {
        startBot()
      }

    }

  })

  // Messages
  sock.ev.on('messages.upsert', async ({ messages }) => {

    const m = messages[0]

    if (!m.message) return

    const from = m.key.remoteJid

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      ''

    const body = text.toLowerCase()

    // ته څوک یې
    if (
      body.includes('ته څوک یې') ||
      body.includes('ته څوک يي')
    ) {

      await sock.sendMessage(from, {
        text:
          '🤖 زه د ویصال احمد بوټ یم.\nزه د ویصال احمد لخوا جوړ شوی یم.'
      })

    }

    // سلام
    else if (
      body.includes('سلام') ||
      body.includes('hi') ||
      body.includes('hello')
    ) {

      await sock.sendMessage(from, {
        text:
          'وعلیکم سلام 🌸\nزه ستاسو AI WhatsApp بوټ یم.'
      })

    }

    // Voice
    else if (m.message
