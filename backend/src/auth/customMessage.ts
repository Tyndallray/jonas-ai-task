import type { CustomMessageTriggerEvent } from 'aws-lambda';

const BRAND = 'Jonas AI';
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// Email clients strip <style>, so everything is inline styles on a single-column table
function layout(heading: string, intro: string, code: string, footer: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f5f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:8px;font-family:${FONT};color:#1f2328;">
<tr><td style="padding:24px 32px;border-bottom:1px solid #e6e8eb;font-size:18px;font-weight:700;">${BRAND}</td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 16px;font-size:22px;">${heading}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.5;">${intro}</p>
<div style="margin:0 0 24px;padding:16px;background:#f4f5f7;border-radius:6px;text-align:center;font-family:Menlo,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:6px;">${code}</div>
<p style="margin:0;font-size:13px;line-height:1.5;color:#59636e;">${footer}</p>
</td></tr>
</table>
<p style="margin:16px 0 0;font-family:${FONT};font-size:12px;color:#8c959f;">Sent by ${BRAND}. This is an automated message; replies aren't monitored.</p>
</td></tr>
</table>
</body></html>`;
}

function verifyEmail(code: string) {
  return {
    subject: `Verify your email for ${BRAND}`,
    html: layout(
      'Confirm your email address',
      `Enter this code in ${BRAND} to verify your email address.`,
      code,
      "The code expires in 24 hours. If you didn't create an account or change your email, you can ignore this message.",
    ),
  };
}

function resetPassword(code: string) {
  return {
    subject: `Reset your ${BRAND} password`,
    html: layout(
      'Reset your password',
      `We received a request to reset your ${BRAND} password. Enter this code to choose a new one.`,
      code,
      "The code expires in 1 hour. If you didn't request a password reset, you can ignore this message; your password won't change.",
    ),
  };
}

// Attached to both user pools; trigger sources not handled here keep Cognito's default message
export const customMessage = async (event: CustomMessageTriggerEvent) => {
  const code = event.request.codeParameter;
  let email: { subject: string; html: string } | undefined;
  switch (event.triggerSource) {
    case 'CustomMessage_SignUp':
    case 'CustomMessage_ResendCode':
    case 'CustomMessage_VerifyUserAttribute':
      email = verifyEmail(code);
      break;
    case 'CustomMessage_ForgotPassword':
      email = resetPassword(code);
      break;
  }
  if (email) {
    event.response.emailSubject = email.subject;
    event.response.emailMessage = email.html;
  }
  return event;
};
