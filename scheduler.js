// utils/scheduler.js - Scheduled tasks
import { resetAllUserLimits, checkExpiredPremium } from './database.js';
import chalk from 'chalk';

// Reset daily limits for all users
export async function resetDailyLimits() {
  try {
    console.log(chalk.blue('🔄 Resetting daily limits for all users...'));
    await resetAllUserLimits();
    console.log(chalk.green('✅ Daily limits reset successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Error resetting daily limits:'), error);
  }
}

// Check and handle expired premium subscriptions
export async function checkPremiumExpiry() {
  try {
    console.log(chalk.blue('🔄 Checking premium expiry...'));
    const expiredUsers = await checkExpiredPremium();
    
    if (expiredUsers.length > 0) {
      console.log(chalk.yellow(`⚠️ ${expiredUsers.length} premium subscriptions expired`));
    } else {
      console.log(chalk.green('✅ No expired premium subscriptions'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error checking premium expiry:'), error);
  }
}
