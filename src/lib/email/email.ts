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
  const isProduction =
    process.env.NEXT_PUBLIC_PRODUCTION_ENVIRONMENT === "true";

  if (!isProduction) {
    console.log("Not in production environment. Login at: " + text);
    return;
  }

  if (!fromEmail) {
    console.log("No from email configured, skipping email sending");
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
