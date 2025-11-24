import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'user',
  title: 'Üye',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'E-posta',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'password',
      title: 'Şifre (Hash)',
      type: 'string',
      description: 'Şifre hash olarak saklanmalıdır. E-posta aboneleri için boş bırakılabilir.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const userType = (context.document as any)?.userType
          // Eğer tam üye ise password zorunlu
          if (userType === 'full_member' && !value) {
            return 'Tam üyeler için şifre gereklidir'
          }
          return true
        }),
      hidden: ({document}) => document?.userType === 'email_subscriber',
    }),
    defineField({
      name: 'name',
      title: 'Ad Soyad',
      type: 'string',
    }),
    defineField({
      name: 'company',
      title: 'Firma',
      type: 'string',
      description: 'Üyenin çalıştığı firma adı',
    }),
    defineField({
      name: 'profession',
      title: 'Meslek',
      type: 'string',
      description: 'Üyenin mesleği',
    }),
    defineField({
      name: 'userType',
      title: 'Üye Tipi',
      type: 'string',
      options: {
        list: [
          {title: 'E-posta Abonesi', value: 'email_subscriber'},
          {title: 'Tam Üye (Özel İçerik)', value: 'full_member'},
        ],
        layout: 'radio',
      },
      initialValue: 'email_subscriber',
      description: 'E-posta aboneleri sadece haberler alır, tam üyeler özel içeriklere erişebilir',
    }),
    defineField({
      name: 'isActive',
      title: 'Aktif',
      type: 'boolean',
      initialValue: true,
      description: 'Üyenin sisteme giriş yapabilmesi için aktif olmalı',
    }),
    defineField({
      name: 'createdAt',
      title: 'Kayıt Tarihi',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: 'email',
      subtitle: 'name',
      userType: 'userType',
      active: 'isActive',
    },
    prepare({title, subtitle, userType, active}) {
      const typeLabel = userType === 'full_member' ? 'Tam Üye' : 'E-posta Abonesi'
      return {
        title: title || 'Üye',
        subtitle: subtitle
          ? `${subtitle} - ${typeLabel} - ${active ? 'Aktif' : 'Pasif'}`
          : `${typeLabel} - ${active ? 'Aktif' : 'Pasif'}`,
      }
    },
  },
})
