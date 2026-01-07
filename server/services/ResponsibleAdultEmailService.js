import 'dotenv/config';
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY);

const SUBJECT = 'My Digital Sister - התראת בטיחות';

export async function sendResponsibleAdultEmail(to, body) {
    await resend.emails.send({
        from: `"My Digital Sister" <${process.env.EMAIL_FROM}>`,
        to,
        subject: SUBJECT,
        text: body,
    })
}