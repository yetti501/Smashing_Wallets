import { functions } from './appwrite'

// This must match the Function ID you create in Appwrite Console
const EMAIL_FUNCTION_ID = 'send-transactional-email'

/**
 * Send a transactional email via Appwrite Function
 * @param {string} type - Email type: 'welcome', 'password_changed', 'account_deleted'
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 */
export async function sendTransactionalEmail(type, email, name) {
    try {
        const payload = JSON.stringify({ type, email, name })
        await functions.createExecution(
            EMAIL_FUNCTION_ID,
            payload,
            true // async execution
        )
    } catch (error) {
        // Non-blocking — don't let email failures break app functionality
    }
}