const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage } = require("@whiskeysockets/baileys")
const { GoogleGenerativeAI } = require("@google/generative-ai")
const pino = require("pino")
const express = require('express')

const app = express()
const port = process.env.PORT || 3000
app.get('/', (req, res) => res.send('Pashto AI Bot Running ✅'))
app.listen(port, () => console.log(`Server running on ${port}`))

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["WhatsApp-Pashto-Bot", "Chrome", "1.0.0"]
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
            const phoneNumber = "93703930172"
            const code = await sock.requestPairingCode(phoneNumber)
            console.log(`✅ Pairing Code: ${code}`)
        }
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return
        const sender = msg.key.remoteJid

        try {
            await sock.sendPresenceUpdate("composing", sender)
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

            // Text Message
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text

            // 🔥 که څوک پوښتنه وکړي "ته څوک یې"
            if (text && (text.includes("ته څوک یې") || text.includes("څوک یې") || text.includes("نوم دې څه دی") || text.toLowerCase().includes("who are you"))) {
                await sock.sendMessage(sender, {
                    text: "زه د ويصال احمد بوټ یم 🤖\nزه ويصال احمد لخوا جوړ شوی یم 💚\nستاسو خدمت کې یم وروره!"
                })
                return
            }

            // Voice Message
            if (msg.message.audioMessage) {
                const buffer = await downloadMediaMessage(msg, "buffer", {})
                const audioBase64 = buffer.toString("base64")
                const audioPrompt = {
                    inlineData: {
                        data: audioBase64,
                        mimeType: "audio/ogg"
                    }
                }
                const result = await model.generateContent([
                    "ته د ويصال احمد بوټ یې. دا غږ واوره او په پښتو لنډ ځواب ورکړه:",
                    audioPrompt
                ])
                const reply = result.response.text()
                await sock.sendMessage(sender, { text: reply })
            }
            // Text Message - AI ځواب
            else if (text) {
                const result = await model.generateContent(`ته د ويصال احمد بوټ یې. لنډ او په زړه پورې پښتو ځواب ورکړه: ${text}`)
                const reply = result.response.text()
                await sock.sendMessage(sender, { text: reply })
            }
        } catch (err) {
            console.log(err)
            await sock.sendMessage(sender, { text: "بخښنه وروره، ستونزه راغله 😔" })
        }
    })
}

startBot()
