import nodemailer from "nodemailer";

export function getMailer() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string | Buffer }[];
}) {
  const mailer = getMailer();
  if (!mailer) {
    console.warn("[email] SMTP not configured. Skipping send.", { to: opts.to });
    return { skipped: true };
  }
  const from = process.env.SMTP_FROM || "nomujang@example.com";
  const info = await mailer.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
  });
  return { skipped: false, messageId: info.messageId };
}
