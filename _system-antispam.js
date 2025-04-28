export async function all(m, { conn }) {
  const prefix = /^[!./#\\]/.test(m.text) ? m.text[0] : null
  if (!prefix) return

  const command = m.text.slice(prefix.length).trim().split(/ +/).shift().toLowerCase()
  if (!command) return

  const user = global.db.data.users[m.sender]
  const chat = global.db.data.chats[m.chat] || {}
  const isOwner = global.staff.owner.some(([id]) => m.sender.startsWith(id))
  const now = Date.now()

  if (!user || isOwner || chat?.banChat) return

  // Inisialisasi user kalau belum ada data
  user.spamCount = user.spamCount || 0
  user.banned = user.banned || false
  user.bannedTime = user.bannedTime || 0
  user.bannedPermanently = user.bannedPermanently || false

  this.spam = this.spam || {}
  this.spam[m.sender] = this.spam[m.sender] || { lastSpam: 0 }

  const timeout = 10_000 // 10 detik
  const resetSpamAfter = 10 * 60 * 1000 // 10 menit

  if (user.banned && !user.bannedPermanently) {
    if (now < user.bannedTime) {
      const sisa = ((user.bannedTime - now) / 60000).toFixed(1)
      return m.reply(`⛔ Kamu masih banned. Tunggu ${sisa} menit lagi.`)
    } else {
      user.banned = false
      user.bannedTime = 0
      user.spamCount = 0
    }
  }

  if (now - this.spam[m.sender].lastSpam > resetSpamAfter) {
    user.spamCount = 0
  }

  if (now - this.spam[m.sender].lastSpam < timeout) {
    user.spamCount += 1

    if (user.spamCount >= 3) {
      user.banned = true
      user.bannedPermanently = true
      return m.reply(`⛔ Kamu diblokir permanen karena spam! Hubungi Owner untuk banding.\n${global.staff.nomorown}`)
    } else {
      user.banned = true
      user.bannedTime = now + 3 * 60 * 1000 // 3 menit
      return m.reply(`⚠️ Jangan spam command! Kamu banned sementara 3 menit [Peringatan ke-${user.spamCount}]`)
    }
  } else {
    this.spam[m.sender].lastSpam = now
  }
}