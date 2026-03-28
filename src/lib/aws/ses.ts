import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.APP_AWS_REGION,
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!,
  },
});

export const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL!;
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL!;

interface ContactEmailParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  messageId: string;
}

export async function sendContactNotification(params: ContactEmailParams) {
  const { name, email, subject, message } = params;

  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/messages`;

  const command = new SendEmailCommand({
    Source: SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [CONTACT_EMAIL],
    },
    Message: {
      Subject: {
        Data: `[Portfolio Contact] ${subject || "New message"} from ${name}`,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: buildHtmlEmail({ name, email, subject, message, adminUrl }),
          Charset: "UTF-8",
        },
        Text: {
          Data: buildPlainTextEmail({ name, email, subject, message, adminUrl }),
          Charset: "UTF-8",
        },
      },
    },
  });

  await sesClient.send(command);
}

// ── Email Templates ──────────────────────────────────

interface EmailTemplateParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  adminUrl: string;
}

function buildHtmlEmail(params: EmailTemplateParams): string {
  const { name, email, subject, message, adminUrl } = params;
  const timestamp = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Form Submission</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background-color:#f9fafb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; margin:0 auto; padding:24px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#111827; border-radius:8px 8px 0 0; padding:24px;">
          <tr>
            <td style="color:#ffffff; font-size:18px; font-weight:600;">
              New Contact Form Message
            </td>
          </tr>
          <tr>
            <td style="color:#9ca3af; font-size:13px; padding-top:4px;">
              ${timestamp}
            </td>
          </tr>
        </table>

        <!-- Body -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border:1px solid #e5e7eb; border-top:none; padding:24px;">
          <!-- Sender Info -->
          <tr>
            <td style="padding-bottom:20px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right:16px; vertical-align:top;">
                    <div style="width:48px; height:48px; border-radius:50%; background-color:#f3f4f6; text-align:center; line-height:48px; font-size:18px; font-weight:600; color:#374151;">
                      ${escapeHtml(name.charAt(0).toUpperCase())}
                    </div>
                  </td>
                  <td style="vertical-align:top;">
                    <div style="font-size:15px; font-weight:600; color:#111827;">${escapeHtml(name)}</div>
                    <a href="mailto:${escapeHtml(email)}" style="font-size:13px; color:#6b7280; text-decoration:none;">${escapeHtml(email)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            subject
              ? `<!-- Subject -->
          <tr>
            <td style="padding-bottom:16px;">
              <div style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Subject</div>
              <div style="font-size:15px; color:#111827; margin-top:4px;">${escapeHtml(subject)}</div>
            </td>
          </tr>`
              : ""
          }

          <!-- Message -->
          <tr>
            <td>
              <div style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Message</div>
              <div style="font-size:15px; color:#374151; margin-top:8px; line-height:1.6; white-space:pre-wrap;">${escapeHtml(message)}</div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-top:24px;">
              <a href="${adminUrl}" style="display:inline-block; padding:10px 20px; background-color:#111827; color:#ffffff; border-radius:6px; font-size:14px; font-weight:500; text-decoration:none;">
                View in Admin Dashboard
              </a>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 8px 8px; padding:16px 24px;">
          <tr>
            <td style="font-size:12px; color:#9ca3af;">
              This email was sent from your portfolio contact form. You can reply directly to this email to respond to ${escapeHtml(name)}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function buildPlainTextEmail(params: EmailTemplateParams): string {
  const { name, email, subject, message, adminUrl } = params;
  const timestamp = new Date().toISOString();

  return `
New Contact Form Message
========================
Date: ${timestamp}

From: ${name} (${email})
${subject ? `Subject: ${subject}` : ""}

Message:
${message}

---
View in admin dashboard: ${adminUrl}
This email was sent from your portfolio contact form.
`.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
