// utils/database.js - Database operations
import low from "lowdb"
import FileSync from "lowdb/adapters/FileSync.js"
import path from "path"
import fs from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import { dirname } from "path"

// Karena di ES Module __dirname tidak ada, kita buat manual:
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Database instances
let settings, users, premium, confessLogs, levelData, spamData

// Default data
const defaultSettings = {
  limitFreePerDay: 10,
  contactsFreePerDay: 1,
  limitPremiumPerDay: -1,
  contactsPremiumPerDay: 5,
  price7Days: 2000,
  priceLifetime: 5000,
}

const defaultUsers = {}
const defaultPremium = {}
const defaultConfessLogs = []
const defaultLevelData = {}
const defaultSpamData = {}

// Initialize database
export async function loadDatabase() {
  try {
    const dbDir = path.join(__dirname, "..", "database")
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    const settingsFile = path.join(dbDir, "settings.json")
    const settingsAdapter = new FileSync(settingsFile)
    settings = low(settingsAdapter)
    settings.defaults(defaultSettings).write()

    const usersFile = path.join(dbDir, "users.json")
    const usersAdapter = new FileSync(usersFile)
    users = low(usersAdapter)
    users.defaults(defaultUsers).write()

    const premiumFile = path.join(dbDir, "premium.json")
    const premiumAdapter = new FileSync(premiumFile)
    premium = low(premiumAdapter)
    premium.defaults(defaultPremium).write()

    const confessLogsFile = path.join(dbDir, "confess_logs.json")
    const confessLogsAdapter = new FileSync(confessLogsFile)
    confessLogs = low(confessLogsAdapter)
    confessLogs.defaults(defaultConfessLogs).write()

    // Add level data file
    const levelDataFile = path.join(dbDir, "level_data.json")
    const levelDataAdapter = new FileSync(levelDataFile)
    levelData = low(levelDataAdapter)
    levelData.defaults(defaultLevelData).write()

    // Add spam data file
    const spamDataFile = path.join(dbDir, "spam_data.json")
    const spamDataAdapter = new FileSync(spamDataFile)
    spamData = low(spamDataAdapter)
    spamData.defaults(defaultSpamData).write()

    console.log(chalk.green("✅ Database loaded successfully"))
  } catch (error) {
    console.error(chalk.red("❌ Error loading database:"), error)
    throw error
  }
}

// Settings operations
export async function getSettings() {
  return settings.value()
}

// User operations
export async function getUser(jid) {
  if (!users.has(jid).value()) {
    users
      .set(jid, {
        level: 1,
        exp: 0,
        sentCount: 0,
        contactCount: 0,
        state: null,
        spamCount: 0,
        banned: false,
        bannedTime: 0,
        bannedPermanently: false,
        autolevelup: true,
        role: "Newbie",
      })
      .write()
  }
  return users.get(jid).value()
}

export async function updateUser(jid, data) {
  users.get(jid).assign(data).write()
  return users.get(jid).value()
}

export async function resetAllUserLimits() {
  const allUsers = users.value()
  for (const jid in allUsers) {
    users
      .get(jid)
      .assign({
        sentCount: 0,
        contactCount: 0,
      })
      .write()
  }
  console.log(chalk.green("✅ All user limits reset"))
}

// Premium operations
export async function isPremium(jid) {
  if (!premium.has(jid).value()) return false

  const premiumData = premium.get(jid).value()
  const now = new Date()
  const expiresAt = new Date(premiumData.expiresAt)

  if (premiumData.type === "lifetime") return true
  if (expiresAt > now) return true

  premium.unset(jid).write()
  return false
}

export async function getPremiumInfo(jid) {
  return premium.has(jid).value() ? premium.get(jid).value() : null
}

export async function activatePremium(jid, days) {
  const now = new Date()
  const expiresAt = new Date()

  if (days === "lifetime") {
    premium
      .set(jid, {
        expiresAt: new Date(2099, 11, 31).toISOString(),
        type: "lifetime",
        activatedAt: now.toISOString(),
        activatedBy: process.env.OWNER_NUMBER + "@s.whatsapp.net",
      })
      .write()
  } else {
    expiresAt.setDate(now.getDate() + Number.parseInt(days))
    premium
      .set(jid, {
        expiresAt: expiresAt.toISOString(),
        type: days === "7" ? "7days" : days,
        activatedAt: now.toISOString(),
        activatedBy: process.env.OWNER_NUMBER + "@s.whatsapp.net",
      })
      .write()
  }

  return premium.get(jid).value()
}

export async function checkExpiredPremium() {
  const now = new Date()
  const allPremium = premium.value()
  const expiredUsers = []

  for (const jid in allPremium) {
    if (allPremium[jid].type === "lifetime") continue

    const expiresAt = new Date(allPremium[jid].expiresAt)
    if (expiresAt <= now) {
      expiredUsers.push(jid)
      premium.unset(jid).write()
    }
  }

  return expiredUsers
}

// Confess logs operations
export async function addConfessLog(data) {
  const logs = confessLogs.value()
  logs.push(data)
  confessLogs.write()
  return logs.length - 1
}

export async function updateConfessStatus(index, status) {
  const logs = confessLogs.value()
  if (logs[index]) {
    logs[index].status = status
    logs[index].responseTimestamp = new Date().toISOString()
    confessLogs.write()
  }
}

export async function getConfessLogs() {
  return confessLogs.value()
}

// Level system operations
export async function getUserLevel(jid) {
  if (!levelData.has(jid).value()) {
    levelData
      .set(jid, {
        level: 1,
        exp: 0,
        lastMessageTime: Date.now(),
      })
      .write()
  }
  return levelData.get(jid).value()
}

export async function updateUserLevel(jid, data) {
  levelData.get(jid).assign(data).write()
  return levelData.get(jid).value()
}

export async function addUserExp(jid, amount) {
  const user = await getUserLevel(jid)
  const newExp = user.exp + amount

  await updateUserLevel(jid, {
    exp: newExp,
    lastMessageTime: Date.now(),
  })

  return newExp
}

// Spam system operations
export async function getUserSpamData(jid) {
  if (!spamData.has(jid).value()) {
    spamData
      .set(jid, {
        spamCount: 0,
        lastSpam: 0,
        banned: false,
        bannedTime: 0,
        bannedPermanently: false,
      })
      .write()
  }
  return spamData.get(jid).value()
}

export async function updateUserSpamData(jid, data) {
  spamData.get(jid).assign(data).write()
  return spamData.get(jid).value()
}

// Check if user is banned
export async function isUserBanned(jid) {
  const userData = await getUserSpamData(jid)

  if (!userData.banned) return false

  if (userData.bannedPermanently) return true

  const now = Date.now()
  if (now < userData.bannedTime) return true

  // Ban expired, reset ban status
  await updateUserSpamData(jid, {
    banned: false,
    bannedTime: 0,
    spamCount: 0,
  })

  return false
}
