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
      ? `
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr style="border-bottom: 1px solid #ddd; text-align: left; font-size: 11px; text-transform: uppercase; color: #888;">
            <th style="padding: 8px 4px;">#</th>
            <th style="padding: 8px 4px;">Ürün</th>
            <th style="padding: 8px 4px;">Ölçüler</th>
          </tr>
        </thead>
        <tbody>
          ${selectedProducts
            .map((p: {id?: string; name?: string; dimensions?: string}, idx: number) => {
              const pName = escapeHtml(p.name || p.id)
              const pDim = escapeHtml(p.dimensions || '-')
              const safeUrlId = encodeURIComponent(String(p.id || '').trim())
              return `
            <tr style="border-bottom: 1px solid #eee; font-size: 13px;">
              <td style="padding: 8px 4px; color: #999;">${idx + 1}</td>
              <td style="padding: 8px 4px; font-weight: 600;">
                <a href="https://birim.com/product/${safeUrlId}" style="color: #111; text-decoration: none;">
                  ${pName}
                </a>
              </td>
              <td style="padding: 8px 4px; color: #666;">${pDim}</td>
            </tr>
          `
            })
            .join('')}
        </tbody>
      </table>
    `
      : '<p style="color: #888; font-style: italic;">Ürün seçilmedi</p>'

  const emailHtml = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111; line-height: 1.6; padding: 24px;">
      <div style="border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 24px;">
        <span style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #888;">BİRİM MOBİLYA</span>
        <h2 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 600; text-transform: uppercase;">YENİ PROJE / SEÇTİKLERİM TEKLİF TALEBİ</h2>
      </div>

      <div style="background-color: #f8f8f8; padding: 16px 20px; margin-bottom: 24px; border-left: 3px solid #111;">
        <p style="margin: 0 0 6px 0;"><strong>Müşteri:</strong> ${safeName}</p>
        <p style="margin: 0 0 6px 0;"><strong>Firma / Ofis:</strong> ${safeCompany || '-'}</p>
        <p style="margin: 0 0 6px 0;"><strong>E-posta:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <p style="margin: 0 0 6px 0;"><strong>Telefon:</strong> ${safePhone || '-'}</p>
        <p style="margin: 0;"><strong>Proje:</strong> ${safeProjectName || 'Genel Seçtiklerim'}</p>
      </div>

      ${
        safeMessage
          ? `
        <div style="margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Müşteri Notu:</h4>
          <p style="margin: 0; background: #fff; border: 1px solid #eee; padding: 12px; font-size: 13px;">${safeMessage}</p>
        </div>
      `
          : ''
      }

      <div style="margin-bottom: 24px;">
        <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Talep Edilen Ürünler:</h4>
        ${productsListHtml}
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 16px; font-size: 11px; color: #999; text-align: center;">
        Bu e-posta birim.com Seçtiklerim & Proje sisteminden otomatik olarak oluşturulmuştur.
      </div>
    </div>
  `

  // 3. Send Email Notification
  try {
    const resendKey = process.env['RESEND_API_KEY']
    const smtpPassword = process.env['SMTP_PASSWORD']
    const adminEmail = process.env['ADMIN_EMAIL'] || 'birim@birim.com'
    const smtpUser = process.env['SMTP_USER'] || process.env['EMAIL_USER'] || 'birim@birim.com'

    if (resendKey) {
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from: process.env['EMAIL_FROM'] || 'Birim Web <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `Yeni Proje Talebi: ${safeName} - ${safeProjectName || 'Birim Seçtiklerim'}`,
        html: emailHtml,
      })
    } else if (smtpPassword) {
      const transporter = nodemailer.createTransport({
        host: process.env['SMTP_HOST'] || 'smtpout.secureserver.net',
        port: Number(process.env['SMTP_PORT']) || 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      })

      await transporter.sendMail({
        from: `"Birim Design" <${smtpUser}>`,
        to: adminEmail,
        replyTo: safeEmail,
        subject: `Yeni Proje Talebi: ${safeName} - ${safeProjectName || 'Birim Seçki'}`,
        html: emailHtml,
      })
    }
  } catch (mailErr) {
    console.warn('[Inquiry API] Email sending notice:', mailErr)
  }

  return res.status(200).json({ok: true, message: 'Inquiry received'})
}
