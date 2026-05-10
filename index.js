const {
default: makeWASocket,
useMultiFileAuthState,
fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const pino = require("pino")

async function start() {

const { state, saveCreds } =
await useMultiFileAuthState("./session")

const { version } =
await fetchLatestBaileysVersion()

const sock = makeWASocket({
version,
auth: state,
printQRInTerminal: false,
logger: pino({ level: "silent" }),
browser: ["Ubuntu", "Chrome", "20.0.04"]
})

sock.ev.on("creds.update", saveCreds)

if (!sock.authState.creds.registered) {

const code =
await sock.requestPairingCode("93703930172")

console.log(`
=================
PAIR CODE:
${code}
=================
`)
}

sock.ev.on("connection.update",
({ connection }) => {

if (connection === "open") {

console.log("✅ CONNECTED")

}

})

}

start()
