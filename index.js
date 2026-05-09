const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

const phoneNumber = '93703930172' // ستا نمبر

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        mobile: true, // ← دا مهم دی
        logger: pino({ level: 'silent' }),
        browser: ['Chrome (Linux)', '', ''] // ← دا هم لکه پخوانی بوټ
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'connecting') {
            // کله چې connecting شي، بیا کوډ وغواړه
            if (!sock.authState.creds.registered) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 ثانیې انتظار
                const code = await sock.requestPairingCode(phoneNumber);
                console.log('✅ Pairing Code:', code);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode!== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ بوټ وټساپ سره وصل شو');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (text.toLowerCase() === 'salam') {
            await sock.sendMessage(from, { text: 'وعليکم السلام وروره! 👋' });
        }
    });
}

startBot();
