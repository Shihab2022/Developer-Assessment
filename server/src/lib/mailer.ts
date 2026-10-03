import nodemailer, { type Transporter } from "nodemailer";
import config from "../config";

/**
 * Thin wrapper around nodemailer for the platform's transactional email.
 *
 * Uses Google's free SMTP (Gmail) by default — set `SMTP_USERNAME` /
 * `SMTP_PASSWORD` (an App Password, not your account password) in `.env`. When
 * those credentials are absent, or `MAIL_ENABLED=false`, sending is disabled and
 * callers fall back to a graceful offline mode (e.g. the account is
 * auto-verified so local development still works).
 */

let transporter: Transporter | null = null;

export const isMailEnabled = (): boolean => config.mail.enabled;

const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: {
        user: config.mail.username ?? undefined,
        pass: config.mail.password ?? undefined,
      },
    });
  }
  return transporter;
};

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Optional Reply-To (e.g. the recruiter who invited a candidate). */
  replyTo?: string;
}

/**
 * Sends an email. Never throws — a mail failure must not break the request
 * that triggered it (registration, invitation, submission, ...).
 */
export const sendMail = async (input: SendMailInput): Promise<boolean> => {
  if (!isMailEnabled()) {
    console.info(
      JSON.stringify({ level: "info", msg: "mail.disabled", to: input.to, subject: input.subject }),
    );
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: config.mail.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    return true;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "mail.send_failed",
        to: input.to,
        subject: input.subject,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return false;
  }
};

