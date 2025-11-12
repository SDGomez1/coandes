import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const fromEmail = "auth@sdgomez.com";

export async function sendMail(to: string, subject: string, html: string) {
  const res = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
  });

  if (res.error) {
    throw new Error(`Resend error: ${res.error.message}`);
  }
}
