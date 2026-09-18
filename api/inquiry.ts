import type {VercelRequest, VercelResponse} from '@vercel/node'
import {handleCors} from '../lib/server/cors.js'
import {getSafeSupabaseAdmin} from '../lib/server/supabaseAdmin.js'
import {isRateLimitedAsync, getClientIp} from '../lib/server/rateLimiter.js'
import {Resend} from 'resend'
import nodemailer from 'nodemailer'

function escapeHtml(str?: unknown): string {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (
    handleCors(req, res, {
      allowMethods: 'POST, OPTIONS',
      allowHeaders: 'Content-Type',
      allowCredentials: true,
    })
  ) {
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const clientIp = getClientIp(req)
  if (await isRateLimitedAsync(`inquiry_req_${clientIp}`, {limit: 5, windowMs: 60000})) {
    return res.status(429).json({
      error: 'Çok fazla teklif talebi gönderildi. Lütfen 1 dakika sonra tekrar deneyin.',
    })
  }

  // Honeypot spam trap
  if (req.body?.website_hp) {
    return res.status(200).json({ok: true, message: 'Inquiry received'})
  }

  const {
    name,
    company,
    email,
    phone,
    projectName,
    message,
    selectedProducts = [],
    userId,
  } = req.body || {}

  if (!name || !email) {
    return res.status(400).json({error: 'Ad ve e-posta zorunludur.'})
  }

  const safeEmail = String(email).trim().toLowerCase().slice(0, 150)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(safeEmail)) {
    return res.status(400).json({error: 'Geçerli bir e-posta adresi giriniz.'})
  }

  const safeName = escapeHtml(String(name).trim().slice(0, 100))
  const safeCompany = company ? escapeHtml(String(company).trim().slice(0, 150)) : null
  const safePhone = phone ? escapeHtml(String(phone).trim().slice(0, 50)) : null
  const safeProjectName = projectName ? escapeHtml(String(projectName).trim().slice(0, 150)) : null
  const safeMessage = message ? escapeHtml(String(message).trim().slice(0, 3000)) : null

  // 1. Save to Supabase inquiries table
  try {
    const supabaseAdmin = getSafeSupabaseAdmin()
    if (supabaseAdmin) {
      await supabaseAdmin.from('inquiries').insert({
        user_id: userId || null,
        name: safeName,
        company: safeCompany,
        email: safeEmail,
        phone: safePhone,
        project_name: safeProjectName,
        message: safeMessage,
        selected_products: Array.isArray(selectedProducts) ? selectedProducts : [],
        status: 'new',
      })
    }
  } catch (dbErr) {
    console.warn('[Inquiry API] Supabase persistence error:', dbErr)
  }

  // 2. Format products list for Email
  const productsListHtml =
    Array.isArray(selectedProducts) && selectedProducts.length > 0
      ? selectedProducts
          .map(
            (
              p: {
                id?: string
                name?: string
                category?: string
                dimensions?: string
                image?: string
              },
              idx: number
            ) => {
              const pName = escapeHtml(p.name || p.id || 'Ürün')
              const pCategory = p.category ? escapeHtml(String(p.category)) : ''
              const pDim =
                p.dimensions && p.dimensions !== '-' ? escapeHtml(String(p.dimensions)) : ''
              const safeUrlId = encodeURIComponent(String(p.id || '').trim())
              const rawImg = (p.image || '').trim()
              const safeImgUrl =
                rawImg && rawImg !== '/' && !rawImg.endsWith('birim.com/')
                  ? rawImg.startsWith('http://') || rawImg.startsWith('https://')
                    ? rawImg
                    : `https://birim.com${rawImg.startsWith('/') ? '' : '/'}${rawImg}`
                  : ''

              const imgHtml = safeImgUrl
                ? `<img src="${escapeHtml(safeImgUrl)}" alt="${pName}" width="56" height="56" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: block;" />`
                : `<div style="width: 56px; height: 56px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; line-height: 56px; font-size: 20px; color: #94a3b8;">🛋️</div>`

              const isLast = idx === selectedProducts.length - 1
              const borderStyle = isLast ? '' : 'border-bottom: 1px solid #f1f5f9;'

              return `
            <tr style="${borderStyle}">
              <td style="padding: 12px 12px 12px 14px; width: 56px; vertical-align: middle;">
                ${imgHtml}
              </td>
              <td style="padding: 12px 12px; vertical-align: middle;">
                <a href="https://birim.com/product/${safeUrlId}" style="color: #09090b; font-weight: 600; font-size: 14px; text-decoration: none; display: block; line-height: 1.4;">
                  ${pName}
                </a>
                ${
                  pCategory
                    ? `<span style="display: inline-block; font-size: 11px; color: #71717a; margin-top: 3px;">${pCategory}</span>`
                    : ''
                }
                ${
                  pDim
                    ? `<div style="font-size: 11px; color: #64748b; margin-top: 3px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">Ölçü: ${pDim}</div>`
                    : ''
                }
              </td>
              <td style="padding: 12px 14px 12px 8px; text-align: right; vertical-align: middle; white-space: nowrap;">
                <a href="https://birim.com/product/${safeUrlId}" style="font-size: 11px; font-weight: 600; color: #09090b; text-decoration: none; background-color: #f4f4f5; padding: 6px 12px; border-radius: 6px; display: inline-block; border: 1px solid #e4e4e7;">
                  İncele &rarr;
                </a>
              </td>
            </tr>
          `
            }
          )
          .join('')
      : `<tr><td colspan="3" style="padding: 24px; text-align: center; color: #a1a1aa; font-style: italic; font-size: 13px;">Ürün seçilmedi</td></tr>`

  const dateStr = new Date().toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const emailHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Birim Teklif Talebi</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #18181b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #18181b; padding: 24px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 700; letter-spacing: 5px; color: #ffffff; text-transform: uppercase;">B İ R İ M</div>
                    <div style="font-size: 10px; letter-spacing: 1.5px; color: #a1a1aa; text-transform: uppercase; margin-top: 4px;">MİMARİ &amp; MOBİLYA ÇÖZÜMLERİ</div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.12); color: #f4f4f5; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.18);">
                      Teklif Talebi
                    </span>
                    <div style="font-size: 10px; color: #71717a; margin-top: 4px;">${dateStr}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 32px;">
              
              <!-- Customer & Project Info Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 10px; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700;" colspan="2">
                          Müşteri ve Proje Bilgileri
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #71717a; width: 110px;">Proje:</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #09090b;">
                          <span style="background-color: #f4f4f5; padding: 2px 8px; border-radius: 4px; border: 1px solid #e4e4e7;">${safeProjectName || 'Genel Seçtiklerim'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Müşteri:</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #09090b;">${safeName}</td>
                      </tr>
                      ${
                        safeCompany
                          ? `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Firma / Ofis:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #18181b;">${safeCompany}</td>
                      </tr>`
                          : ''
                      }
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #71717a;">E-posta:</td>
                        <td style="padding: 6px 0; font-size: 13px;">
                          <a href="mailto:${safeEmail}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${safeEmail}</a>
                        </td>
                      </tr>
                      ${
                        safePhone
                          ? `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Telefon:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #18181b;">
                          <a href="tel:${safePhone}" style="color: #18181b; text-decoration: none;">${safePhone}</a>
                        </td>
                      </tr>`
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Customer Note (Optional) -->
              ${
                safeMessage
                  ? `
              <div style="margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #71717a; margin-bottom: 8px;">
                  Müşteri Notu
                </div>
                <div style="background-color: #fafafa; border-left: 3px solid #18181b; border-radius: 4px; padding: 14px 18px; font-size: 13px; color: #334155; line-height: 1.6; border: 1px solid #f1f5f9; border-left: 3px solid #18181b;">
                  ${safeMessage}
                </div>
              </div>`
                  : ''
              }

              <!-- Selected Products Section -->
              <div style="margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #71717a; margin-bottom: 12px;">
                  Seçilen Ürünler (${Array.isArray(selectedProducts) ? selectedProducts.length : 0} Adet)
                </div>

                <!-- Products Table -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: separate; overflow: hidden; background-color: #ffffff;">
                  <tbody>
                    ${productsListHtml}
                  </tbody>
                </table>
              </div>

              <!-- Action CTA -->
              <div style="text-align: center; margin: 28px 0 8px 0;">
                <a href="mailto:${safeEmail}?subject=${encodeURIComponent(`Re: Birim Teklif Talebi - ${safeProjectName || 'Seçkim'}`)}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px; letter-spacing: 0.3px;">
                  Müşteriye E-posta ile Yanıt Ver &rarr;
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #f3f4f6; padding: 18px 32px; text-align: center; font-size: 11px; color: #9ca3af; line-height: 1.5;">
              Bu e-posta <a href="https://birim.com" style="color: #6b7280; text-decoration: none; font-weight: 600;">birim.com</a> Seçkim &amp; Proje sistemi üzerinden otomatik olarak gönderilmiştir.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  // 3. Send Email Notification
  try {
    const resendKey = process.env['RESEND_API_KEY']
    const smtpPassword = process.env['SMTP_PASSWORD']
    const adminEmail = process.env['ADMIN_EMAIL'] || 'birim@birim.com'
    const fromAddress = process.env['EMAIL_FROM'] || 'Birim Design <birim@birim.com>'
    const smtpUser = process.env['SMTP_USER'] || process.env['EMAIL_USER'] || 'birim@birim.com'
    const emailSubject = `Yeni Proje Talebi: ${safeName} - ${safeProjectName || 'Birim Seçtiklerim'}`

    let emailSent = false

    if (resendKey) {
      try {
        const resend = new Resend(resendKey)
        const {error: resendErr} = await resend.emails.send({
          from: fromAddress,
          to: [adminEmail],
          replyTo: safeEmail,
          subject: emailSubject,
          html: emailHtml,
        })
        if (resendErr) {
          console.warn('[Inquiry API] Resend sending error:', resendErr)
        } else {
          emailSent = true
          console.log(`✅ [Inquiry API] Resend ile teklif bildirimi gönderildi -> ${adminEmail}`)
        }
      } catch (rErr) {
        console.warn('[Inquiry API] Resend call failed, attempting SMTP fallback:', rErr)
      }
    }

    if (!emailSent && smtpPassword) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env['SMTP_HOST'] || 'smtpout.secureserver.net',
          port: Number(process.env['SMTP_PORT']) || 465,
          secure: true,
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        })

        await transporter.sendMail({
          from: fromAddress,
          to: adminEmail,
          replyTo: safeEmail,
          subject: emailSubject,
          html: emailHtml,
        })
        emailSent = true
        console.log(`✅ [Inquiry API] SMTP ile teklif bildirimi gönderildi -> ${adminEmail}`)
      } catch (smtpErr) {
        console.warn('[Inquiry API] SMTP sending error:', smtpErr)
      }
    }
  } catch (mailErr) {
    console.warn('[Inquiry API] Email sending notice:', mailErr)
  }

  return res.status(200).json({ok: true, message: 'Inquiry received'})
}