/* ----------------------------------------------------------- templates */

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Shared responsive HTML shell so every email looks consistent. */
export const renderEmailLayout = ({
  heading,
  intro,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footer,
}: {
  heading: string;
  intro: string;
  bodyHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}): string => {
  const cta =
    ctaLabel && ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
           <tr><td>
             <a href="${ctaUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:15px;">${escapeHtml(
               ctaLabel,
             )}</a>
           </td></tr>
         </table>
         <p style="font-size:12px;line-height:1.6;color:#64748b;word-break:break-all;">
           Or paste this link into your browser:<br />${escapeHtml(ctaUrl)}
         </p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 28px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">DevAssess</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">${escapeHtml(heading)}</h1>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;">${escapeHtml(intro)}</p>
              ${bodyHtml ?? ""}
              ${cta}
              ${
                footer
                  ? `<p style="margin-top:24px;font-size:12px;color:#94a3b8;line-height:1.6;">${escapeHtml(
                      footer,
                    )}</p>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                This message was sent by DevAssess. If you were not expecting it, you can ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
};

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export const buildVerificationEmail = ({
  name,
  verifyUrl,
  expiresInHours,
}: {
  name: string;
  verifyUrl: string;
  expiresInHours: number;
}): RenderedEmail => ({
  subject: "Confirm your DevAssess email address",
  html: renderEmailLayout({
    heading: `Welcome, ${name}!`,
    intro:
      "Thanks for registering. Please confirm your email address to activate your account — you will be able to sign in as soon as it is confirmed.",
    bodyHtml: `<p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:#334155;">This link expires in ${expiresInHours} hour${
      expiresInHours === 1 ? "" : "s"
    }.</p>`,
    ctaLabel: "Confirm my email",
    ctaUrl: verifyUrl,
  }),
  text: `Welcome, ${name}! Confirm your DevAssess email address: ${verifyUrl}\nThis link expires in ${expiresInHours} hours.`,
});

export const buildInvitationEmail = ({
  candidateName,
  companyName,
  assessmentTitle,
  durationMinutes,
  joinUrl,
  recruiterName,
  expiresAt,
}: {
  candidateName: string;
  companyName: string;
  assessmentTitle: string;
  durationMinutes: number;
  joinUrl: string;
  recruiterName?: string;
  expiresAt?: Date | null;
}): RenderedEmail => {
  const expiry = expiresAt
    ? `<p style="margin:12px 0 0;font-size:13px;color:#64748b;">This invitation expires on ${expiresAt.toUTCString()}.</p>`
    : "";
  return {
    subject: `${companyName} invited you to an assessment`,
    html: renderEmailLayout({
      heading: `${companyName} invited you to take an assessment`,
      intro: `Hi ${
        candidateName || "there"
      },${recruiterName ? ` ${recruiterName}` : " the hiring team"} has invited you to complete "${assessmentTitle}".`,
      bodyHtml: `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:18px;border:1px solid #e2e8f0;border-radius:12px;">
        <tr><td style="padding:14px 16px;font-size:14px;color:#334155;">
          <strong style="color:#0f172a;">Assessment:</strong> ${escapeHtml(assessmentTitle)}<br />
          <strong style="color:#0f172a;">Company:</strong> ${escapeHtml(companyName)}<br />
          <strong style="color:#0f172a;">Duration:</strong> ${durationMinutes} minutes
        </td></tr>
      </table>${expiry}`,
      ctaLabel: "Open my assessment",
      ctaUrl: joinUrl,
      footer:
        "Sign in (or create an account with this email address) to start. Each invitation can be used for a single attempt.",
    }),
    text: `${companyName} invited you to complete "${assessmentTitle}" (${durationMinutes} minutes).\nOpen: ${joinUrl}\nSign in or register with this email address to start.`,
  };
};

/**
 * Interview invitation. The `candidateUrl` is a **personal, secured** link —
 * only the invited email address can open it (the candidate must verify
 * ownership of this address before the interview starts).
 */
export const buildInterviewInviteEmail = ({
  candidateName,
  companyName,
  interviewTitle,
  jobRole,
  durationMinutes,
  candidateUrl,
  recruiterName,
  opensAt,
  expiresAt,
}: {
  candidateName?: string;
  companyName: string;
  interviewTitle: string;
  jobRole?: string | null;
  durationMinutes: number;
  candidateUrl: string;
  recruiterName?: string;
  opensAt?: Date | null;
  expiresAt?: Date | null;
}): RenderedEmail => {
  const window =
    opensAt || expiresAt
      ? `<p style="margin:12px 0 0;font-size:13px;color:#64748b;">${
          opensAt ? `Available from <strong>${opensAt.toUTCString()}</strong>` : "Available now"
        }${expiresAt ? ` until <strong>${expiresAt.toUTCString()}</strong>` : ""}.</p>`
      : "";
  return {
    subject: `${companyName} invited you to a video interview`,
    html: renderEmailLayout({
      heading: `${companyName} invited you to a video interview`,
      intro: `Hi ${candidateName || "there"},${
        recruiterName ? ` ${recruiterName}` : " the hiring team"
      } has invited you to a proctored video interview${
        jobRole ? ` for the ${escapeHtml(jobRole)} role` : ""
      }.`,
      bodyHtml: `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:18px;border:1px solid #e2e8f0;border-radius:12px;">
        <tr><td style="padding:14px 16px;font-size:14px;color:#334155;">
          <strong style="color:#0f172a;">Interview:</strong> ${escapeHtml(interviewTitle)}<br />
          <strong style="color:#0f172a;">Company:</strong> ${escapeHtml(companyName)}<br />
          <strong style="color:#0f172a;">Approx. length:</strong> ${durationMinutes} minutes
        </td></tr>
      </table>${window}`,
      ctaLabel: "Open my interview",
      ctaUrl: candidateUrl,
      footer: `This link is personal and tied to ${escapeHtml(
        "this email address",
      )}. You will be asked to verify this address before the interview starts — do not forward it. Camera and microphone access are required.`,
    }),
    text: `${companyName} invited you to a video interview${
      jobRole ? ` for the ${jobRole} role` : ""
    }: "${interviewTitle}" (~${durationMinutes} minutes).\nOpen (personal link): ${candidateUrl}\nVerify this email address before starting. Do not forward this link.`,
  };
};

/** One-time code shown to prove ownership of the invited email address. */
export const buildInterviewVerificationEmail = ({
  candidateName,
  companyName,
  interviewTitle,
  code,
  expiresInMinutes,
}: {
  candidateName?: string;
  companyName: string;
  interviewTitle: string;
  code: string;
  expiresInMinutes: number;
}): RenderedEmail => ({
  subject: `Your interview verification code: ${code}`,
  html: renderEmailLayout({
    heading: "Verify it's you",
    intro: `Hi ${candidateName || "there"}, use the code below to confirm this email address and start your ${escapeHtml(
      companyName,
    )} interview ("${escapeHtml(interviewTitle)}").`,
    bodyHtml: `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="padding:14px 22px;border:1px solid #e2e8f0;border-radius:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:30px;font-weight:700;letter-spacing:0.3em;color:#0f172a;">${escapeHtml(
        code,
      )}</td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#64748b;">This code expires in ${expiresInMinutes} minutes. If you did not request it, you can ignore this email.</p>`,
  }),
  text: `Your interview verification code is ${code}. It expires in ${expiresInMinutes} minutes.`,
});

