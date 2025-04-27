import { getUser, updateUser, isPremium, getSettings, addConfessLog, updateConfessStatus, getConfessLogs } from '../utils/database.js';
import { formatPhoneNumber } from '../utils/helper.js';
import chalk from 'chalk';

export async function confessHandler(client, message, text, user) {
  const senderJid = message.key.remoteJid;
  const settings = await getSettings();
  const isPremiumUser = await isPremium(senderJid);
  
  // Handle manual confess command (.confes)
  if (text.startsWith('.confes ')) {
    return await handleManualConfess(client, message, text, user, settings, isPremiumUser);
  }
  
  // Handle interactive confess flow
  if (text === 'start') {
    await client.sendMessage(senderJid, {
      text: '📲 Silakan kirim kontak target atau nomor telepon (format: 628xxx).'
    });
    return;
  }
  
  // Handle stop command
  if (text === 'stop') {
    return await handleStopConfess(client, message, user);
  }
  
  // Handle confess flow states
  if (user.state) {
    switch (user.state) {
      case 'confess:waiting_contact':
        return await handleContactInput(client, message, text, user);
        
      case 'confess:waiting_alias':
        return await handleAliasInput(client, message, text, user);
        
      case 'confess:waiting_message':
        return await handleMessageInput(client, message, text, user, settings, isPremiumUser);
        
      default:
        break;
    }
  }
  
  // Handle button responses (accept/reject)
  if (text === 'accept' || text === 'reject') {
    return await handleConfessResponse(client, message, text);
  }
}

