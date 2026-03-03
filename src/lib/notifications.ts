// Email & WhatsApp notification utilities
// Uses EmailJS for client-side email sending

const EMAILJS_CONFIG = {
  serviceId: 'service_kyakabi',
  signupTemplateId: 'template_signup',
  submissionTemplateId: 'template_submission',
  interviewTemplateId: 'template_interview',
  approvalTemplateId: 'template_approval',
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY', // Set in admin settings
  from: 'a.ddumba@kyakabi.com',
};

export interface EmailPayload {
  to_email: string;
  to_name: string;
  role: string;
  candidate_id: string;
  generated_password?: string;
  subject?: string;
  custom_message?: string;
  interview_date?: string;
  interview_link?: string;
}

// Get EmailJS config from localStorage settings
function getEmailJSConfig() {
  try {
    const settings = localStorage.getItem('kyakabi_email_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return { ...EMAILJS_CONFIG, ...parsed };
    }
  } catch {}
  return EMAILJS_CONFIG;
}

// Send email via EmailJS
export async function sendEmail(templateId: string, payload: EmailPayload): Promise<boolean> {
  try {
    const config = getEmailJSConfig();
    if (!config.publicKey || config.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
      console.warn('EmailJS not configured. Email would be sent to:', payload.to_email);
      // Log email for demo purposes
      logEmailToStorage(payload, templateId);
      return true; // Return true in demo mode
    }

    const emailjs = await import('emailjs-com');
    await emailjs.send(
      config.serviceId,
      templateId,
      {
        ...payload,
        from_name: 'Kyakabi Group Limited',
        from_email: config.from,
        company_name: 'Kyakabi Group Limited',
        company_tagline: 'Do More. Be More',
        year: new Date().getFullYear(),
      },
      config.publicKey
    );
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    logEmailToStorage(payload, templateId);
    return false;
  }
}

// Log emails to localStorage for demo/audit
function logEmailToStorage(payload: EmailPayload, type: string) {
  try {
    const logs = JSON.parse(localStorage.getItem('kyakabi_email_logs') || '[]');
    logs.unshift({
      id: Date.now().toString(),
      type,
      to: payload.to_email,
      name: payload.to_name,
      role: payload.role,
      candidateId: payload.candidate_id,
      sentAt: new Date().toISOString(),
      subject: payload.subject || getDefaultSubject(type, payload.role),
    });
    localStorage.setItem('kyakabi_email_logs', JSON.stringify(logs.slice(0, 100)));
  } catch {}
}

function getDefaultSubject(type: string, role: string): string {
  switch (type) {
    case 'signup': return `${role} Application – Welcome to Kyakabi Group`;
    case 'submission': return `${role} Application – Under Review | Kyakabi Group`;
    case 'interview': return `Interview Scheduled – ${role} | Kyakabi Group`;
    case 'approval': return `Congratulations – ${role} | Kyakabi Group`;
    default: return `Notification from Kyakabi Group`;
  }
}

// Send signup notification
export async function sendSignupEmail(payload: EmailPayload): Promise<boolean> {
  return sendEmail('signup', {
    ...payload,
    subject: `${payload.role} Application – Welcome to Kyakabi Group`,
  });
}

// Send submission confirmation
export async function sendSubmissionEmail(payload: EmailPayload): Promise<boolean> {
  return sendEmail('submission', {
    ...payload,
    subject: `${payload.role} Application – Under Review | Kyakabi Group`,
  });
}

// Send interview scheduled
export async function sendInterviewEmail(payload: EmailPayload): Promise<boolean> {
  return sendEmail('interview', {
    ...payload,
    subject: `Interview Scheduled – ${payload.role} | Kyakabi Group`,
  });
}

// Send approval
export async function sendApprovalEmail(payload: EmailPayload): Promise<boolean> {
  return sendEmail('approval', {
    ...payload,
    subject: `Congratulations! ${payload.role} Offer | Kyakabi Group`,
  });
}

// WhatsApp notification
const ADMIN_WHATSAPP = '+256701019242';

export function sendWhatsAppNotification(
  phoneNumber: string,
  message: string,
  openWindow = true
): void {
  const encodedMessage = encodeURIComponent(message);
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

  // Log to storage
  try {
    const logs = JSON.parse(localStorage.getItem('kyakabi_whatsapp_logs') || '[]');
    logs.unshift({
      id: Date.now().toString(),
      to: phoneNumber,
      message,
      sentAt: new Date().toISOString(),
    });
    localStorage.setItem('kyakabi_whatsapp_logs', JSON.stringify(logs.slice(0, 100)));
  } catch {}

  if (openWindow) {
    window.open(url, '_blank');
  }
}

export function sendSignupWhatsApp(candidateName: string, candidateId: string, role: string, password: string): void {
  const message = `🌟 *Welcome to Kyakabi Group Limited!*

Hello ${candidateName},

Your application for *${role}* has been received.

📋 *Your Login Credentials:*
• Candidate ID: *${candidateId}*
• Password: *${password}*

Please keep these credentials safe and use them to complete your profile at our recruitment portal.

*Do More. Be More* – Kyakabi Group Limited
📧 a.ddumba@kyakabi.com`;

  sendWhatsAppNotification(ADMIN_WHATSAPP, `New applicant: ${candidateName} (${candidateId}) applied for ${role}`, false);
  // In real flow, send to candidate too
}

export function sendSubmissionWhatsApp(candidateName: string, candidateId: string, role: string, phone: string): void {
  const message = `✅ *Application Submitted – Kyakabi Group*

Dear ${candidateName},

Your application for *${role}* has been successfully submitted (ID: ${candidateId}).

📅 *Next Steps:*
Interviews will be scheduled before *10th March 2026*.

We'll contact you shortly with interview details.

*Kyakabi Group Limited* | Do More. Be More
📧 a.ddumba@kyakabi.com`;

  if (phone) sendWhatsAppNotification(phone, message);
  sendWhatsAppNotification(ADMIN_WHATSAPP, `Application submitted: ${candidateName} (${candidateId}) for ${role}`, false);
}

export function sendInterviewWhatsApp(candidateName: string, role: string, date: string, link: string, phone: string): void {
  const message = `📅 *Interview Scheduled – Kyakabi Group*

Dear ${candidateName},

Your interview for *${role}* has been scheduled!

🗓 *Date:* ${new Date(date).toLocaleString('en-UG', { dateStyle: 'full', timeStyle: 'short' })}
🔗 *Meeting Link:* ${link}

Please join 5 minutes before your scheduled time.

*Kyakabi Group Limited* | Do More. Be More
📧 a.ddumba@kyakabi.com`;

  if (phone) sendWhatsAppNotification(phone, message);
}

export function getEmailLogs() {
  try {
    return JSON.parse(localStorage.getItem('kyakabi_email_logs') || '[]');
  } catch { return []; }
}

export function getWhatsAppLogs() {
  try {
    return JSON.parse(localStorage.getItem('kyakabi_whatsapp_logs') || '[]');
  } catch { return []; }
}
