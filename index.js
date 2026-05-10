import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';

const phoneNumber = '93703930172';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        mobile: false, // ← مهم: پخوانی بوټ هم false کاروي
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop') // ← دا 428 Error حل کوي
    });

    // که راجسټر نه وي، کوډ وغواړه
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join('-') || code; // ← SK13-6445 ډوله یې کړه
            console.log('✅ PAIR CODE:', code);
        }, 3000); // 3 ثانیې انتظار
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode!== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ بوټ وټساپ سره وصل شو');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();
