const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  pairingCode: true,
});

client.on('code', (code) => {
    console.log('*** Pairing Code:', code, '***');
    console.log('*** دا کوډ په WhatsApp ولیکه ***');
});

client.on('ready', () => {
    console.log('بوټ چالان شو ✅');
});

client.on('message', async (message) => {
  if (message.body) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: message.body }],
        model: 'llama-3.1-8b-instant'
      });
      const reply = chatCompletion.choices[0]?.message?.content || 'ځواب نشم ورکولی';
      message.reply(reply);
    } catch (error) {
      console.log('Error:', error);
      message.reply('بخښنه، ستونزه پېښه شوه');
    }
  }
});

client.initialize().then(() => {
  client.requestPairingCode('+93703930172');
});const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const pino = require('pino')
const fs = require('fs')
const qrcode = require('qrcode-terminal')
const axios = require('axios')

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['Wisal-AI-Bot', 'Chrome', '1.0.0']
  })

  // Pairing Code
  if (!sock.authState.creds.registered) {
    const phoneNumber = '93703930172'

    setTimeout(async () => {
      const code = await sock.requestPairingCode(phoneNumber)
      console.log('\n===========================')
      console.log('PAIRING CODE: ', code)
      console.log('===========================\n')
    }, 3000)
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      console.log('Connection closed.')

      if (shouldReconnect) {
        startBot()
      }
    } else if (connection === 'open') {
      console.log('✅ Bot Connected Successfully')
    }
  })

  // Messages
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0]

      if (!msg.message) return

      const from = msg.key.remoteJid

      const messageText =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ''

      const text = messageText.toLowerCase()

      console.log('Message:', text)

      // Who are you
      if (
        text.includes('ته څوک یې') ||
        text.includes('ته څوک يي') ||
        text.includes('who are you')
      ) {
        await sock.sendMessage(from, {
          text: 'زه د ویصال احمد بوټ یم 🤖\nزه د ویصال احمد لخوا جوړ شوی یم.'
        })
      }

      // سلام
      else if (
        text.includes('سلام') ||
        text.includes('hi') ||
        text.includes('hello')
      ) {
        await sock.sendMessage(from, {
          text: 'وعلیکم سلام 🌸\nزه ستاسو AI بوټ یم، څنګه مرسته درسره وکړم؟'
        })
      }

      // Voice Message Detection
      else if (msg.message.audioMessage) {
        await sock.sendMessage(from, {
          text: '🎤 ستاسو صوتي پیغام مې واورېد.\nژر به د Voice AI سیستم هم فعال شي.'
        })
      }

      // Default AI Style Reply
      else {
        await sock.sendMessage(from, {
          text: `تاسو وویل:\n${messageText}\n\nزه د ویصال احمد AI بوټ یم 🤖`
        })
      }
    } catch (err) {
      console.log(err)
    }
  })
}

startBot()
