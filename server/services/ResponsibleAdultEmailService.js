import 'dotenv/config';
import { Resend } from "resend"

// Only initialize Resend if API key is provided
let resend = null;
if (process.env.RESEND_API_KEY) {
    try {
        resend = new Resend(process.env.RESEND_API_KEY);
    } catch (error) {
        console.warn('Failed to initialize Resend:', error.message);
    }
}

export async function sendResponsibleAdultEmail(to, subject, body) {
    // Check if email service is configured
    if (!resend || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        throw new Error('Email service is not configured. Please set RESEND_API_KEY and EMAIL_FROM in .env file.');
    }

    await resend.emails.send({
        from: `"My Digital Sister" <${process.env.EMAIL_FROM}>`,
        to,
        subject: subject,
        text: body,
    })
}