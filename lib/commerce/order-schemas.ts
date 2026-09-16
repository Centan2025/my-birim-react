import {z} from 'zod'
import {cartItemInputSchema, checkoutPayloadSchema} from './checkout-schemas'

export const createOrderRequestSchema = z
  .object({
    items: z
      .array(cartItemInputSchema, {required_error: 'items dizisi zorunludur.'})
      .min(1, 'Sipariş için sepette en az 1 ürün bulunmalıdır.')
      .max(50, 'Sipariş için sepette en fazla 50 farklı ürün bulunabilir.'),
    checkout: checkoutPayloadSchema,
    expectedGrandTotal: z
      .number()
      .positive('expectedGrandTotal pozitif bir sayı olmalıdır.')
      .max(100000000, 'Geçersiz sipariş tutarı.')
      .nullable()
      .optional(),
    idempotencyKey: z
      .string()
      .trim()
      .min(1, 'Idempotency key boş olamaz.')
      .max(128, 'Idempotency key en fazla 128 karakter olabilir.')
      .nullable()
      .optional(),
    notes: z
      .string()
      .trim()
      .max(1000, 'Sipariş notu en fazla 1000 karakter olabilir.')
      .nullable()
      .optional(),
  })
  .strict({
    message:
      'Sipariş oluşturma isteğinde yetkisiz alanlar (price, currency, userId vb.) gönderilemez.',
  })
