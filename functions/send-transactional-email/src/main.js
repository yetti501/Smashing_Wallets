import nodemailer from 'nodemailer';

// Email templates
const templates = {
    welcome: (name) => ({
        subject: 'Welcome to Smashing Wallets!',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #FF5747; font-size: 28px; margin: 0;">Smashing Wallets</h1>
                </div>
                <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #E5E7EB;">
                    <h2 style="color: #1E3A5F; margin-top: 0;">Welcome, ${name}!</h2>
                    <p style="color: #6B7280; font-size: 16px; line-height: 1.6;">
                        Thanks for creating an account with Smashing Wallets. You're all set to start discovering and posting local events like yard sales, garage sales, estate sales, and more in your area.
                    </p>
                    <p style="color: #6B7280; font-size: 16px; line-height: 1.6;">
                        Here's what you can do:
                    </p>
                    <ul style="color: #6B7280; font-size: 16px; line-height: 1.8;">
                        <li>Browse events on the map near you</li>
                        <li>Create your own event listings</li>
                        <li>Save events to your calendar</li>
                    </ul>
                    <p style="color: #6B7280; font-size: 16px; line-height: 1.6;">
                        If you have any questions, reply to this email or reach out to us at support@smashingwallets.com.
                    </p>
                    <p style="color: #1E3A5F; font-size: 16px; font-weight: 600;">
                        Happy bargain hunting!<br>The Smashing Wallets Team
                    </p>
                </div>
                <div style="text-align: center; margin-top: 32px;">
                    <p style="color: #9CA3AF; font-size: 13px;">© 2025–2026 Smashing Wallets. All rights reserved.</p>
                </div>
            </div>
        `
    }),

    password_changed: (name) => ({
        subject: 'Your Smashing Wallets Password Was Changed',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #FF5747; font-size: 28px; margin: 0;">Smashing Wallets</h1>
                </div>
                <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #E5E7EB;">
                    <h2 style="color: #1E3A5F; margin-top: 0;">Password Changed</h2>
                    <p style="color: #6B7280; font-size: 16px; line-height: 1.6;">
                        Hi ${name}, this is a confirmation that the password for your Smashing Wallets account was successfully changed.
                    </p>
                    <p style="color: #6B7280; font-size: 16px; line-height: 1.6;">
                        If you did not make this change, please reset your password immediately and contact us at support@smashingwallets.com.
                    </p>
                    <p style="color: #1E3A5F; font-size: 16px; font-weight: 600;">
                        — The Smashing Wallets Team
                    </p>
                </div>
                <div style="text-align: center; margin-top: 32px;">
                    <p style="color: #9CA3AF; font-size: 13px;">© 2025–2026 Smashing Wallets. All rights reserved.</p>
                </div>
            </div>
        `
    }),

    account_deleted: (name) => ({
        subject: 'Your Smashing Wallets Account Has Been Deleted',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #FF5747; font-size: 28px; margin: 0;">Smashing Wallets</h1>
                </div>
                <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #E5E7EB;">
                    <h2 style="color: #1E3A5F; margin-top: 0;">Account Deleted</h2>
                    <p style="color: #6B7280; font-size: 16px; line-height: 1.6;">
                        Hi ${name}, this is a confirmation that your Smashing Wallets account and all associated data have been permanently deleted.
                    </p>
                    <p style="color: #6B7280; font-size: 16px; line-height: 1.6;">
                        We're sorry to see you go. If you ever want to come back, you're always welcome to create a new account.
                    </p>
                    <p style="color: #6B7280; font-size: 16px; line-height: 1.6;">
                        If you did not request this deletion, please contact us immediately at support@smashingwallets.com.
                    </p>
                    <p style="color: #1E3A5F; font-size: 16px; font-weight: 600;">
                        — The Smashing Wallets Team
                    </p>
                </div>
                <div style="text-align: center; margin-top: 32px;">
                    <p style="color: #9CA3AF; font-size: 13px;">© 2025–2026 Smashing Wallets. All rights reserved.</p>
                </div>
            </div>
        `
    }),
};

export default async ({ req, res, log, error }) => {
    try {
        const { type, email, name } = JSON.parse(req.body || '{}');

        if (!type || !email) {
            return res.json({ success: false, message: 'Missing type or email' }, 400);
        }

        const template = templates[type];
        if (!template) {
            return res.json({ success: false, message: `Unknown email type: ${type}` }, 400);
        }

        const { subject, html } = template(name || 'there');

        // Create transporter using SMTP credentials from environment variables
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
            from: `"${process.env.SMTP_SENDER_NAME || 'Smashing Wallets'}" <${process.env.SMTP_SENDER_EMAIL}>`,
            to: email,
            subject,
            html,
        });

        log(`Email sent: ${type} → ${email}`);
        return res.json({ success: true });
    } catch (err) {
        error(`Email send failed: ${err.message}`);
        return res.json({ success: false, message: err.message }, 500);
    }
};