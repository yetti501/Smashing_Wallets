import { functions } from './appwrite'

const REPORT_FUNCTION_ID = 'send-report-email'

/**
 * Send a report notification email via the dedicated Appwrite function.
 * @param {object} data - Report payload
 * @param {string} data.reportType - Type of report (spam, inappropriate, scam, other)
 * @param {string} data.listingId - ID of the reported listing
 * @param {string} [data.listingTitle] - Title of the reported listing
 * @param {string} data.reportedUserId - User ID of the listing owner
 * @param {string} [data.reporterUserId] - User ID of the reporter (if logged in)
 * @param {string} data.reporterEmail - Email of the reporter
 * @param {string} data.reporterAccountStatus - "Logged In" or "Anonymous"
 * @param {string} [data.description] - Optional description provided by reporter
 */
export async function sendReportEmail(data) {
    try {
        await functions.createExecution(
            REPORT_FUNCTION_ID,
            JSON.stringify(data),
            true
        )
    } catch (error) {
        // Non-blocking — don't let email failures break the report flow
    }
}
