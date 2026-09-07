import {definePlugin} from 'sanity'
import {SupabaseUsersStudioView} from '../components/SupabaseUsersStudioView'

export const supabaseUsersTool = definePlugin({
  name: 'supabase-users',
  tools: [
    {
      name: 'supabase-users',
      title: 'Üye & Mimar Yönetimi',
      component: SupabaseUsersStudioView,
    },
  ],
})
