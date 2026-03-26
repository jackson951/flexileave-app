const nodemailer = require("nodemailer");

const sanitizeUrl = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "undefined") return null;

  // Normalize trailing slashes and ensure host is valid
  const cleaned = trimmed.replace(/\/+$/, "");
  const prefixed = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;

  try {
    const parsed = new URL(prefixed);
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname || hostname === "undefined" || hostname.includes("undefined.")) {
      return null;
    }
    return cleaned;
  } catch (error) {
    return null;
  }
};

const FRONTEND_BASE_URL =
  sanitizeUrl(process.env.FRONTEND_BASE_URL) || "http://localhost:5173";

const EMAIL_FROM =
  process.env.EMAIL_FROM || "FlexiLeave <no-reply@flexileave.com>";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

let transporter;

// ✅ FIXED TRANSPORTER CONFIG
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // ✅ REQUIRED for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // helps avoid TLS issues
    },
  });

  // ✅ Verify connection on startup
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ SMTP connection failed:", error.message);
    } else {
      console.log("✅ SMTP server is ready to send emails");
    }
  });
} else {
  console.warn(
    "⚠️ Email disabled: Missing SMTP config (HOST, USER, PASS)"
  );
}

// =============================
// UTIL FUNCTIONS
// =============================
const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatRange = (leave) => {
  if (!leave) return "";
  return `${formatDate(leave.startDate)} — ${formatDate(leave.endDate)}`;
};

// =============================
// ENTERPRISE EMAIL TEMPLATE
// =============================
const wrapHtml = ({
  heading,
  message,
  detailsHtml,
  buttonLabel,
  buttonUrl,
  footerText,
  tenant,
}) => {
  // ✅ Dynamic branding
  const primary = tenant?.primaryColor || "#6366f1";
  const secondary = tenant?.secondaryColor || "#ec4899";
  const logo = tenant?.logoUrl;

  return `
  <!doctype html>
  <html>
    <body style="background:#f3f4f6;padding:20px;font-family:sans-serif;">
      <div style="max-width:600px;margin:auto;background:white;border-radius:16px;padding:24px;">
        
        ${
          logo
            ? `<div style="text-align:center;margin-bottom:20px;">
                <img src="${logo}" height="50" />
              </div>`
            : ""
        }

        <div style="
          background:linear-gradient(135deg, ${primary}, ${secondary});
          color:white;
          padding:16px;
          border-radius:12px;
        ">
          <h2>${heading}</h2>
        </div>

        <div style="margin-top:20px;color:#1f2937;">
          ${message}
        </div>

        ${detailsHtml || ""}

        ${
          buttonLabel && buttonUrl
            ? `<div style="margin-top:20px;text-align:center;">
                <a href="${buttonUrl}" style="
                  background:${primary};
                  color:white;
                  padding:12px 20px;
                  border-radius:8px;
                  text-decoration:none;
                  font-weight:bold;
                ">
                  ${buttonLabel}
                </a>
              </div>`
            : ""
        }

        <div style="margin-top:30px;font-size:12px;color:#6b7280;">
          ${footerText || `Sent from ${tenant?.name || "FlexiLeave"}`}
        </div>

      </div>
    </body>
  </html>
  `;
};

const buildSystemNotificationEmail = ({
  title,
  message,
  tenant,
  actionUrl,
  actionLabel,
}) => {
  const html = wrapHtml({
    heading: title,
    message: `<p>${message}</p>`,
    buttonLabel: actionLabel,
    buttonUrl: actionUrl,
    tenant,
  });

  return {
    subject: `${tenant?.name || "FlexiLeave"} • ${title}`,
    html,
  };
};

// =============================
// INVITATION EMAIL
// =============================
const buildInvitationEmail = ({
  inviteeName,
  tenant,
  inviteLink,
  expiresAt,
  invitedByName,
}) => {
  const subject = `${tenant?.name || "FlexiLeave"} Invitation`;

  const html = wrapHtml({
    heading: "You're invited!",
    message: `
      <p>Hi ${inviteeName || "there"},</p>
      <p>${invitedByName || "Admin"} invited you to join ${
      tenant?.name || "FlexiLeave"
    }.</p>
      <p>Expires: ${formatDate(expiresAt)}</p>
    `,
    buttonLabel: "Accept Invitation",
    buttonUrl: inviteLink,
    tenant,
  });

  return { subject, html };
};

// =============================
// LEAVE EMAIL
// =============================
const buildLeaveNotificationEmail = ({
  recipientName,
  leave,
  message,
  tenant,
  actionUrl,
  actionLabel = "View",
}) => {
  const html = wrapHtml({
    heading: "Leave Update",
    message: `<p>${message}</p>`,
    detailsHtml: `
      <p><strong>Type:</strong> ${leave.leaveType}</p>
      <p><strong>Dates:</strong> ${formatRange(leave)}</p>
    `,
    buttonLabel: actionLabel,
    buttonUrl: actionUrl,
    tenant,
  });

  return {
    subject: `${tenant?.name || "FlexiLeave"} Leave Update`,
    html,
  };
};

// =============================
// SEND EMAIL
// =============================
const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.warn("⚠️ Email skipped - transporter not configured");
    return;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent to:", to);
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    throw error;
  }
};

module.exports = {
  sendEmail,
  buildInvitationEmail,
  buildLeaveNotificationEmail,
  buildSystemNotificationEmail,
  FRONTEND_BASE_URL,
};
