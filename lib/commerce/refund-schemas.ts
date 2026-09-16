import {z} from 'zod'

export const cancelOrderRequestSchema = z
  .object({
    orderId: z.string().uuid('Geçersiz sipariş ID formatı.'),
    reason: z.string().max(500, 'İptal sebebi en fazla 500 karakter olabilir.').optional(),
  })
  .strict()

export const createRefundRequestSchema = z
  .object({
    orderId: z.string().uuid('Geçersiz sipariş ID formatı.'),
    amount: z.number().positive('İade tutarı sıfırdan büyük olmalıdır.'),
    reason: z
      .string()
      .min(1, 'İade gerekçesi zorunludur.')
      .max(500, 'İade gerekçesi en fazla 500 karakter olabilir.'),
    idempotencyKey: z.string().max(255).optional().nullable(),
  })
  .strict()
