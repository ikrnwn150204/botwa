import { isPremium, getPremiumInfo, activatePremium, getSettings } from "../utils/database.js"
import { ucapan } from "../utils/helper.js"
import fs from "fs"
import path from "path"
import chalk from "chalk"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function premiumHandler(client, message, action, args = []) {
  const senderJid = message.key.remoteJid
  const settings = await getSettings()

  switch (action) {
    case "info":
      return await handlePremiumInfo(client, message, settings)

    case "check":
      return await handleCheckPremium(client, message)

    case "activate":
      return await handleActivatePremium(client, message, args)

    default:
      return
  }
}

async function handlePremiumInfo(client, message, settings) {
  const senderJid = message.key.remoteJid
  const ownerJid = `${process.env.OWNER_NUMBER}@s.whatsapp.net`

  // Get user name from message
  let userName = "User"
  if (message.pushName) {
    userName = message.pushName
  }

  // Get user profile picture
  const pp = await client.profilePictureUrl(senderJid, "image").catch(() => {
    return "https://i.ibb.co/Tq7d7TZ/age-hananta-495-photo.png"
  })

  // Get QRIS image path
  const qrisPath = path.join(__dirname, "..", "utils", "qris.png")

  try {
    // Check if QRIS image exists
    if (fs.existsSync(qrisPath)) {
      // Send image with caption and buttons
      await client.sendMessage(senderJid, {
        image: { url: qrisPath },
        caption: `💎 Fitur Premium\n\n✅ Kirim pesan tanpa batas\n📩 Kirim pesan hingga ke 5 kontak berbeda per hari\n\n🧾 Harga:\n• Premium 7 Hari: Rp${settings.price7Days}\n• Premium Selamanya: Rp${settings.priceLifetime}\n\n📷 Scan QRIS di atas\n📞 Setelah melakukan pembayaran, Verifikasi ke admin: 👉 wa.me/${process.env.OWNER_NUMBER}`,
        footer: `${process.env.BOT_NAME} | Powered By ${process.env.OWNER_NUMBER}`,
        buttons: [
          { buttonId: ".cek_premium", buttonText: { displayText: "CEK PREMIUM" }, type: 1 },
          { buttonId: ".owner", buttonText: { displayText: "OWNER" }, type: 1 },
        ],
      })
    } else {
      // Send text only with buttons
      await client.sendMessage(senderJid, {
        caption: `💎 Fitur Premium\n\n✅ Kirim pesan tanpa batas\n📩 Kirim pesan hingga ke 5 kontak berbeda per hari\n\n🧾 Harga:\n• Premium 7 Hari: Rp${settings.price7Days}\n• Premium Selamanya: Rp${settings.priceLifetime}\n\n📞 Untuk aktivasi, hubungi admin: 👉 wa.me/${process.env.OWNER_NUMBER}`,
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
          { buttonId: ".cek_premium", buttonText: { displayText: "CEK PREMIUM" }, type: 1 },
          { buttonId: ".owner", buttonText: { displayText: "OWNER" }, type: 1 },
        ],
      })
    }
  } catch (error) {
    console.error(chalk.red("❌ Error sending premium info:"), error)

    // Fallback to text only with buttons
    await client.sendMessage(senderJid, {
      text: `💎 Fitur Premium\n\n✅ Kirim pesan tanpa batas\n📩 Kirim pesan hingga ke 5 kontak berbeda per hari\n\n🧾 Harga:\n• Premium 7 Hari: Rp${settings.price7Days}\n• Premium Selamanya: Rp${settings.priceLifetime}\n\n📞 Untuk aktivasi, hubungi admin: 👉 wa.me/${process.env.OWNER_NUMBER}`,
      footer: `${process.env.BOT_NAME}`,
      buttons: [
        { buttonId: ".cek_premium", buttonText: { displayText: "CEK PREMIUM" }, type: 1 },
        { buttonId: ".owner", buttonText: { displayText: "OWNER" }, type: 1 },
      ],
    })
  }
}

async function handleCheckPremium(client, message) {
  const senderJid = message.key.remoteJid
  const settings = await getSettings()

  // Get user name from message
  let userName = "User"
  if (message.pushName) {
    userName = message.pushName
  }

  // Get user profile picture
  const pp = await client.profilePictureUrl(senderJid, "image").catch(() => {
    return "https://i.ibb.co/Tq7d7TZ/age-hananta-495-photo.png"
  })

  // Check if user is premium
  const isPremiumUser = await isPremium(senderJid)

  if (isPremiumUser) {
    // Get premium info
    const premiumInfo = await getPremiumInfo(senderJid)
    const expiryDate = new Date(premiumInfo.expiresAt)
    const formattedDate = expiryDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

    await client.sendMessage(senderJid, {
      text: `✨ *PREMIUM USER* ✨\n\nHalo Kak ${userName}!\n\nStatus: ✅ Premium\nBerlaku Hingga: ${premiumInfo.type === "lifetime" ? "Selamanya" : formattedDate}\n\nBenefit:\n• Kirim pesan tanpa batas\n• Kirim pesan hingga ke 5 kontak berbeda per hari`,
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
    })
  } else {
    await client.sendMessage(senderJid, {
      text: `😔 _*FREE USER*_ 😔\n\nHalo Kak ${userName}!\n\nStatus: ❌ Free\nLimit Kirim Pesan: ${settings.limitFreePerDay} /hari\nLimit Kirim Ke Kontak: ${settings.contactsFreePerDay} /hari\n\nUpgrade Premium Sekarang!\nKetik .premium untuk upgrade`,
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
    })
  }
}

async function handleActivatePremium(client, message, args) {
  const senderJid = message.key.remoteJid
  const ownerJid = `${process.env.OWNER_NUMBER}@s.whatsapp.net`

  // Check if sender is owner
  if (senderJid !== ownerJid) {
    await client.sendMessage(senderJid, {
      text: "❌ Perintah ini hanya untuk owner bot!",
    })
    return
  }

  // Check arguments
  if (args.length < 2) {
    await client.sendMessage(senderJid, {
      text: "❌ Format salah! Gunakan: .activate_premium nomor durasi\nDurasi: 7 atau lifetime",
    })
    return
  }

  const [targetNumber, duration] = args

  // Validate duration
  if (duration !== "7" && duration !== "lifetime") {
    await client.sendMessage(senderJid, {
      text: "❌ Durasi tidak valid! Gunakan: 7 atau lifetime",
    })
    return
  }

  // Format target number
  let formattedNumber = targetNumber
  if (formattedNumber.startsWith("0")) {
    formattedNumber = "62" + formattedNumber.slice(1)
  }
  if (formattedNumber.startsWith("+")) {
    formattedNumber = formattedNumber.slice(1)
  }

  const targetJid = `${formattedNumber}@s.whatsapp.net`

  // Activate premium
  await activatePremium(targetJid, duration)

  // Notify owner
  await client.sendMessage(senderJid, {
    text: `🎉 Premium ${duration === "lifetime" ? "selamanya" : duration + " hari"} berhasil diaktifkan untuk ${formattedNumber}.`,
  })

  // Notify user
  await client.sendMessage(targetJid, {
    text: `🎉 Selamat! Akun kamu telah diupgrade ke Premium ${duration === "lifetime" ? "selamanya" : "selama " + duration + " hari"}.\nKetik .cek_premium untuk melihat detail.`,
  })

  console.log(chalk.green(`✅ Premium activated for ${targetJid} (${duration})`))
}
