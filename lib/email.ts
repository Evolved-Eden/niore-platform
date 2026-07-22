import { Resend } from "resend"

let _resend: Resend | null = null
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!)
  }
  return _resend
}

type SendEmailParams = {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  return getResend().emails.send({
    from: from || "Evolved Eden <noreply@evolvededen.com>",
    to,
    subject,
    html,
  })
}

export async function sendPasswordResetEmail({
  to,
  resetLink,
}: {
  to: string
  resetLink: string
}) {
  return sendEmail({
    to,
    subject: "Reset your Evolved Eden password",
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#080810;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#080810;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#0d0d18;border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:40px;">
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <span style="font-size:20px;font-weight:700;letter-spacing:0.05em;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                        EVOLVED <span style="color:#c8ff00;">EDEN</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;">
                      <h1 style="margin:0;font-size:18px;font-weight:700;color:#ffffff;text-align:center;">
                        Reset your password
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:24px;">
                      <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.5);text-align:center;">
                        Someone requested a password reset for your Evolved Eden account.
                        Click the button below to set a new password.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <a href="${resetLink}" style="display:inline-block;padding:14px 32px;background:#c8ff00;color:#000000;font-size:14px;font-weight:700;text-decoration:none;border-radius:4px;letter-spacing:0.02em;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.25);text-align:center;">
                        If you didn't request this, you can safely ignore this email.
                        This link expires in 1 hour.
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;padding-top:24px;font-size:11px;color:rgba(255,255,255,0.15);text-align:center;">
                  &copy; ${new Date().getFullYear()} Evolved Eden. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  })
}

export async function sendWelcomeEmail({ to, name }: { to: string; name: string }) {
  return sendEmail({
    to,
    subject: "Welcome to Evolved Eden",
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#080810;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#080810;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#0d0d18;border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:40px;">
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <span style="font-size:20px;font-weight:700;letter-spacing:0.05em;color:#ffffff;">
                        EVOLVED <span style="color:#c8ff00;">EDEN</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;">
                      <h1 style="margin:0;font-size:18px;font-weight:700;color:#ffffff;text-align:center;">
                        Welcome${name ? `, ${name}` : ""}!
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:24px;">
                      <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.5);text-align:center;">
                        Your intelligence ecosystem is ready. Explore your dashboard to
                        configure agents, connect integrations, and unlock your potential.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <a href="https://app.evolvededen.com/dashboard" style="display:inline-block;padding:14px 32px;background:#c8ff00;color:#000000;font-size:14px;font-weight:700;text-decoration:none;border-radius:4px;">
                        Go to Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;padding-top:24px;font-size:11px;color:rgba(255,255,255,0.15);text-align:center;">
                  &copy; ${new Date().getFullYear()} Evolved Eden
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  })
}