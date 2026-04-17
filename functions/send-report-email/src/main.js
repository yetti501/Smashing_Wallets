import nodemailer from 'nodemailer';
import { Client, Users } from 'node-appwrite';

const lookupUserEmail = async (userId, log) => {
    if (!userId || userId === 'anonymous') return null;
    try {
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT)
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const users = new Users(client);
        const user = await users.get(userId);
        return user.email || null;
    } catch (err) {
        log(`User lookup failed for ${userId}: ${err.message}`);
        return null;
    }
};

const buildEmail = (data) => {
    const {
        reportType,
        listingId,
        listingTitle,
        reportedUserId,
        reportedUserEmail,
        reporterUserId,
        reporterEmail,
        reporterAccountStatus,
        description,
    } = data;

    const subject = `[Smashing Wallets] Listing Reported: ${reportType || 'Unknown'}`;

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #FF5747; font-size: 28px; margin: 0;">Smashing Wallets</h1>
                <p style="color: #6B7280; font-size: 14px; margin: 8px 0 0 0;">Report Notification</p>
            </div>

            <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #E5E7EB;">
                <h2 style="color: #1E3A5F; margin-top: 0;">New Listing Report</h2>
                <p style="color: #6B7280; font-size: 16px; line-height: 1.6;">
                    A listing has been reported and requires review.
                </p>

                <h3 style="color: #1E3A5F; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; margin-top: 24px;">Report Details</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 8px 0;">
                    <tr>
                        <td style="padding: 10px 0; color: #6B7280; font-weight: 600; width: 40%;">Report Type:</td>
                        <td style="padding: 10px 0; color: #1E3A5F;">${reportType || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #6B7280; font-weight: 600;">Description:</td>
                        <td style="padding: 10px 0; color: #1E3A5F;">${description || '<em>None provided</em>'}</td>
                    </tr>
                </table>

                <h3 style="color: #1E3A5F; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; margin-top: 24px;">Listing Info</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 8px 0;">
                    <tr>
                        <td style="padding: 10px 0; color: #6B7280; font-weight: 600; width: 40%;">Listing Title:</td>
                        <td style="padding: 10px 0; color: #1E3A5F;">${listingTitle || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #6B7280; font-weight: 600;">Listing ID:</td>
                        <td style="padding: 10px 0; color: #1E3A5F; font-family: monospace; font-size: 13px;">${listingId || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #6B7280; font-weight: 600;">Listing Owner Email:</td>
                        <td style="padding: 10px 0; color: #1E3A5F;">${reportedUserEmail ? `<a href="mailto:${reportedUserEmail}" style="color: #FF5747;">${reportedUserEmail}</a>` : 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #6B7280; font-weight: 600;">Listing Owner ID:</td>
                        <td style="padding: 10px 0; color: #1E3A5F; font-family: monospace; font-size: 13px;">${reportedUserId || 'N/A'}</td>
                    </tr>
                </table>

                <h3 style="color: #1E3A5F; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; margin-top: 24px;">Reporter Info</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 8px 0;">
                    <tr>
                        <td style="padding: 10px 0; color: #6B7280; font-weight: 600; width: 40%;">Account Status:</td>
                        <td style="padding: 10px 0; color: #1E3A5F;">${reporterAccountStatus || 'Unknown'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #6B7280; font-weight: 600;">Email:</td>
                        <td style="padding: 10px 0; color: #1E3A5F;">${reporterEmail ? `<a href="mailto:${reporterEmail}" style="color: #FF5747;">${reporterEmail}</a>` : 'N/A'}</td>
                    </tr>
                    ${reporterUserId ? `
                    <tr>
                        <td style="padding: 10px 0; color: #6B7280; font-weight: 600;">Account ID:</td>
                        <td style="padding: 10px 0; color: #1E3A5F; font-family: monospace; font-size: 13px;">${reporterUserId}</td>
                    </tr>
                    ` : ''}
                </table>

                <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 24px; padding: 16px; background: #F9FAFB; border-radius: 8px;">
                    Review this report in the Appwrite dashboard under the Reports collection.
                </p>
            </div>

            <div style="text-align: center; margin-top: 32px;">
                <p style="color: #9CA3AF; font-size: 13px;">© 2025–2026 Smashing Wallets. All rights reserved.</p>
            </div>
        </div>
    `;

    return { subject, html };
};

export default async ({ req, res, log, error }) => {
    try {
        const data = JSON.parse(req.body || '{}');

        if (!data.reportType || !data.listingId) {
            return res.json({ success: false, message: 'Missing reportType or listingId' }, 400);
        }

        const reportedUserEmail = await lookupUserEmail(data.reportedUserId, log);
        const emailData = { ...data, reportedUserEmail };

        const recipient = process.env.REPORT_RECIPIENT_EMAIL || 'report@smashingwallets.com';
        const { subject, html } = buildEmail(emailData);

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"${process.env.SMTP_SENDER_NAME || 'Smashing Wallets Reports'}" <${process.env.SMTP_SENDER_EMAIL}>`,
            to: recipient,
            replyTo: data.reporterEmail || undefined,
            subject,
            html,
        });

        log(`Report email sent → ${recipient} for listing ${data.listingId}`);
        return res.json({ success: true });
    } catch (err) {
        error(`Report email failed: ${err.message}`);
        return res.json({ success: false, message: err.message }, 500);
    }
};
