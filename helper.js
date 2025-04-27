// utils/helper.js - Helper functions
import moment from "moment-timezone"

// Set timezone
moment.tz.setDefault("Asia/Jakarta")

// Format phone number to standard format
export function formatPhoneNumber(number) {
  if (!number) return null

  let cleaned = number.replace(/\D/g, "")

  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1)
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1)
  }

  if (cleaned.startsWith("62") && cleaned.length >= 10 && cleaned.length <= 14) {
    return cleaned
  }

  return null
}

// Get formatted date and time
export function getFormattedDateTime() {
  return moment().format("YYYY-MM-DD HH:mm:ss")
}

// Get formatted date
export function getFormattedDate() {
  return moment().format("YYYY-MM-DD")
}

// Calculate days difference between two dates
export function getDaysDifference(date1, date2) {
  const d1 = moment(date1)
  const d2 = moment(date2)
  return d2.diff(d1, "days")
}

// Get greeting based on time of day
export function ucapan() {
  const hour = moment().hour()
  if (hour >= 0 && hour < 4) {
    return "Selamat Dini Hari"
  } else if (hour >= 4 && hour < 12) {
    return "Selamat Pagi"
  } else if (hour >= 12 && hour < 15) {
    return "Selamat Siang"
  } else if (hour >= 15 && hour < 18) {
    return "Selamat Sore"
  } else {
    return "Selamat Malam"
  }
}

// XP and level calculations
export function canLevelUp(level, exp, multiplier = 38) {
  if (level < 0) return false
  if (level === 0) return exp >= 0

  const { min } = xpRange(level, multiplier)
  return exp >= min
}

export function xpRange(level, multiplier = 38) {
  if (level < 0) throw new TypeError("Level cannot be negative")
  if (level === 0) return { min: 0, max: 0, xp: 0 }

  const min = level * level * multiplier
  const max = (level + 1) * (level + 1) * multiplier
  const xp = max - min

  return { min, max, xp }
}

// Get role based on level
export function getRoleByLevel(level) {
  const roles = {
    0: "Newbie",
    5: "Beginner",
    10: "Novice",
    15: "Intermediate",
    20: "Advanced",
    25: "Expert",
    30: "Master",
    40: "Grandmaster",
    50: "Legend",
    70: "Mythic",
    90: "Mythical Glory",
  }

  let role = "Newbie"
  for (const lvl in roles) {
    if (level >= Number.parseInt(lvl)) {
      role = roles[lvl]
    }
  }

  return role
}
