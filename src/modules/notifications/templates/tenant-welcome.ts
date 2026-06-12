export function tenantWelcomeEmail(params: {
  firstName: string;
  email: string;
  temporaryPassword: string;
}): { subject: string; html: string } {
  const { firstName, email, temporaryPassword } = params;

  const subject = 'Welcome to Smart Wallets — Your Account is Ready';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:28px 40px;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Smart Wallets</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:600;">Welcome, ${firstName}!</h2>
              <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.65;">
                Your Smart Wallets merchant account has been created. Use the credentials below to log in for the first time.
              </p>

              <!-- Credentials box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
                      Login Credentials
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:5px 0;color:#9ca3af;font-size:13px;width:90px;vertical-align:top;">Email</td>
                        <td style="padding:5px 0;color:#111827;font-size:14px;font-weight:500;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;color:#9ca3af;font-size:13px;vertical-align:top;">Password</td>
                        <td style="padding:5px 0;color:#111827;font-size:14px;font-weight:500;font-family:'Courier New',Courier,monospace;letter-spacing:0.06em;">${temporaryPassword}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#374151;font-size:15px;line-height:1.65;">
                You will be required to change your password on first login. Keep these credentials safe until then.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">
                This is an automated message from Smart Wallets. If you did not expect this email, please ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
