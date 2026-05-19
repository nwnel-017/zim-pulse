import { resend } from "@/lib/email/resend";

type SendAuthEmailInput = {
  email: string;
  subject: string;
  text: string;
};

export async function sendAuthEmail({
  email,
  subject,
  text,
}: SendAuthEmailInput): Promise<void> {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const fromName = process.env.APP_NAME ?? "ZimPulse";

  if (!fromEmail) {
    console.info(`[auth:email] ${email}`);
    console.info(`[auth:subject] ${subject}`);
    console.info(text);
    return;
  }

  const from = `${fromName} <${fromEmail}>`;

  const { error } = await resend.emails.send({
    from,
    subject,
    text,
    to: email,
  });

  if (error) {
    throw new Error(error.message);
  }
}
