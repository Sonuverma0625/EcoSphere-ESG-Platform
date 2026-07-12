const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Create reusable transporter object using environmental variables
const getTransporter = () => {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
};

/**
 * Send notification (In-app and optionally email if configured)
 * @param {string} userId - Recipient User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification details
 * @param {string} type - Notification Category ('Compliance', 'CSR', etc)
 * @param {string} [relatedType] - Related model name
 * @param {string} [relatedId] - Related document ID
 */
const createNotification = async ({
  userId,
  title,
  message,
  type,
  relatedEntityType = null,
  relatedEntityId = null
}) => {
  try {
    // 1. Save in-app notification
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      relatedEntityType,
      relatedEntityId,
      isRead: false
    });

    console.log(`[Notification Created] To User: ${userId} | Title: ${title}`);

    // 2. Fetch user to check if email sending is viable
    const user = await User.findById(userId);
    if (!user) return notification;

    // Check if SMTP is configured
    const transporter = getTransporter();
    if (transporter && user.email) {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"EcoSphere ESG" <noreply@ecosphere.com>',
        to: user.email,
        subject: `EcoSphere Alert: ${title}`,
        text: message,
        html: `<div style="font-family: sans-serif; padding: 20px; color: #111827;">
          <h2 style="color: #059669;">EcoSphere ESG Management Platform</h2>
          <h3>${title}</h3>
          <p>${message}</p>
          <br />
          <hr style="border: 0; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 12px; color: #6b7280;">This is an automated message, please do not reply directly.</p>
        </div>`
      };

      // Run async, do not block main execution thread, and handle error safely
      transporter.sendMail(mailOptions).catch(err => {
        console.error(`[Email Error] Failed to send email notification: ${err.message}`);
      });
    }

    return notification;
  } catch (error) {
    console.error(`[Notification Error] Failed to create notification: ${error.message}`);
  }
};

module.exports = {
  createNotification
};
