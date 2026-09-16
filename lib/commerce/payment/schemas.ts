import {z} from 'zod'

export const initiatePaymentRequestSchema = z
  .object({
    orderId: z
      .string({required_error: 'orderId zorunludur.'})
      .trim()
      .min(1, 'orderId boş olamaz.')
      .max(100, 'orderId çok uzun.'),
    guestToken: z.string().trim().max(256, 'guestToken çok uzun.').nullable().optional(),
    idempotencyKey: z
      .string()
      .trim()
      .min(1, 'idempotencyKey boş olamaz.')
      .max(128, 'idempotencyKey çok uzun.')
      .nullable()
      .optional(),
  })
  .strict({
    message:
      'Ödeme başlatma isteğinde yetkisiz alanlar (amount, price, currency, userId, paymentStatus, provider vb.) gönderilemez.',
  })
