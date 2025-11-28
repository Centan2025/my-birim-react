import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'

const app = express()
app.use(cors())
app.use(express.json())

const SMTP_PASSWORD = process.env.SMTP_PASSWORD

const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: 'birim@birim.com',
    pass: SMTP_PASSWORD,
  },
})

app.post('/api/send-verification', async (req, res) => {
  const {email, verificationUrl, logoUrl} = req.body || {}

  if (!SMTP_PASSWORD) {
    return res.status(500).json({error: 'SMTP_PASSWORD environment variable is not set'})
  }

  if (!email || !verificationUrl) {
    return res.status(400).json({error: 'email and verificationUrl are required'})
  }

  // Logo URL'ini kontrol et ve logla
  // eslint-disable-next-line no-console
  console.log('[Email Server] Logo URL received:', logoUrl)

  try {
    await transporter.sendMail({
      from: '"Birim Design" <birim@birim.com>',
      to: email,
      subject: 'Birim Üyelik Doğrulaması',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9fafb;">
          <div
            style="
              max-width: 600px;
              margin: 0 auto;
              padding: 32px 24px;
              background-color: #f9fafb;
              font-family: 'Arial Narrow', Arial, 'Helvetica Neue', Helvetica, sans-serif;
              color: #1a1f3a;
              font-size: 15px;
              line-height: 1.65;
              font-weight: 400;
            "
          >
            <div style="background-color:#ffffff; padding: 32px 28px 24px 28px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #1a1f3a;">
                Birim Üyelik
              </p>
              <p style="margin: 0 0 14px 0; color: #1a1f3a;">
                Merhaba,
              </p>
              <p style="margin: 0 0 14px 0; color: #1a1f3a;">
                Birim web sitesi için yeni bir üyelik talebi aldık. Üyeliğinizi tamamlamak için aşağıdaki butona tıklayın.
              </p>
              <p style="margin: 28px 0; text-align: left;">
                <a
                  href="${verificationUrl}"
                  style="
                    display: inline-block;
                    background: #1a1f3a;
                    color: #ffffff;
                    padding: 12px 24px;
                    text-decoration: none;
                    font-size: 13px;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    font-weight: 600;
                  "
                >
                  Üyeliğimi Doğrula
                </a>
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #4b5563;">
                Eğer buton çalışmazsa, aşağıdaki bağlantıyı kopyalayıp tarayıcınızın adres çubuğuna yapıştırabilirsiniz:
              </p>
              <p style="margin: 0; font-size: 12px; word-break: break-all;">
                <a href="${verificationUrl}" style="color:#1a1f3a; text-decoration: underline;">${verificationUrl}</a>
              </p>
            </div>
            ${
              logoUrl
                ? `
            <div style="text-align: center; margin-top: 24px;">
              <img
                src="${logoUrl}"
                alt="Birim Logo"
                style="height: 40px; width: auto; max-width: 200px; display: block; margin: 0 auto;"
              />
            </div>
            `
                : ''
            }
          </div>
        </body>
        </html>
      `,
    })

    // eslint-disable-next-line no-console
    console.log('✅ Verification email sent to', email)
    res.json({ok: true})
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Mail gönderim hatası:', err)
    res.status(500).json({error: 'Failed to send email'})
  }
})

const port = process.env.PORT || 3001
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`📧 Email API http://localhost:${port} üzerinde çalışıyor`)
})
