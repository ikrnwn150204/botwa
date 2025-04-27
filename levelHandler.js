// handlers/levelHandler.js - Level system
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getUser, updateUser } from "../utils/database.js";
import { canLevelUp, xpRange, getRoleByLevel } from "../lib/levelling.js";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function levelHandler(client, message) {
  try {
    if (!message || !message.key || !message.key.remoteJid) return

    // Skip if message is from bot or is a command
    if (message.key.fromMe) return
    const prefix = process.env.PREFIX || "."
    const messageText =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.message?.imageMessage?.caption ||
      ""

    if (messageText.startsWith(prefix)) return

    const senderJid = message.key.remoteJid

    // Get user data
    const user = await getUser(senderJid)

    // Skip if user is banned or autolevelup is disabled
    if (user.banned || !user.autolevelup) return

    // Add random XP (5-15)
    const xpGain = Math.floor(Math.random() * 11) + 5
    user.exp = (user.exp || 0) + xpGain

    // Check if user can level up
    if (canLevelUp(user.level, user.exp)) {
      const before = user.level

      // Level up user
      while (canLevelUp(user.level, user.exp)) {
        user.level++
      }

      // Update role based on new level
      user.role = getRoleByLevel(user.level)

      // Save user data
      await updateUser(senderJid, {
        level: user.level,
        exp: user.exp,
        role: user.role,
      })

      // Send level up message
      if (before !== user.level) {
        const { min, xp, max } = xpRange(user.level)

        const levelUpMessage = `
*🎉 C O N G R A T S 🎉*
*${before}* ➔ *${user.level}* [ *${user.role}* ]

*Note:* _Semakin sering berinteraksi dengan bot Semakin Tinggi level kamu_
`.trim()

        try {
          // Get user profile picture
          const ppUrl = await client.profilePictureUrl(senderJid, "image").catch(() => {
            return "https://i.ibb.co/Tq7d7TZ/age-hananta-495-photo.png"
          })

          // Send level up message with image
          await client.sendMessage(senderJid, {
            image: { url: ppUrl },
            caption: levelUpMessage,
          })
        } catch (error) {
          // Fallback to text-only message
          await client.sendMessage(senderJid, {
            text: levelUpMessage,
          })
        }

        console.log(chalk.green(`🎮 User ${senderJid} leveled up from ${before} to ${user.level}`))
      }
    } else {
      // Just update XP
      await updateUser(senderJid, {
        exp: user.exp,
      })
    }
  } catch (error) {
    console.error(chalk.red("❌ Error in level handler:"), error)
  }
}