async function handleManualConfess(client, message, text, user, settings, isPremiumUser) {
  const senderJid = message.key.remoteJid;
  
  // Parse command: .confes number|alias|message
  const args = text.slice(8).split('|');
  
  if (args.length < 3) {
    await client.sendMessage(senderJid, {
      text: '❌ Format salah! Gunakan: .confes nomor|alias|pesan'
    });
    return;
  }
  
  const [targetNumber, alias, ...messageParts] = args;
  const messageText = messageParts.join('|');
  
  // Check if target number is valid
  const formattedNumber = formatPhoneNumber(targetNumber);
  if (!formattedNumber) {
    await client.sendMessage(senderJid, {
      text: '❌ Nomor tidak valid! Gunakan format: 628xxx'
    });
    return;
  }
  
  // Check daily limits
  const dailyLimit = isPremiumUser ? settings.limitPremiumPerDay : settings.limitFreePerDay;
  const contactLimit = isPremiumUser ? settings.contactsPremiumPerDay : settings.contactsFreePerDay;
  
  if (dailyLimit !== -1 && user.sentCount >= dailyLimit) {
    await client.sendMessage(senderJid, {
      text: `❌ Limit harian tercapai (${user.sentCount}/${dailyLimit}).\nUpgrade ke premium untuk limit lebih banyak!`
    });
    return;
  }
  
  if (contactLimit !== -1 && user.contactCount >= contactLimit) {
    await client.sendMessage(senderJid, {
      text: `❌ Limit kontak harian tercapai (${user.contactCount}/${contactLimit}).\nUpgrade ke premium untuk limit lebih banyak!`
    });
    return;
  }
  
  // Send confess message to recipient
  const targetJid = `${formattedNumber}@s.whatsapp.net`;
  
  try {
    // Send message
    await client.sendMessage(targetJid, {
      text: `✉️ Pesan Rahasia\nDari: ${alias}\nPesan: ${messageText}`
    });
    
    // Log confess
    const logIndex = await addConfessLog({
      from: senderJid,
      to: targetJid,
      alias,
      message: messageText,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
    
    // Update user limits
    await updateUser(senderJid, {
      sentCount: user.sentCount + 1,
      contactCount: user.contactCount + 1
    });
    
    // Send confirmation to sender
    await client.sendMessage(senderJid, {
      text: `✅ Pesan terkirim ke ${targetNumber}\nSisa limit hari ini: ${user.sentCount + 1}/${dailyLimit === -1 ? '∞' : dailyLimit}`
    });
    
    console.log(chalk.green(`✅ Confess sent from ${senderJid} to ${targetJid}`));
  } catch (error) {
    console.error(chalk.red('❌ Error sending confess:'), error);
    
    await client.sendMessage(senderJid, {
      text: '❌ Gagal mengirim pesan. Pastikan nomor valid dan terdaftar di WhatsApp.'
    });
  }
}

async function handleContactInput(client, message, text, user) {
  const senderJid = message.key.remoteJid;
  let targetNumber = '';
  
  // Check if message contains a contact
  if (message.message && message.message.contactMessage) {
    targetNumber = message.message.contactMessage.vcard.match(/waid=(\d+)/)[1];
  } else {
    // Assume text is a phone number
    targetNumber = formatPhoneNumber(text);
  }
  
  if (!targetNumber) {
    await client.sendMessage(senderJid, {
      text: '❌ Nomor tidak valid! Gunakan format: 628xxx'
    });
    return;
  }
  
  // Update user state with target number
  await updateUser(senderJid, {
    state: 'confess:waiting_alias',
    targetNumber
  });
  
  // Ask for alias
  await client.sendMessage(senderJid, {
    text: `Nama: ${targetNumber}\nNomor: +${targetNumber}\nKetik alias yang ingin ditampilkan:`
  });
}

async function handleAliasInput(client, message, text, user) {
  const senderJid = message.key.remoteJid;
  const alias = text.trim();
  
  if (!alias) {
    await client.sendMessage(senderJid, {
      text: '❌ Alias tidak boleh kosong! Ketik alias yang ingin ditampilkan:'
    });
    return;
  }
  
  // Update user state with alias
  await updateUser(senderJid, {
    state: 'confess:waiting_message',
    alias
  });
  
  // Ask for message
  await client.sendMessage(senderJid, {
    text: 'Masukkan pesan rahasiamu:'
  });
}

async function handleMessageInput(client, message, text, user, settings, isPremiumUser) {
  const senderJid = message.key.remoteJid;
  const confessMessage = text.trim();
  
  if (!confessMessage) {
    await client.sendMessage(senderJid, {
      text: '❌ Pesan tidak boleh kosong! Masukkan pesan rahasiamu:'
    });
    return;
  }
  
  // Check daily limits
  const dailyLimit = isPremiumUser ? settings.limitPremiumPerDay : settings.limitFreePerDay;
  const contactLimit = isPremiumUser ? settings.contactsPremiumPerDay : settings.contactsFreePerDay;
  
  if (dailyLimit !== -1 && user.sentCount >= dailyLimit) {
    await client.sendMessage(senderJid, {
      text: `❌ Limit harian tercapai (${user.sentCount}/${dailyLimit}).\nUpgrade ke premium untuk limit lebih banyak!`
    });
    
    // Reset state
    await updateUser(senderJid, { state: null });
    return;
  }
  
  if (contactLimit !== -1 && user.contactCount >= contactLimit) {
    await client.sendMessage(senderJid, {
      text: `❌ Limit kontak harian tercapai (${user.contactCount}/${contactLimit}).\nUpgrade ke premium untuk limit lebih banyak!`
    });
    
    // Reset state
    await updateUser(senderJid, { state: null });
    return;
  }
  
  // Send confess message to recipient
  const targetJid = `${user.targetNumber}@s.whatsapp.net`;
  
  try {
    // Send message
    await client.sendMessage(targetJid, {
      text: `✉️ Pesan Rahasia\nDari: ${user.alias}\nPesan: ${confessMessage}`
    });
    
    // Log confess
    const logIndex = await addConfessLog({
      from: senderJid,
      to: targetJid,
      alias: user.alias,
      message: confessMessage,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
    
    // Update user limits
    await updateUser(senderJid, {
      sentCount: user.sentCount + 1,
      contactCount: user.contactCount + 1,
      state: null // Reset state
    });
    
    // Send confirmation to sender
    await client.sendMessage(senderJid, {
      text: `✅ Pesan terkirim ke ${user.targetNumber}\nSisa limit hari ini: ${user.sentCount + 1}/${dailyLimit === -1 ? '∞' : dailyLimit}`
    });
    
    console.log(chalk.green(`✅ Confess sent from ${senderJid} to ${targetJid}`));
  } catch (error) {
    console.error(chalk.red('❌ Error sending confess:'), error);
    
    await client.sendMessage(senderJid, {
      text: '❌ Gagal mengirim pesan. Pastikan nomor valid dan terdaftar di WhatsApp.'
    });
    
    // Reset state
    await updateUser(senderJid, { state: null });
  }
}

async function handleConfessResponse(client, message, response) {
  const recipientJid = message.key.remoteJid;
  
  // Get the original message that contains the confess
  const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMessage) return;
  
  const confessText = quotedMessage.conversation || quotedMessage.extendedTextMessage?.text || '';
  
  // Extract sender alias and message
  const matches = confessText.match(/Dari: (.+)\nPesan: (.+)/);
  if (!matches) return;
  
  const [_, alias, confessMessage] = matches;
  
  // Find the confess log
  const logs = await getConfessLogs();
  const logIndex = logs.findIndex(log => 
    log.to === recipientJid && 
    log.alias === alias && 
    log.message === confessMessage &&
    log.status === 'pending'
  );
  
  if (logIndex === -1) return;
  
  const log = logs[logIndex];
  const senderJid = log.from;
  
  if (response === 'accept') {
    // Update log status
    await updateConfessStatus(logIndex, 'accepted');
    
    // Notify recipient
    await client.sendMessage(recipientJid, {
      text: `👤 Dari: ${alias}\n💬 Pesan: ${confessMessage}\nBalas pesan ini, akan diteruskan secara anonim.`
    });
    
    // Notify sender
    await client.sendMessage(senderJid, {
      text: `🎉 Pesanmu telah diterima! Silakan chat balik secara anonim.`
    });
  } else if (response === 'reject') {
    // Update log status
    await updateConfessStatus(logIndex, 'rejected');
    
    // Notify recipient
    await client.sendMessage(recipientJid, {
      text: `❌ Kamu menolak Confess. Tidak akan menerima lagi hari ini.\nKetik .terima untuk aktifkan kembali.`
    });
    
    // Notify sender
    await client.sendMessage(senderJid, {
      text: `⚠️ Pesanmu ditolak. Coba kirim ke orang lain.`
    });
  }
}

async function handleStopConfess(client, message, user) {
  const senderJid = message.key.remoteJid;
  
  // Reset user state
  await updateUser(senderJid, { state: null });
  
  // Notify user
  await client.sendMessage(senderJid, {
    text: `🔒 Percakapan confess telah dihentikan.\nKamu bisa kirim lagi pesan ke orang baru.`
  });
}
