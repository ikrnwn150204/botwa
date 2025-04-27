// main.js - Entry point for the WhatsApp Confess Bot
import { createBaileysClient } from './utils/baileysClient.js';
import { messageHandler } from './handlers/messageHandler.js';
import { resetDailyLimits, checkPremiumExpiry } from './utils/scheduler.js';
import { loadDatabase } from './utils/database.js';
import dotenv from 'dotenv';
import cron from 'node-cron';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Main function
async function main() {
  try {
    // Initialize database
    console.log(chalk.blue('🔄 Loading database...'));
    await loadDatabase();
    
    // Schedule daily tasks
    cron.schedule('0 0 * * *', resetDailyLimits); // Reset limits at midnight
    cron.schedule('0 12 * * *', checkPremiumExpiry); // Check premium expiry at noon
    
    // Start the bot
    await startBot();
  } catch (error) {
    console.error(chalk.red('❌ Error starting application:'), error);
    process.exit(1);
  }
}

async function startBot() {
  try {
    console.log(chalk.green('🤖 Starting Confess Bot...'));
    
    // Create Baileys client
    const client = await createBaileysClient();
    
    // Register message handler
    client.ev.on('messages.upsert', async ({ messages }) => {
      if (messages && messages[0]) {
        await messageHandler(client, messages[0]);
      }
    });
    
    console.log(chalk.green('✅ Bot is running!'));
    console.log(chalk.blue(`👤 Owner: ${process.env.OWNER_NUMBER}`));
    console.log(chalk.blue(`🤖 Bot Name: ${process.env.BOT_NAME}`));
    console.log(chalk.blue(`⌨️ Prefix: ${process.env.PREFIX}`));
  } catch (error) {
    console.error(chalk.red('❌ Error starting bot:'), error);
    process.exit(1);
  }
}

// Run the application
main();
