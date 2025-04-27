// handlers/antispamHandler.js - Anti-spam system
import { getUserSpamData, updateUserSpamData } from "../utils/database.js"
import chalk from "chalk"

// Anti-spam system
export async function antispamHandler(client, message, text) {
  try {
    if (!message || !message.key || !message.key.remoteJid) return true

    const senderJid = message.key.remoteJid

    // Skip for owner
    if (senderJid === `${process.env.OWNER_NUMBER}@s.whatsapp.net`) return true

    // Check if message is a command
    const prefix = process.env.PREFIX || "."
    if (!text.startsWith(prefix)) return true

    const userData = await getUserSpamData(senderJid)
    const now = Date.now()

    // Check if user is banned
    if (userData.banned) {
      if (userData.bannedPermanently) {
        await client.sendMessage(senderJid, {
          text: `⛔ Kamu diblokir permanen karena spam! Hubungi Owner untuk banding.\nwa.me/${process.env.OWNER_NUMBER}`,
        })
        return false
      }

      if (now < userData.bannedTime) {
        const sisa = ((userData.bannedTime - now) / 60000).toFixed(1)
        await client.sendMessage(senderJid, {
          text: `⛔ Kamu masih banned. Tunggu ${sisa} menit lagi.`,
        })
        return false
      } else {
        // Ban expired, reset ban status
        await updateUserSpamData(senderJid, {
          banned: false,
          bannedTime: 0,
          spamCount: 0,
        })
      }
    }

    const timeout = 10000 // 10 seconds
    const resetSpamAfter = 10 * 60 * 1000 // 10 minutes

    // Reset spam count if enough time has passed
    if (now - userData.lastSpam > resetSpamAfter) {
      await updateUserSpamData(senderJid, { spamCount: 0 })
      userData.spamCount = 0
    }

    // Check for spam
    if (now - userData.lastSpam < timeout) {
      userData.spamCount += 1

      if (userData.spamCount >= 3) {
        // Permanent ban after 3 warnings
        await updateUserSpamData(senderJid, {
          banned: true,
          bannedPermanently: true,
          spamCount: userData.spamCount,
        })

        await client.sendMessage(senderJid, {
          text: `⛔ Kamu diblokir permanen karena spam! Hubungi Owner untuk banding.\nwa.me/${process.env.OWNER_NUMBER}`,
        })

        console.log(chalk.red(`🚫 User ${senderJid} permanently banned for spamming`))
        return false
      } else {
        // Temporary ban (3 minutes)
        await updateUserSpamData(senderJid, {
          banned: true,
          bannedTime: now + 3 * 60 * 1000,
          spamCount: userData.spamCount,
        })

        await client.sendMessage(senderJid, {
          text: `⚠️ Jangan spam command! Kamu banned sementara 3 menit [Peringatan ke-${userData.spamCount}]`,
        })

        console.log(chalk.yellow(`⚠️ User ${senderJid} temporarily banned for spamming (warning ${userData.spamCount})`))
        return false
      }
    }

    // Update last spam time
    await updateUserSpamData(senderJid, {
      lastSpam: now,
    })

    return true
  } catch (error) {
    console.error(chalk.red("❌ Error in anti-spam handler:"), error)
    return true // Allow message to proceed in case of error
  }
}
