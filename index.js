import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';

const phoneNumber = '93703930172';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        mobile: true,
        logger: pino({ level: 'silent' }),
        browser: ['PashtoBot', 'Chrome', '4.0.0'] // ← دا نوم 428 حل کوي
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log('✅ PAIR CODE:', code);
            } catch (e) {
                console.log('❌ Error:', e.message);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const code = (lastDisconnect.error)?.output?.statusCode;
            if (code !== DisconnectReason.loggedOut) startBot();
            else console.log('Logged Out. Delete auth_info and restart');
        } else if (connection === 'open') {
            console.log('✅ بوټ وټساپ سره وصل شو');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();
