import chalk from 'chalk';

export async function ownerHandler(client, message) {
  const senderJid = message.key.remoteJid;
  const ownerNumber = process.env.OWNER_NUMBER;
  
  try {
    // Create vCard for owner
    const vcard = 'BEGIN:VCARD\n' +
                  'VERSION:3.0\n' +
                  `FN:Owner ${process.env.BOT_NAME}\n` +
                  `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}\n` +
                  'END:VCARD';
    
    // Send vCard with buttons
    await client.sendMessage(senderJid, {
      contacts: {
        displayName: `Owner ${process.env.BOT_NAME}`,
        contacts: [{ vcard }]
      }
    });
    
    // Send additional info
    await client.sendMessage(senderJid, {
      text: `👑 Owner ${process.env.BOT_NAME}\nSilakan hubungi untuk pertanyaan, laporan bug, atau upgrade premium.`
    });
  } catch (error) {
    console.error(chalk.red('❌ Error in owner handler:'), error);
    
    // Fallback to simple text
    await client.sendMessage(senderJid, {
      text: `👑 Owner: wa.me/${ownerNumber}\nSilakan hubungi untuk pertanyaan, laporan bug, atau upgrade premium.`
    });
  }
}
