import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(to: string, name: string, verificationLink: string): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP not configured; skipping verification email.");
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: "Verify your Task Hub account",
    html: `
      <p>Hi ${name},</p>
      <p>Welcome to Task Hub. Please verify your email by clicking the link below:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      <p>If you didn't create an account, you can ignore this email.</p>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: "Welcome to Task Hub",
    html: `<p>Hi ${name}, your Task Hub account has been created. You can log in now.</p>`,
  });
}
