import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';

const phoneNumber = '93703930172';
const authFolder = './auth_info';

// 1. هر ځل Deploy کې زوړ Session ووهه
if (fs.existsSync(authFolder)) {
    fs.rmSync(authFolder, { recursive: true, force: true });
    console.log('>>> زوړ Session پاک شو. نوی کوډ غوښتل کیږي...');
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        mobile: false, // ← دا مهم دی
        logger: pino({ level: 'silent' }),
        browser: ['Windows', 'Chrome', '110.0.0'] // ← دا نوم 8 رقمي کوډ راوړي
    });

    // 2. که راجسټر نه وي، سمدستي کوډ وغواړه
    if (!sock.authState.creds.registered) {
        await new Promise(r => setTimeout(r, 1500)); // 1.5 ثانیه انتظار
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log('');
            console.log('================ PAIRING CODE ================');
            console.log('>>>  ', code, '  <<<');
            console.log('================ PAIRING CODE ================');
            console.log('دا کوډ په WhatsApp کې ولیکه: Linked devices > Link with phone number');
        } catch (err) {
            console.log('❌ کوډ ونه غوښتل شو:', err.message);
        }
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ بوټ وټساپ سره وصل شو!');
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log('قطع شو. Status:', statusCode);
            if (statusCode !== DisconnectReason.loggedOut) {
                startBot();
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();
