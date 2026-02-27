import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Email Transporter with Connection Pooling
const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true, // Enable connection pooling for faster delivery
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('[EMAIL SETUP ERROR]', error);
  } else {
    console.log('[EMAIL] Server is ready to take our messages');
  }
});

// API Routes
app.post('/api/send-verification', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  try {
    const mailOptions = {
      from: `"Festus AI Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Festus AI Verification Code',
      text: `Your verification code is: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center;">Festus AI Security</h2>
            <p style="color: #666; text-align: center;">Use the following code to verify your identity:</p>
            <div style="background-color: #e0e7ff; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; border-radius: 5px; margin: 20px 0;">
              ${code}
            </div>
            <p style="color: #999; font-size: 12px; text-align: center;">If you did not request this code, please ignore this email.</p>
            <p style="color: #999; font-size: 10px; text-align: center; margin-top: 20px;">Code expires in 10 minutes.</p>
          </div>
        </div>
      `,
    };

    // Await sendMail to ensure delivery before responding
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Verification code sent to ${email} | ID: ${info.messageId}`);
    res.json({ success: true, message: 'Verification code sent successfully' });
  } catch (error: any) {
    console.error('[EMAIL ERROR]', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (if built)
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
