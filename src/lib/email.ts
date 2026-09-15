export interface WelcomeEmailParams {
  email: string;
  bakeryName?: string;
  userName?: string;
}

export function getWelcomeEmailHtml({
  bakeryName = 'your bakery',
  dashboardUrl = 'https://bakecost-lemon.vercel.app/dashboard',
}: {
  bakeryName?: string;
  userName?: string;
  dashboardUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Doughnomic</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F1EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #26221F;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F1EC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 24px; border: 2px solid #E3DED6; overflow: hidden; box-shadow: 0 4px 20px rgba(38, 34, 31, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 32px 24px; text-align: center; border-bottom: 1px solid #E3DED6;">
              <div style="font-size: 32px; font-weight: 900; letter-spacing: -0.03em; color: #26221F; margin-bottom: 6px;">
                doughnomic
              </div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #C68A4C;">
                know what every bake really costs
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              <h1 style="font-size: 22px; font-weight: 800; color: #26221F; margin: 0 0 16px; line-height: 1.3;">
                Welcome to Doughnomic! 🥐
              </h1>
              <p style="font-size: 15px; line-height: 1.6; color: #4A4540; margin: 0 0 24px;">
                Congratulations on setting up <strong>${bakeryName}</strong> on Doughnomic. You now have the ultimate financial command centre to track ingredient costs, scale batches with precision, and safeguard your bakery’s profit margins.
              </p>

              <!-- 3-Step Quickstart Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F1EC; border-radius: 16px; border: 1px solid #E3DED6; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #6F6A63; margin-bottom: 14px;">
                      Quick Start Guide (3 Simple Steps)
                    </div>

                    <!-- Step 1 -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                      <tr>
                        <td width="28" valign="top" style="font-size: 14px; font-weight: 800; color: #C68A4C;">1.</td>
                        <td style="font-size: 14px; line-height: 1.5; color: #26221F;">
                          <strong>Add your Pantry Ingredients:</strong> Enter your package sizes and purchase prices to calculate exact gram/ml unit costs.
                        </td>
                      </tr>
                    </table>

                    <!-- Step 2 -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                      <tr>
                        <td width="28" valign="top" style="font-size: 14px; font-weight: 800; color: #C68A4C;">2.</td>
                        <td style="font-size: 14px; line-height: 1.5; color: #26221F;">
                          <strong>Create Recipes:</strong> Combine ingredients, specify labour time and overhead rates to see your true cost-per-unit.
                        </td>
                      </tr>
                    </table>

                    <!-- Step 3 -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="28" valign="top" style="font-size: 14px; font-weight: 800; color: #C68A4C;">3.</td>
                        <td style="font-size: 14px; line-height: 1.5; color: #26221F;">
                          <strong>Scale Batches & Protect Margins:</strong> Use the Scale tool to scale yields instantly with full 4-segment cost breakdowns.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #26221F; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(38, 34, 31, 0.2);">
                      Open My Bakery Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; line-height: 1.5; color: #6F6A63; margin: 0;">
                Need help or have questions? Simply reply to this email anytime. Happy baking! 🥖
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #F4F1EC; border-top: 1px solid #E3DED6; text-align: center; font-size: 12px; color: #6F6A63;">
              © ${new Date().getFullYear()} Doughnomic. Built for artisan bakers & pastry chefs.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendWelcomeEmail({ email, bakeryName, userName }: WelcomeEmailParams) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://bakecost-lemon.vercel.app'}/dashboard`;
    const html = getWelcomeEmailHtml({ bakeryName, userName, dashboardUrl });

    // If RESEND_API_KEY is configured in environment
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Doughnomic <hello@doughnomic.co.za>',
          to: [email],
          subject: `Welcome to Doughnomic, ${bakeryName || 'Baker'}! 🥐`,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Failed to send welcome email via Resend:', err);
      }
      return;
    }

    // Fallback: log email notification
    console.log(`[Doughnomic Email] Welcome email generated for: ${email} (${bakeryName || 'New Bakery'})`);
  } catch (error) {
    console.error('Error in sendWelcomeEmail:', error);
  }
}
