import { functions } from './appwrite'

const EMAIL_FUNCTION_ID = 'send-transactional-email'

/**
 * Send a transactional email via Appwrite Function
 * @param {string} type - Email type: 'welcome', 'password_changed', 'account_deleted', 'report_notification'
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {object} extra - Additional data for the template
 */
export async function sendTransactionalEmail(type, email, name, extra) {
    try {
        const payload = JSON.stringify({ type, email, name, extra })
        await functions.createExecution(
            EMAIL_FUNCTION_ID,
            payload,
            true
        )
    } catch (error) {
        // Non-blocking — don't let email failures break app functionality
    }
}
