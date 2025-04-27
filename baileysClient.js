// utils/baileysClient.js - Baileys client setup
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@fizzxydev/baileys-pro';
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Karena ES Module, __dirname harus manual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create auth directory if it doesn't exist
const authDir = path.join(__dirname, '..', 'auth_info');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

// Auth state management
let state, saveCreds;

export async function createBaileysClient() {
  try {
    // Initialize auth state
    const auth = await useMultiFileAuthState('auth_info');
    state = auth.state;
    saveCreds = auth.saveCreds;
    
    // Create socket connection
    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['Confess Bot', 'Chrome', '1.0.0'],
      syncFullHistory: false
    });
    
    // Handle connection updates
    socket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log(chalk.blue('Scan QR code to connect:'));
        qrcode.generate(qr, { small: true });
      }
      
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log(chalk.yellow('⚠️ Connection closed due to:'), lastDisconnect?.error);
        
        if (shouldReconnect) {
          console.log(chalk.blue('🔄 Reconnecting...'));
          setTimeout(() => {
            createBaileysClient();
          }, 5000);
        } else {
          console.log(chalk.red('❌ Connection closed. Not reconnecting.'));
        }
      } else if (connection === 'open') {
        console.log(chalk.green('✅ Connected to WhatsApp!'));
      }
    });
    
    // Save credentials on update
    socket.ev.on('creds.update', saveCreds);
    
    return socket;
  } catch (error) {
    console.error(chalk.red('❌ Error creating Baileys client:'), error);
    throw error;
  }
}
