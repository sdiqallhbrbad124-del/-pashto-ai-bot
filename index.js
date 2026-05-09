const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const { GoogleGenerativeAI } = require("@google/generative-ai")
const pino = require("pino")
const express = require('express')

const app = express()
const port = process.env.PORT || 3000
app.get('/', (req, res) => res.send('Pashto AI Bot is Running ✅'))
app.listen(port, () => console.log(`Server running on ${port}`))

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["WhatsApp-GPT-Bot", "Chrome", "1.0.0"]
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === "open") {
            console.log("✅ Bot connected to WhatsApp!")
        }
        if (!sock.authState.creds.registered) {
            const phoneNumber = "93703930172" // خپل نمبر دلته ولیکه
            const code = await sock.requestPairingCode(phoneNumber)
            console.log(`✅ Pairing Code: ${code}`)
        }
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text
        if (!text) return
        const sender = msg.key.remoteJid
        try {
            await sock.sendPresenceUpdate("composing", sender)
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
            const result = await model.generateContent(`ته یو مرستندویه پښتو AI یې. لنډ ځواب ورکړه: ${text}`)
            const reply = result.response.text()
            await sock.sendMessage(sender, { text: reply })
        } catch (err) {
            await sock.sendMessage(sender, { text: "بخښنه، ستونزه راغله 😔" })
        }
    })
}

startBot()
