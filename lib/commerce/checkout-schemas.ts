import {z} from 'zod'

export const customerInfoSchema = z
  .object({
    firstName: z
      .string({required_error: 'Ad alanı zorunludur.'})
      .trim()
      .min(1, 'Ad boş olamaz.')
      .max(100, 'Ad en fazla 100 karakter olabilir.'),
    lastName: z
      .string({required_error: 'Soyad alanı zorunludur.'})
      .trim()
      .min(1, 'Soyad boş olamaz.')
      .max(100, 'Soyad en fazla 100 karakter olabilir.'),
    email: z
      .string({required_error: 'E-posta alanı zorunludur.'})
      .trim()
      .email('Geçerli bir e-posta adresi giriniz.')
      .max(254, 'E-posta adresi çok uzun.')
      .toLowerCase(),
    phone: z
      .string({required_error: 'Telefon alanı zorunludur.'})
      .trim()
      .min(5, 'Geçerli bir telefon numarası giriniz.')
      .max(30, 'Telefon numarası çok uzun.'),
  })
  .strict({
    message: 'Müşteri bilgilerinde yetkisiz alanlar bulunamaz.',
  })

export const addressSchema = z
  .object({
    firstName: z
      .string({required_error: 'Alıcı adı zorunludur.'})
      .trim()
      .min(1, 'Alıcı adı boş olamaz.')
      .max(100, 'Alıcı adı en fazla 100 karakter olabilir.'),
    lastName: z
      .string({required_error: 'Alıcı soyadı zorunludur.'})
      .trim()
      .min(1, 'Alıcı soyadı boş olamaz.')
      .max(100, 'Alıcı soyadı en fazla 100 karakter olabilir.'),
    addressLine1: z
      .string({required_error: 'Adres satırı zorunludur.'})
      .trim()
      .min(3, 'Adres en az 3 karakter olmalıdır.')
      .max(200, 'Adres en fazla 200 karakter olabilir.'),
    addressLine2: z
      .string()
      .trim()
      .max(200, 'Adres satırı 2 en fazla 200 karakter olabilir.')
      .nullable()
      .optional(),
    city: z
      .string({required_error: 'İl alanı zorunludur.'})
      .trim()
      .min(1, 'İl boş olamaz.')
      .max(100, 'İl en fazla 100 karakter olabilir.'),
    district: z
      .string({required_error: 'İlçe alanı zorunludur.'})
      .trim()
      .min(1, 'İlçe boş olamaz.')
      .max(100, 'İlçe en fazla 100 karakter olabilir.'),
    postalCode: z
      .string({required_error: 'Posta kodu zorunludur.'})
      .trim()
      .min(1, 'Posta kodu boş olamaz.')
      .max(20, 'Posta kodu en fazla 20 karakter olabilir.'),
    country: z
      .string({required_error: 'Ülke alanı zorunludur.'})
      .trim()
      .min(2, 'Ülke bilgisi en az 2 karakter olmalıdır.')
      .max(100, 'Ülke bilgisi en fazla 100 karakter olabilir.'),
    phone: z
      .string()
      .trim()
      .min(5, 'Geçerli bir telefon numarası giriniz.')
      .max(30, 'Telefon numarası çok uzun.')
      .nullable()
      .optional(),
  })
  .strict({
    message: 'Adres bilgisinde yetkisiz alanlar bulunamaz.',
  })

export const corporateBillingSchema = z
  .object({
    companyName: z
      .string({required_error: 'Şirket unvanı zorunludur.'})
      .trim()
      .min(2, 'Şirket unvanı en az 2 karakter olmalıdır.')
      .max(150, 'Şirket unvanı en fazla 150 karakter olabilir.'),
    taxOffice: z
      .string({required_error: 'Vergi dairesi zorunludur.'})
      .trim()
      .min(2, 'Vergi dairesi en az 2 karakter olmalıdır.')
      .max(100, 'Vergi dairesi en fazla 100 karakter olabilir.'),
    taxNumber: z
      .string({required_error: 'Vergi numarası zorunludur.'})
      .trim()
      .min(8, 'Vergi numarası en az 8 karakter olmalıdır.')
      .max(30, 'Vergi numarası en fazla 30 karakter olabilir.'),
  })
  .strict({
    message: 'Kurumsal fatura bilgilerinde yetkisiz alanlar bulunamaz.',
  })

export const checkoutPayloadSchema = z
  .object({
    customerType: z.enum(['INDIVIDUAL', 'CORPORATE'], {
      required_error: 'Müşteri tipi (INDIVIDUAL veya CORPORATE) zorunludur.',
    }),
    customer: customerInfoSchema,
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    billingSameAsShipping: z.boolean({
      required_error: 'billingSameAsShipping alanı zorunludur.',
    }),
    corporateBilling: corporateBillingSchema.nullable().optional(),
  })
  .strict({
    message: 'Checkout verisinde yetkisiz alanlar bulunamaz.',
  })
  .superRefine((data, ctx) => {
    if (data.customerType === 'CORPORATE') {
      if (!data.corporateBilling) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Kurumsal fatura seçildiğinde kurumsal fatura bilgileri (unvan, vergi dairesi, vergi no) zorunludur.',
          path: ['corporateBilling'],
        })
      }
    }
  })

export const cartItemInputSchema = z
  .object({
    productId: z
      .string({required_error: 'productId zorunludur.'})
      .trim()
      .min(1, 'productId boş olamaz.')
      .max(100, 'productId çok uzun.'),
    variantId: z.string().trim().min(1).max(100).nullable().optional(),
    quantity: z
      .number({required_error: 'quantity zorunludur.'})
      .int('quantity bir tam sayı olmalıdır.')
      .min(1, 'quantity en az 1 olmalıdır.')
      .max(100, 'quantity en fazla 100 olabilir.'),
  })
  .strict({
    message: 'Sepet kaleminde fiyat veya toplam gibi yetkisiz alanlar gönderilemez.',
  })

export const checkoutValidateRequestSchema = z
  .object({
    items: z
      .array(cartItemInputSchema, {required_error: 'items dizisi zorunludur.'})
      .min(1, 'Sepette en az 1 ürün bulunmalıdır.')
      .max(50, 'Sepette en fazla 50 farklı ürün bulunabilir.'),
    checkout: checkoutPayloadSchema,
  })
  .strict({
    message: 'Checkout isteğinde yetkisiz üst düzey alanlar gönderilemez.',
  })
