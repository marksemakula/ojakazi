import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVerificationEmail(
  toEmail: string,
  domain: string,
  token: string
): Promise<void> {
  const transporter = createTransporter();
  const appUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: `Verify domain ${domain} – Ojakazi`,
    text: `
You have been asked to verify ownership of ${domain} for Ojakazi.

Your verification token is: ${token}

Please visit ${appUrl}/organization to complete verification, or reply to this email to confirm.

This token expires in 7 days.
`.trim(),
    html: `
<p>You have been asked to verify ownership of <strong>${domain}</strong> for Ojakazi.</p>
<p>Your verification token is: <code>${token}</code></p>
<p>Please visit <a href="${appUrl}/organization">${appUrl}/organization</a> to complete verification.</p>
<p><em>This token expires in 7 days.</em></p>
`.trim(),
  });
}

export async function sendWelcomeEmail(toEmail: string, name: string): Promise<void> {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: 'Welcome to Ojakazi',
    text: `Hi ${name},\n\nYour account has been created. You can now log in at ${process.env.FRONTEND_URL}.`,
  });
}
