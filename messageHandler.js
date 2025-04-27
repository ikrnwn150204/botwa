// handlers/messageHandler.js - Main message router
import { confessHandler } from "./confessHandler.js"
import { premiumHandler } from "./premiumHandler.js"
import { ownerHandler } from "./ownerHandler.js"
import { welcomeHandler } from "./welcomeHandler.js"
import { antispamHandler } from "./antispamHandler.js"
import { levelHandler } from "./levelHandler.js"
import { getUser, updateUser } from "../utils/database.js"
import chalk from "chalk"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function messageHandler(client, message) {
  try {
    // Ignore messages from the bot itself
    if (message.key.fromMe) return

    const content = message.message || {}
    if (!content) return

    const messageType = Object.keys(content)[0]
    let messageText = ""

    if (messageType === "conversation") {
      messageText = content.conversation
    } else if (messageType === "extendedTextMessage") {
      messageText = content.extendedTextMessage.text
    } else if (messageType === "buttonsResponseMessage" && content.buttonsResponseMessage?.selectedButtonId) {
      messageText = content.buttonsResponseMessage.selectedButtonId
    } else if (messageType === "listResponseMessage" && content.listResponseMessage?.singleSelectReply?.selectedRowId) {
      messageText = content.listResponseMessage.singleSelectReply.selectedRowId
    }

    const senderJid = message.key.remoteJid

    // Process level system for all messages
    await levelHandler(client, message)

    // Get user data
    const user = await getUser(senderJid)

    // Check if user is in a confess state
    if (user.state && user.state.startsWith("confess:")) {
      return await confessHandler(client, message, messageText, user)
    }

    const prefix = process.env.PREFIX || "."

    if (messageText.startsWith(prefix)) {
      // Check for spam before processing command
      const canProceed = await antispamHandler(client, message, messageText)
      if (!canProceed) return

      const [command, ...args] = messageText.slice(prefix.length).trim().split(" ")

      console.log(chalk.blue(`📩 Command received: ${command} from ${senderJid}`))

      switch (command.toLowerCase()) {
        case "menu":
          return await welcomeHandler(client, message, "menu")

        case "confes":
          return await confessHandler(client, message, messageText, user)

        case "confess":
          await updateUser(senderJid, { state: "confess:waiting_contact" })
          return await confessHandler(client, message, "start", user)

        case "premium":
          return await premiumHandler(client, message, "info")

        case "cek_premium":
          return await premiumHandler(client, message, "check")

        case "activate_premium":
          return await premiumHandler(client, message, "activate", args)

        case "owner":
          return await ownerHandler(client, message)

        case "stop":
          return await confessHandler(client, message, "stop", user)

        case "terima":
          return await confessHandler(client, message, "accept", user)

        case "tolak":
          return await confessHandler(client, message, "reject", user)

        default:
          return await welcomeHandler(client, message, "welcome")
      }
    } else {
      // Handle button responses
      if (messageText === "accept" || messageText === "reject" || messageText === "TERIMA" || messageText === "TOLAK") {
        const response =
          messageText.toLowerCase() === "terima" || messageText.toLowerCase() === "accept" ? "accept" : "reject"
        return await confessHandler(client, message, response, user)
      }

      return await welcomeHandler(client, message, "welcome")
    }
  } catch (error) {
    console.error(chalk.red("❌ Error in message handler:"), error)
  }
}
