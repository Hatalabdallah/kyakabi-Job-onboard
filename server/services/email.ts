import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_ENCRYPTION === 'ssl',
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.log('❌ Email server connection failed:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

export async function sendEmail({ to, subject, html, text }: EmailPayload) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error };
  }
}

// Template functions
export function getSignupEmailHtml(name: string, candidateId: string, role: string, password: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #002f6c; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .credentials { background: #e5e5e5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { background: #ff6600; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Kyakabi Group Limited</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your application for <strong>${role}</strong> has been successfully created!</p>
          
          <div class="credentials">
            <h3>Your Login Credentials</h3>
            <p><strong>Candidate ID:</strong> ${candidateId}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          
          <p>Please save these credentials and complete your profile at our recruitment portal.</p>
          
          <p style="margin-top: 30px;">
            <a href="http://localhost:5173" class="button">Complete Your Profile</a>
          </p>
        </div>
        <div class="footer">
          <p>Kyakabi Group Limited | Do More. Be More</p>
          <p>📧 a.ddumba@kyakabi.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getSubmissionEmailHtml(name: string, candidateId: string, role: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #002f6c; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Received ✓</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your application for <strong>${role}</strong> (ID: ${candidateId}) has been successfully submitted.</p>
          
          <h3>Next Steps:</h3>
          <ul>
            <li>Our team will review your application</li>
            <li>Interviews will be scheduled before <strong>10th March 2026</strong></li>
            <li>You'll receive interview details via email</li>
          </ul>
        </div>
        <div class="footer">
          <p>Kyakabi Group Limited | Do More. Be More</p>
          <p>📧 a.ddumba@kyakabi.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getInterviewEmailHtml(name: string, role: string, date: string, link: string) {
  const formattedDate = new Date(date).toLocaleString('en-UG', { 
    dateStyle: 'full', 
    timeStyle: 'short' 
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #002f6c; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .meeting { background: #e5e5e5; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { background: #ff6600; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Interview Scheduled</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your interview for <strong>${role}</strong> has been scheduled.</p>
          
          <div class="meeting">
            <p><strong>📅 Date:</strong> ${formattedDate}</p>
            <p><strong>🔗 Meeting Link:</strong> <a href="${link}">${link}</a></p>
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${link}" class="button">Join Meeting</a>
          </p>
          
          <p><strong>Please join 5 minutes before your scheduled time.</strong></p>
        </div>
        <div class="footer">
          <p>Kyakabi Group Limited | Do More. Be More</p>
          <p>📧 a.ddumba@kyakabi.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getApprovalEmailHtml(name: string, role: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #002f6c; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .congrats { background: #d4edda; color: #155724; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
        .button { background: #ff6600; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Congratulations! 🎉</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${name}</strong>,</p>
          
          <div class="congrats">
            <h2>You're Hired!</h2>
            <p style="font-size: 18px;">We are pleased to inform you that you have been selected for the position of <strong>${role}</strong> at Kyakabi Group Limited.</p>
          </div>
          
          <h3>Next Steps:</h3>
          <ul>
            <li>Our HR team will contact you within 24-48 hours with your offer letter and employment details</li>
            <li>Please have your identification documents ready</li>
            <li>We'll schedule an onboarding session to welcome you to the team</li>
          </ul>
          
          <p style="margin-top: 30px;">
            We were impressed with your skills and experience, and we're confident you'll be a valuable addition to our team.
          </p>
          
          <p style="text-align: center; margin: 40px 0;">
            <a href="mailto:hr@kyakabi.com" class="button">Contact HR</a>
          </p>
        </div>
        <div class="footer">
          <p>Kyakabi Group Limited | Do More. Be More</p>
          <p>📧 a.ddumba@kyakabi.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}