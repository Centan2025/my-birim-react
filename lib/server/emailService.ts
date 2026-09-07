import {Resend} from 'resend'
import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  name?: string
  verificationUrl?: string
  resetUrl?: string
  lang?: 'tr' | 'en'
}

function getEmailFrom(): string {
  return process.env['EMAIL_FROM'] || 'Birim Design <birim@birim.com>'
}

function getReplyTo(): string {
  return process.env['EMAIL_REPLY_TO'] || 'birim@birim.com'
}

function generateVerificationHtml(
  name: string | undefined,
  verificationUrl: string,
  lang: 'tr' | 'en' = 'tr'
): string {
  const isEn = lang === 'en'
  const greeting = name ? (isEn ? `Dear ${name},` : `Sayın ${name},`) : isEn ? 'Hello,' : 'Merhaba,'
  const title = isEn ? 'MEMBER VERIFICATION' : 'ÜYELİK DOĞRULAMASI'
  const subtitle = isEn
    ? 'Thank you for applying to Birim Exclusive Architect & Professional Network.'
    : 'Birim Özel Mimar & Profesyonel Ağı’na yaptığınız başvuru için teşekkür ederiz.'
  const bodyText = isEn
    ? 'Please click the button below to verify your email address, activate your account, and access high-resolution 3D models and CAD/DWG technical files:'
    : 'Hesabınızı aktifleştirmek, e-posta adresinizi doğrulamak ve yüksek çözünürlüklü 3D model ile CAD/DWG teknik çizim dosyalarına erişebilmek için lütfen aşağıdaki butona tıklayın:'
  const buttonText = isEn ? 'Verify My Account' : 'Üyeliğimi Doğrula'
  const fallbackNotice = isEn
    ? 'If the button above does not work, please copy and paste the following link into your browser:'
    : 'Yukarıdaki buton çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza kopyalayıp yapıştırabilirsiniz:'
  const ignoreNotice = isEn
    ? 'If you did not request this verification, you can safely ignore this email.'
    : 'Bu başvuruyu siz gerçekleştirmediyseniz, lütfen bu e-postayı dikkate almayınız.'

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <!-- HEADER -->
          <tr>
            <td style="padding: 36px 40px 24px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <a href="https://www.birim.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://www.birim.com/img/logo-1.png" alt="B I R I M" width="150" style="display: block; margin: 0 auto; max-width: 160px; height: auto; border: 0;" />
              </a>
              <div style="font-size: 11px; letter-spacing: 2px; color: #64748b; margin-top: 10px; text-transform: uppercase;">
                Contemporary Architecture &amp; Design
              </div>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; letter-spacing: 1px; color: #0f172a; text-transform: uppercase;">
                ${title}
              </h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #334155;">
                ${greeting}
              </p>
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #475569;">
                ${subtitle}
              </p>
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 22px; color: #475569;">
                ${bodyText}
              </p>

              <!-- CTA BUTTON -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; padding: 14px 34px; border-radius: 6px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- FALLBACK LINK -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin: 24px 0 20px;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">
                  ${fallbackNotice}
                </p>
                <a href="${verificationUrl}" target="_blank" style="font-size: 12px; color: #2563eb; word-break: break-all; text-decoration: underline;">
                  ${verificationUrl}
                </a>
              </div>

              <p style="margin: 20px 0 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                ${ignoreNotice}
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #475569;">
                Birim Mobilya Tasarım San. ve Tic. A.Ş.
              </p>
              <p style="margin: 0 0 10px; font-size: 11px; color: #94a3b8;">
                <a href="https://www.birim.com" target="_blank" style="color: #64748b; text-decoration: none;">www.birim.com</a>
                &nbsp;•&nbsp;
                <a href="mailto:birim@birim.com" style="color: #64748b; text-decoration: none;">birim@birim.com</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                © ${new Date().getFullYear()} Birim. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

function generatePasswordResetHtml(
  name: string | undefined,
  resetUrl: string,
  lang: 'tr' | 'en' = 'tr'
): string {
  const isEn = lang === 'en'
  const greeting = name ? (isEn ? `Dear ${name},` : `Sayın ${name},`) : isEn ? 'Hello,' : 'Merhaba,'
  const title = isEn ? 'PASSWORD RESET' : 'ŞİFRE SIFIRLAMA TALEBİ'
  const bodyText = isEn
    ? 'We received a request to reset your Birim account password. You can set a new password by clicking the button below:'
    : 'Birim hesabınız için bir şifre sıfırlama talebinde bulunuldu. Yeni şifrenizi belirlemek için lütfen aşağıdaki butona tıklayın:'
  const buttonText = isEn ? 'Reset My Password' : 'Şifremi Sıfırla'
  const fallbackNotice = isEn
    ? 'If the button above does not work, copy and paste this link:'
    : 'Buton çalışmıyorsa şu bağlantıyı tarayıcınıza yapıştırın:'
  const ignoreNotice = isEn
    ? 'If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.'
    : 'Bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayınız. Mevcut şifreniz değişmeyecektir.'

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 36px 40px 24px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <a href="https://www.birim.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://www.birim.com/img/logo-1.png" alt="B I R I M" width="150" style="display: block; margin: 0 auto; max-width: 160px; height: auto; border: 0;" />
              </a>
              <div style="font-size: 11px; letter-spacing: 2px; color: #64748b; margin-top: 10px; text-transform: uppercase;">
                Contemporary Architecture &amp; Design
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; letter-spacing: 1px; color: #0f172a; text-transform: uppercase;">
                ${title}
              </h2>
              <p style="margin: 0 0 16px; font-size: 15px; color: #334155;">${greeting}</p>
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 22px; color: #475569;">${bodyText}</p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; padding: 14px 34px; border-radius: 6px;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin: 24px 0 20px;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">${fallbackNotice}</p>
                <a href="${resetUrl}" target="_blank" style="font-size: 12px; color: #2563eb; word-break: break-all; text-decoration: underline;">${resetUrl}</a>
              </div>
              <p style="margin: 20px 0 0; font-size: 12px; line-height: 18px; color: #94a3b8;">${ignoreNotice}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #475569;">Birim Mobilya Tasarım San. ve Tic. A.Ş.</p>
              <p style="margin: 0 0 10px; font-size: 11px; color: #94a3b8;">
                <a href="https://www.birim.com" target="_blank" style="color: #64748b; text-decoration: none;">www.birim.com</a>
                &nbsp;•&nbsp;
                <a href="mailto:birim@birim.com" style="color: #64748b; text-decoration: none;">birim@birim.com</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">© ${new Date().getFullYear()} Birim. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<{
  success: boolean
  provider: 'resend' | 'smtp' | 'simulation'
  id?: string
  error?: string
}> {
  const resendApiKey = process.env['RESEND_API_KEY']
  const fromAddress = getEmailFrom()
  const replyTo = getReplyTo()

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey)
      const {data, error} = await resend.emails.send({
        from: fromAddress,
        to: [to],
        replyTo,
        subject,
        html,
      })

      if (error) {
        console.warn('[EmailService] Resend API error:', error)
        throw new Error(error.message)
      }

      console.log(`✅ [EmailService] Resend ile e-posta gönderildi (${to}), id: ${data?.id}`)
      return {success: true, provider: 'resend', id: data?.id}
    } catch (err: unknown) {
      console.warn(
        '[EmailService] Resend failed, checking SMTP fallback:',
        err instanceof Error ? err.message : err
      )
    }
  }

  const smtpPassword = process.env['SMTP_PASSWORD']
  if (smtpPassword) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465,
        secure: true,
        auth: {
          user: 'birimdesign@birim.com',
          pass: smtpPassword,
        },
      })

      const info = await transporter.sendMail({
        from: '"Birim Design" <birimdesign@birim.com>',
        to,
        replyTo,
        subject,
        html,
      })

      console.log(`✅ [EmailService] SMTP ile e-posta gönderildi (${to}), id: ${info.messageId}`)
      return {success: true, provider: 'smtp', id: info.messageId}
    } catch (smtpErr: unknown) {
      console.warn(
        '[EmailService] SMTP fallback failed:',
        smtpErr instanceof Error ? smtpErr.message : smtpErr
      )
    }
  }

  console.log(`\n========================================`)
  console.log(`📧 [EmailService] SİMÜLASYON MODU (Aktif API Anahtarı Yok)`)
  console.log(`   Kime: ${to}`)
  console.log(`   Konu: ${subject}`)
  console.log(`========================================\n`)

  return {success: false, provider: 'simulation', error: 'No active email provider configured'}
}

