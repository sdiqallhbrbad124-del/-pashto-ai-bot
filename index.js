const {
default: makeWASocket,
useMultiFileAuthState,
fetchLatestBaileysVersion,
DisconnectReason,
Browsers
} = require('@whiskeysockets/baileys')

const pino = require('pino')

// ================= CONFIG =================

// 📱 خپل نمبر
const PHONE_NUMBER = '93703930172'

// =========================================


// ================= OFFLINE AI =================
function offlineAI(text) {

const msg = text.toLowerCase()

// سلام
if (
msg.includes('سلام') ||
msg.includes('hi') ||
msg.includes('hello')
) {

return '🌸 وعلیکم سلام!\n🤖 زه Offline AI بوټ یم.'
}

// څنګه یې
if (
msg.includes('څنګه يې') ||
msg.includes('څنګه یاست')
) {

return '😊 زه ښه یم، مننه!'
}

// نوم
if (
msg.includes('ته څوک يې') ||
msg.includes('ته څوک یې')
) {

return '🤖 زه د ویصال احمد Offline AI بوټ یم.'
}

// افغانستان
if (
msg.includes('افغانستان')
) {

return `
🇦🇫 افغانستان د آسیا په منځ کې یو اسلامي هیواد دی.

پلازمېنه: کابل
ژبې: پښتو، دري
تاریخ: ډېر پخوانی او غني تاریخ لري.
`
}

// اسلام
if (
msg.includes('اسلام')
) {

return `
☪️ اسلام د سولې دین دی.

پیغمبر: حضرت محمد ﷺ
کتاب: قرآن کریم
`
}

// AI
if (
msg.includes('ai') ||
msg.includes('مصنوعي ذهانت')
) {

return `
🤖 AI یا مصنوعي ذهانت هغه ټکنالوژي ده چې کمپیوټر ته د فکر او زده کړې توان ورکوي.
`
}

// وخت
if (
msg.includes('وخت') ||
msg === 'time'
) {

return `🕒 وخت:\n${new Date().toLocaleString()}`
}

// Coding
if (
msg.includes('javascript') ||
msg.includes('nodejs')
) {

return `
💻 JavaScript د ویب او بوټونو لپاره مشهوره ژبه ده.
Node.js د JavaScript backend runtime دی.
`
}

// دیني
if (
msg.includes('لمونځ')
) {

return `
🕌 لمونځ د اسلام مهم عبادت دی او په ورځ کې پنځه وخته فرض دی.
`
}

// Default intelligent reply
return `
🤖 زه Offline AI یم.

ستاسو پیغام:
"${text}"

⚡ زه دا موضوع بشپړه نه پیژنم، خو هڅه کوم مرسته وکړم.
`
}


// ================= START BOT =================
async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState('./auth_info')

const { version } =
await fetchLatestBaileysVersion()

const sock = makeWASocket({

version,
auth: state,

printQRInTerminal: false,

markOnlineOnConnect: true,

logger: pino({
level: 'silent'
}),

browser: Browsers.ubuntu('Chrome')

})

// SAVE SESSION
sock.ev.on('creds.update', saveCreds)


// ================= CONNECTION =================
sock.ev.on(
'connection.update',
(update) => {

const {
connection,
lastDisconnect
} = update

if (connection === 'connecting') {

console.log('🔄 CONNECTING...')

}

if (connection === 'open') {

console.log('✅ OFFLINE AI BOT CONNECTED')

}

if (connection === 'close') {

const reason =
lastDisconnect?.error?.output?.statusCode

console.log('❌ CLOSED:', reason)

if (reason !== DisconnectReason.loggedOut) {

console.log('♻️ RECONNECTING...')

startBot()

}

}

}
)


// ================= PAIRING CODE =================
setTimeout(async () => {

try {

if (!sock.authState.creds.registered) {

const code =
await sock.requestPairingCode(
PHONE_NUMBER
)

console.log(`
========================
📱 PAIR CODE: ${code}
========================
`)

}

} catch (err) {

console.log('PAIR ERROR:', err)

}

}, 5000)


// ================= MESSAGES =================
sock.ev.on(
'messages.upsert',

async ({ messages }) => {

try {

const msg = messages[0]

if (!msg.message) return

if (msg.key.fromMe) return

const from = msg.key.remoteJid

const text =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
''

if (!text) return

console.log('📩 MESSAGE:', text)


// ================= IMAGE GENERATOR =================
if (
text.startsWith('عکس') ||
text.startsWith('ډیزاین')
) {

const prompt =
text
.replace('عکس', '')
.replace('ډیزاین', '')
.trim()

const imageUrl =
`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`

await sock.sendMessage(from, {

image: {
url: imageUrl
},

caption:
`🎨 ستاسو ډیزاین:\n${prompt}`

})

return
}


// ================= OFFLINE AI REPLY =================
const reply = offlineAI(text)

await sock.sendMessage(from, {
text: reply
})

} catch (err) {

console.log('MESSAGE ERROR:', err)

}

}
)

console.log('🤖 OFFLINE AI BOT RUNNING...')

}

startBot()
