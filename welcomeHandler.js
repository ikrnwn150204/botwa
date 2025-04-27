import { getUser, isPremium, getSettings } from "../utils/database.js"
import { ucapan } from "../utils/helper.js"

export async function welcomeHandler(client, message, type) {
  const senderJid = message.key.remoteJid

  // Get user data
  const user = await getUser(senderJid)
  const settings = await getSettings()
  const isPremiumUser = await isPremium(senderJid)

  // Get user name from message
  let userName = "User"
  if (message.pushName) {
    userName = message.pushName
  }

  // Get user profile picture
  const pp = await client.profilePictureUrl(senderJid, "image").catch(() => {
    return "https://i.ibb.co/Tq7d7TZ/age-hananta-495-photo.png"
  })

  // Get limits
  const dailyLimit = isPremiumUser ? settings.limitPremiumPerDay : settings.limitFreePerDay
  const contactLimit = isPremiumUser ? settings.contactsPremiumPerDay : settings.contactsFreePerDay

  switch (type) {
    case "welcome":
      // Send welcome message with buttons
      await client.sendMessage(senderJid, {
        caption: `👋 Hai, ${userName}!\nLevel: ${user.level} • Status: ${isPremiumUser ? "Premium" : "Free User"}\nLimit hari ini: ${user.sentCount}/${dailyLimit === -1 ? "∞" : dailyLimit} pesan • Kontak tersisa: ${contactLimit - user.contactCount}\nKetik .menu untuk lihat daftar perintah.`,
        footer: `${process.env.BOT_NAME} | Powered By ${process.env.OWNER_NUMBER}`,
        viewOnce: true,
        headerType: 5,
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363298688453806@newsletter",
            newsletterName: `🔮 ${process.env.BOT_NAME} | Powered By ${process.env.OWNER_NUMBER}`,
            serverMessageId: -1,
          },
          businessMessageForwardInfo: {
            businessOwnerJid: client.decodeJid(client.user.id),
          },
          externalAdReply: {
            title: "Hai Kak " + userName,
            body: ucapan(),
            thumbnailUrl: pp,
            sourceUrl: "https://wa.me/" + process.env.OWNER_NUMBER,
            mediaType: 1,
            renderLargerThumbnail: false,
          },
        },
        buttons: [
          { buttonId: ".menu", buttonText: { displayText: "MENU" }, type: 1 },
          { buttonId: ".owner", buttonText: { displayText: "OWNER" }, type: 1 },
        ],
      })
      break

    case "menu":
      // Send menu message with buttons
      await client.sendMessage(senderJid, {
        caption: `📋 Menu Confess Bot\n\n1. .confes - Kirim Manual\n2. .confess - Kirim Interaktif\n3. .cek_premium - Cek Status Premium\n4. .premium - Beli Premium\n5. .owner - Hubungi Owner\n\nStatus: ${isPremiumUser ? "Premium" : "Free User"}\nLimit: ${user.sentCount}/${dailyLimit === -1 ? "∞" : dailyLimit} pesan`,
        footer: `${process.env.BOT_NAME} | Powered By ${process.env.OWNER_NUMBER}`,
        viewOnce: true,
        headerType: 5,
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363298688453806@newsletter",
            newsletterName: `🔮 ${process.env.BOT_NAME} | Powered By ${process.env.OWNER_NUMBER}`,
            serverMessageId: -1,
          },
          businessMessageForwardInfo: {
            businessOwnerJid: client.decodeJid(client.user.id),
          },
          externalAdReply: {
            title: "Hai Kak " + userName,
            body: ucapan(),
            thumbnailUrl: pp,
            sourceUrl: "https://wa.me/" + process.env.OWNER_NUMBER,
            mediaType: 1,
            renderLargerThumbnail: false,
          },
        },
        buttons: [
          { buttonId: ".confes", buttonText: { displayText: "CONFES" }, type: 1 },
          { buttonId: ".confess", buttonText: { displayText: "CONFESS" }, type: 1 },
          { buttonId: ".premium", buttonText: { displayText: "PREMIUM" }, type: 1 },
        ],
      })
      break

    default:
      break
  }
}