export async function sendVerificationEmail(options: EmailOptions) {
  const {to, name, verificationUrl, lang = 'tr'} = options
  if (!verificationUrl) return {success: false, error: 'verificationUrl missing'}

  console.log(`\n========================================`)
  console.log(`📧 [BİRİM DOĞRULAMA BAĞLANTISI]`)
  console.log(`   Kime: ${to}`)
  console.log(`   Link: ${verificationUrl}`)
  console.log(`========================================\n`)

  const subject = lang === 'en' ? 'Birim Account Verification' : 'Birim Üyelik Doğrulaması'
  const html = generateVerificationHtml(name, verificationUrl, lang)

  return sendEmail({to, subject, html})
}

export async function sendPasswordResetEmail(options: EmailOptions) {
  const {to, name, resetUrl, lang = 'tr'} = options
  if (!resetUrl) return {success: false, error: 'resetUrl missing'}

  console.log(`\n========================================`)
  console.log(`🔑 [BİRİM ŞİFRE SIFIRLAMA BAĞLANTISI]`)
  console.log(`   Kime: ${to}`)
  console.log(`   Link: ${resetUrl}`)
  console.log(`========================================\n`)

  const subject = lang === 'en' ? 'Birim Password Reset Request' : 'Birim Şifre Sıfırlama Talebi'
  const html = generatePasswordResetHtml(name, resetUrl, lang)

  return sendEmail({to, subject, html})
}
