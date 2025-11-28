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
    user: 'studio@birim.com',
    pass: SMTP_PASSWORD,
  },
})

app.post('/api/send-verification', async (req, res) => {
  const {email, verificationUrl} = req.body || {}

  if (!SMTP_PASSWORD) {
    return res.status(500).json({error: 'SMTP_PASSWORD environment variable is not set'})
  }

  if (!email || !verificationUrl) {
    return res.status(400).json({error: 'email and verificationUrl are required'})
  }

  try {
    await transporter.sendMail({
      from: '"Birim Studio" <studio@birim.com>',
      to: email,
      subject: 'Birim Üyelik Doğrulaması',
      html: `
        <p>Merhaba,</p>
        <p>Birim web sitesi için yeni bir üyelik oluşturuldu.</p>
        <p>Üyeliğinizi tamamlamak için aşağıdaki butona tıklayın:</p>
        <p style="margin: 24px 0;">
          <a href="${verificationUrl}" style="background:#111;color:#fff;padding:10px 20px;text-decoration:none;">
            Üyeliğimi Doğrula
          </a>
        </p>
        <p>Buton çalışmazsa aşağıdaki linki tarayıcınıza kopyalayabilirsiniz:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
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