export const buildResultEmail = ({
  candidateName,
  assessmentTitle,
  percentage,
  passed,
  earnedPoints,
  totalPoints,
  resultUrl,
}: {
  candidateName: string;
  assessmentTitle: string;
  percentage: number;
  passed: boolean;
  earnedPoints: number;
  totalPoints: number;
  resultUrl: string;
}): RenderedEmail => ({
  subject: `Your results for "${assessmentTitle}"`,
  html: renderEmailLayout({
    heading: "Your assessment results are ready",
    intro: `Hi ${candidateName || "there"}, you have completed "${assessmentTitle}". Here is a summary of your score.`,
    bodyHtml: `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:18px;border:1px solid #e2e8f0;border-radius:12px;">
      <tr><td style="padding:16px;font-size:14px;color:#334155;">
        <div style="font-size:32px;font-weight:700;color:${
          passed ? "#16a34a" : "#dc2626"
        };">${percentage}%</div>
        <div style="margin-top:4px;color:#64748b;">${earnedPoints} / ${totalPoints} points</div>
        <div style="margin-top:12px;display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;background:${
          passed ? "#dcfce7" : "#fee2e2"
        };color:${passed ? "#15803d" : "#b91c1c"};">${passed ? "PASSED" : "NOT PASSED"}</div>
      </td></tr>
    </table>`,
    ctaLabel: "View my result",
    ctaUrl: resultUrl,
  }),
  text: `Your results for "${assessmentTitle}": ${percentage}% (${earnedPoints}/${totalPoints}) — ${
    passed ? "PASSED" : "NOT PASSED"
  }.\nView: ${resultUrl}`,
});

export const buildRecruiterInviteEmail = ({
  invitedName,
  companyName,
  inviterName,
  companyCode,
  acceptUrl,
}: {
  invitedName: string;
  companyName: string;
  inviterName: string;
  companyCode: string;
  acceptUrl: string;
}): RenderedEmail => ({
  subject: `${inviterName} invited you to join ${companyName} on DevAssess`,
  html: renderEmailLayout({
    heading: `You have been invited to join ${companyName}`,
    intro: `${inviterName} has invited you to help run "${companyName}" assessments on DevAssess. Create your recruiter account and use the company code below to join.`,
    bodyHtml: `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:18px;border:1px solid #e2e8f0;border-radius:12px;">
      <tr><td style="padding:14px 16px;font-size:14px;color:#334155;">
        <strong style="color:#0f172a;">Company code:</strong>
        <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:16px;letter-spacing:0.08em;">${escapeHtml(
          companyCode,
        )}</span>
      </td></tr>
    </table>`,
    ctaLabel: "Create my account",
    ctaUrl: acceptUrl,
    footer: `Hi ${invitedName}, if you were not expecting this invitation you can ignore this email.`,
  }),
  text: `${inviterName} invited you to join ${companyName} on DevAssess. Company code: ${companyCode}. Register: ${acceptUrl}`,
});

export default sendMail;


