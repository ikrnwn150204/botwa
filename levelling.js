// lib/levelling.js - Functions for the leveling system

// Calculate if user can level up
export function canLevelUp(level, exp, multiplier = 38) {
    if (level < 0) return false
    if (level === 0) return exp >= 0
  
    const { min } = xpRange(level, multiplier)
    return exp >= min
  }
  
  // Calculate XP range for a level
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
  
  // Calculate XP needed for next level
  export function getXpNeeded(level, exp, multiplier = 38) {
    const { min, max } = xpRange(level, multiplier)
    return {
      current: exp - min,
      needed: max - min,
      total: max - exp,
    }
  }
  
  // Add XP to user
  export function addXp(level, exp, amount, multiplier = 38) {
    let newExp = exp + amount
    let newLevel = level
  
    while (canLevelUp(newLevel, newExp, multiplier)) {
      newExp -= xpRange(newLevel, multiplier).min
      newLevel++
    }
  
    return {
      level: newLevel,
      exp: newExp,
      leveledUp: newLevel > level,
    }
  }
  