import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { GoogleGenerativeAI } from '@google/generative-ai'
import pino from 'pino'
import dotenv from 'dotenv'
import express from 'express'

dotenv.config()

// Railway 24/7 لپاره - دا ضروري دی
const app = express()
const port = process.env.PORT || 3000
app.get('/', (req, res) => res.send('Pashto AI Bot is Running ✅'))
app.listen(port, () => console.log(`Server running on ${port}`))

// Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"})

// Baileys WhatsApp Setup
const { state, saveCreds } = await useMultiFileAuthState('auth_info')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['Pashto AI Bot', 'Chrome', '1.0.0']
})

// Pairing Code لپاره - ستا نمبر
if (!sock.authState.creds.registered) {
    const phoneNumber = '93703930172' // ستا وټساپ نمبر
    setTimeout(async () => {
        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`✅ Pairing Code: ${code}`)
    }, 3000)
}

sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if(connection === 'close') {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut
        if(shouldReconnect) {
            console.log('بیا وصل کیږي...')
            startBot()
        }
    } else if(connection === 'open') {
        console.log('✅ بوټ وټساپ سره وصل شو')
    }
})

// پیغام راتلل او ځواب ورکول - Version 1 Starter
sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const type = Object.keys(msg.message)[0]
    let text = ''

    if (type === 'conversation') text = msg.message.conversation
    if (type === 'extendedTextMessage') text = msg.message.extendedTextMessage.text
    if (!text) return

    console.log(`پیغام راغی: ${text}`)

    // Gemini AI ته لیږل - پښتو ځواب د ويصال احمد په نوم
    const prompt = `ته یو پښتو AI بوټ یې. نوم دې "د ويصال احمد هوښيار بوټ" دی. تل په پښتو، دوستانه او لنډ ځواب ورکوه. 2-3 کرښې زیات مه لیکه. که څوک پوښتنه وکړي چې ته څوک یې یا چا جوړ کړی یې، ووایه: "زه د ويصال احمد هوښيار بوټ يم، زه ويصال احمد له خوا جوړ شوی يم". پوښتنه: ${text}`

    try {
        const result = await model.generateContent(prompt)
        const reply = result.response.text()
        await sock.sendMessage(from, { text: reply })
    } catch (e) {
        console.log(e)
        await sock.sendMessage(from, { text: 'بخښنه وروره، اوس ستونزه لرم 😅 بیا ټرای وکړه' })
    }
})

async function startBot() {
    console.log('بوټ شروع شو...')
}

startBot()
