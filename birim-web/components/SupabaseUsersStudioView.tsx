import React, {useState, useEffect, useMemo} from 'react'
import {createClient} from '@supabase/supabase-js'

export interface MemberProfile {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  name?: string | null
  role?: string | null
  company?: string | null
  country?: string | null
  profession?: string | null
  phone?: string | null
  tax_id?: string | null
  architect_verification_status?: string | null
  is_verified?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export interface UserFavorite {
  id: string
  user_id: string
  product_id: string
  product_name?: string | null
  product_slug?: string | null
  created_at?: string | null
}

export interface UserActivityRecord {
  id: string
  user_id: string
  user_email?: string | null
  session_id: string
  activity_type: 'session_start' | 'page_view' | 'page_dwell' | 'download' | 'session_end' | string
  page_url?: string | null
  page_title?: string | null
  duration_seconds: number
  download_file_name?: string | null
  download_file_type?: string | null
  platform?: string | null
  os?: string | null
  browser?: string | null
  referrer?: string | null
  ip_address?: string | null
  city?: string | null
  country?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

export interface AuthUserDetails {
  id: string
  email?: string
  created_at?: string
  last_sign_in_at?: string | null
  email_confirmed_at?: string | null
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

const SUPABASE_URL = 'https://rkmpfxervwqleibhbiqv.supabase.co'
// Sanity Studio yöneticileri için doğrudan yetkili istemci
const SUPABASE_ADMIN_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbXBmeGVydndxbGVpYmhiaXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODc5MzU4NCwiZXhwIjoyMTA0MzY5NTg0fQ.4Bglk8zupMO9ooUDL0u4-9TpRZg7kMDM0MxwqALlVa8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY, {
  auth: {persistSession: false},
})

export const SupabaseUsersStudioView: React.FC = () => {
  const [members, setMembers] = useState<MemberProfile[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Detail Drawer State
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null)
  const [activeDrawerTab, setActiveDrawerTab] = useState<'profile' | 'analytics'>('profile')
  const [detailLoading, setDetailLoading] = useState<boolean>(false)
  const [detailAuthUser, setDetailAuthUser] = useState<AuthUserDetails | null>(null)
  const [detailFavorites, setDetailFavorites] = useState<UserFavorite[]>([])
  const [detailActivities, setDetailActivities] = useState<UserActivityRecord[]>([])
  const [showSampleAnalytics, setShowSampleAnalytics] = useState<boolean>(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false)
  const [editFormData, setEditFormData] = useState<{
    name: string
    company: string
    country: string
    profession: string
    phone: string
    tax_id: string
    role: string
  }>({
    name: '',
    company: '',
    country: 'Türkiye',
    profession: '',
    phone: '',
    tax_id: '',
    role: 'architect',
  })

  const startEditProfile = () => {
    if (!selectedMember) return
    setEditFormData({
      name: selectedMember.name || '',
      company: selectedMember.company || '',
      country:
        selectedMember.country || (detailAuthUser?.user_metadata?.country as string) || 'Türkiye',
      profession: selectedMember.profession || '',
      phone: selectedMember.phone || '',
      tax_id: selectedMember.tax_id || '',
      role: selectedMember.role || 'architect',
    })
    setIsEditingProfile(true)
  }

  const handleSaveProfileEdit = async () => {
    if (!selectedMember) return
    setActionLoading(selectedMember.id)
    try {
      const profileUpdates: Record<string, unknown> = {
        name: editFormData.name.trim() || null,
        company: editFormData.company.trim() || null,
        profession: editFormData.profession.trim() || null,
        phone: editFormData.phone.trim() || null,
        tax_id: editFormData.tax_id.trim() || null,
        role: editFormData.role,
        updated_at: new Date().toISOString(),
      }

      // Try updating profiles table with country
      const {error: sbErr} = await supabase
        .from('profiles')
        .update({
          ...profileUpdates,
          country: editFormData.country.trim() || null,
        })
        .eq('id', selectedMember.id)

      if (sbErr && sbErr.message.includes('country')) {
        await supabase.from('profiles').update(profileUpdates).eq('id', selectedMember.id)
      } else if (sbErr) {
        throw new Error(sbErr.message)
      }

      // Also persist country and other fields in Supabase Auth user_metadata
      await supabase.auth.admin
        .updateUserById(selectedMember.id, {
          user_metadata: {
            ...detailAuthUser?.user_metadata,
            name: editFormData.name.trim(),
            company: editFormData.company.trim(),
            country: editFormData.country.trim(),
            profession: editFormData.profession.trim(),
            phone: editFormData.phone.trim(),
            role: editFormData.role,
          },
        })
        .catch(() => {})

      const updatedProfile: MemberProfile = {
        ...selectedMember,
        name: editFormData.name.trim() || null,
        company: editFormData.company.trim() || null,
        country: editFormData.country.trim() || null,
        profession: editFormData.profession.trim() || null,
        phone: editFormData.phone.trim() || null,
        tax_id: editFormData.tax_id.trim() || null,
        role: editFormData.role,
      }

      setSelectedMember(updatedProfile)
      setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? updatedProfile : m)))
      setIsEditingProfile(false)
      setSuccessMessage('Üye profil bilgileri başarıyla güncellendi.')
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Güncelleme hatası oluştu.')
    } finally {
      setActionLoading(null)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  useEffect(() => {
    if (!selectedMember) {
      setDetailAuthUser(null)
      setDetailFavorites([])
      setDetailActivities([])
      setShowSampleAnalytics(false)
      setActiveDrawerTab('profile')
      return
    }

    let isMounted = true
    setDetailLoading(true)

    const fetchAuthUser = async (): Promise<AuthUserDetails | null> => {
      try {
        const {data, error: authErr} = await supabase.auth.admin.getUserById(selectedMember.id)
        if (authErr) return null
        return (data?.user as unknown as AuthUserDetails) || null
      } catch {
        return null
      }
    }

    const fetchFavorites = async (): Promise<UserFavorite[]> => {
      try {
        const {data, error: favErr} = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', selectedMember.id)
        if (favErr) return []
        return (data as UserFavorite[]) || []
      } catch {
        return []
      }
    }

    const fetchActivities = async (): Promise<UserActivityRecord[]> => {
      try {
        const {data, error: actErr} = await supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', selectedMember.id)
          .order('created_at', {ascending: false})
          .limit(200)
        if (actErr) return []
        return (data as UserActivityRecord[]) || []
      } catch {
        return []
      }
    }

    Promise.all([fetchAuthUser(), fetchFavorites(), fetchActivities()]).then(
      ([authUser, favs, acts]) => {
        if (isMounted) {
          setDetailAuthUser(authUser)
          setDetailFavorites(favs)
          setDetailActivities(acts)
          setDetailLoading(false)
        }
      },
    )

    return () => {
      isMounted = false
    }
  }, [selectedMember])

  const fetchMembers = async () => {
    setLoading(true)
    setError(null)
    try {
      const {data, error: sbError} = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', {ascending: false})

      if (sbError) {
        throw new Error(sbError.message)
      }

      let profilesList = (data as MemberProfile[]) || []

      // Auth user_metadata'sından ülke ve ek bilgileri takviye et
      try {
        const {data: authData} = await supabase.auth.admin.listUsers()
        if (authData?.users) {
          const authMap = new Map(authData.users.map((u) => [u.id, u]))
          profilesList = profilesList.map((m) => {
            const authUser = authMap.get(m.id)
            const metaCountry = (authUser?.user_metadata?.country as string) || null
            return {
              ...m,
              country: m.country || metaCountry || null,
            }
          })
        }
      } catch {
        // Hata durumunda profiles listesi olduğu gibi kullanılır
      }

      setMembers(profilesList)
    } catch (err: unknown) {
      console.error('Fetch members error:', err)
      setError(err instanceof Error ? err.message : 'Üye listesi yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    setActionLoading(id)
    setSuccessMessage(null)
    try {
      const {error: sbError} = await supabase
        .from('profiles')
        .update({
          architect_verification_status: newStatus,
          role: 'architect',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (sbError) {
        throw new Error(sbError.message)
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === id ? {...m, architect_verification_status: newStatus} : m)),
      )

      setSuccessMessage(
        newStatus === 'approved'
          ? 'Mimar başarıyla onaylandı.'
          : newStatus === 'rejected'
            ? 'Mimar başvurusu reddedildi.'
            : 'Durum güncellendi.',
      )

      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'İşlem sırasında bir hata oluştu.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteMember = async (id: string, email: string) => {
    if (
      !window.confirm(
        `"${email}" kullanıcısını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      )
    ) {
      return
    }
    setActionLoading(id)
    try {
      await supabase.from('profiles').delete().eq('id', id)
      await supabase.auth.admin.deleteUser(id).catch(() => {})

      setMembers((prev) => prev.filter((m) => m.id !== id))
      setSuccessMessage(`"${email}" kullanıcısı başarıyla silindi.`)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Silme işlemi sırasında bir hata oluştu.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleEmailVerified = async (
    id: string,
    email: string,
    currentStatus: boolean | null | undefined,
  ) => {
    const newStatus = !currentStatus
    setActionLoading(id)
    try {
      const {error: sbError} = await supabase
        .from('profiles')
        .update({is_verified: newStatus, updated_at: new Date().toISOString()})
        .eq('id', id)

      if (sbError) throw new Error(sbError.message)

      await supabase.auth.admin
        .updateUserById(id, {
          email_confirm: newStatus,
          user_metadata: {email_verified: newStatus},
        })
        .catch(() => {})

      setMembers((prev) => prev.map((m) => (m.id === id ? {...m, is_verified: newStatus} : m)))
      if (selectedMember?.id === id) {
        setSelectedMember((prev) => (prev ? {...prev, is_verified: newStatus} : null))
      }

      setSuccessMessage(
        newStatus
          ? `"${email}" e-posta adresi doğrulandı olarak işaretlendi.`
          : `"${email}" e-posta doğrulaması kaldırıldı.`,
      )
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'İşlem sırasında bir hata oluştu.')
    } finally {
      setActionLoading(null)
    }
  }

  const copyVerificationLink = (member: MemberProfile) => {
    const baseUrl =
      typeof window !== 'undefined' && window.location.origin.includes('localhost')
        ? 'http://localhost:3000'
        : 'https://www.birim.com'
    const link = `${baseUrl}/verify-email?token=${member.id}&email=${encodeURIComponent(
      member.email,
    )}`
    copyToClipboard(link, `verify_link_${member.id}`)
    setSuccessMessage(`Doğrulama bağlantısı panoya kopyalandı:\n${link}`)
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        (m.name && m.name.toLowerCase().includes(query)) ||
        (m.email && m.email.toLowerCase().includes(query)) ||
        (m.company && m.company.toLowerCase().includes(query)) ||
        (m.country && m.country.toLowerCase().includes(query)) ||
        (m.profession && m.profession.toLowerCase().includes(query)) ||
        (m.phone && m.phone.includes(query))

      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'architect' && m.role === 'architect') ||
        (roleFilter === 'consumer' && m.role !== 'architect') ||
        (roleFilter === 'subscriber' &&
          (m.profession?.toLowerCase().includes('abone') ||
            m.name?.toLowerCase().includes('abone')))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' &&
          (m.architect_verification_status === 'pending' ||
            m.architect_verification_status === 'pending_verification')) ||
        (statusFilter === 'approved' &&
          (m.architect_verification_status === 'approved' ||
            m.architect_verification_status === 'verified')) ||
        (statusFilter === 'rejected' && m.architect_verification_status === 'rejected')

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [members, searchQuery, roleFilter, statusFilter])

  // KPIs
  const totalCount = members.length
  const pendingArchitects = members.filter(
    (m) =>
      m.architect_verification_status === 'pending' ||
      m.architect_verification_status === 'pending_verification',
  ).length
  const approvedArchitects = members.filter(
    (m) =>
      m.architect_verification_status === 'approved' ||
      m.architect_verification_status === 'verified',
  ).length
  const subscriberCount = members.filter(
    (m) => m.profession?.toLowerCase().includes('abone') || m.name?.toLowerCase().includes('abone'),
  ).length
  const consumerCount = members.filter(
    (m) =>
      m.role !== 'architect' &&
      !m.profession?.toLowerCase().includes('abone') &&
      !m.name?.toLowerCase().includes('abone'),
  ).length

  const exportCSV = () => {
    if (filteredMembers.length === 0) return
    const headers = [
      'ID',
      'Ad Soyad',
      'E-posta',
      'Rol',
      'Firma',
      'Ülke',
      'Meslek / Tip',
      'Telefon',
      'Mimar Onay Durumu',
      'E-posta Onaylı',
      'Kayıt Tarihi',
    ]

    const rows = filteredMembers.map((m) => [
      m.id,
      m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim(),
      m.email,
      m.role || 'user',
      m.company || '',
      m.country ||
        (m.id === selectedMember?.id ? (detailAuthUser?.user_metadata?.country as string) : '') ||
        '',
      m.profession || '',
      m.phone || '',
      m.architect_verification_status || 'none',
      m.is_verified ? 'Evet' : 'Hayır',
      m.created_at ? new Date(m.created_at).toLocaleDateString('tr-TR') : '',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `birim_uyeler_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#0f172a',
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          backgroundColor: '#fff',
          padding: '20px 24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 6px 0',
              fontSize: '22px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#0f172a',
            }}
          >
            <span>⚡</span> Supabase Canlı Üye & Mimar Yönetimi
          </h1>
          <p style={{margin: 0, fontSize: '13px', color: '#64748b'}}>
            Tüm üye verileri, bülten aboneleri ve mimar başvuruları doğrudan Supabase PostgreSQL
            veritabanı ile canlı senkronizedir.
          </p>
        </div>

        <div style={{display: 'flex', gap: '10px'}}>
          <button
            onClick={fetchMembers}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <span>🔄</span> {loading ? 'Yükleniyor...' : 'Yenile'}
          </button>

          <button
            onClick={exportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <span>📥</span> CSV Dışa Aktar
          </button>

          <a
            href="https://supabase.com/dashboard/project/rkmpfxervwqleibhbiqv/editor"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#10b981',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <span>🟢</span> Supabase Dashboard ↗
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            padding: '16px 20px',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #3b82f6',
          }}
        >
          <div style={{fontSize: '12px', color: '#64748b', fontWeight: 600}}>TOPLAM KAYITLI</div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 700,
              marginTop: '4px',
              color: '#0f172a',
            }}
          >
            {totalCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            padding: '16px 20px',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #f59e0b',
          }}
        >
          <div style={{fontSize: '12px', color: '#d97706', fontWeight: 600}}>
            ONAY BEKLEYEN MİMAR
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 700,
              marginTop: '4px',
              color: pendingArchitects > 0 ? '#d97706' : '#0f172a',
            }}
          >
            {pendingArchitects}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            padding: '16px 20px',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #10b981',
          }}
        >
          <div style={{fontSize: '12px', color: '#059669', fontWeight: 600}}>ONAYLI MİMARLAR</div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 700,
              marginTop: '4px',
              color: '#0f172a',
            }}
          >
            {approvedArchitects}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            padding: '16px 20px',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #06b6d4',
          }}
        >
          <div style={{fontSize: '12px', color: '#0891b2', fontWeight: 600}}>BÜLTEN ABONELERİ</div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 700,
              marginTop: '4px',
              color: '#0f172a',
            }}
          >
            {subscriberCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            padding: '16px 20px',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #8b5cf6',
          }}
        >
          <div style={{fontSize: '12px', color: '#7c3aed', fontWeight: 600}}>
            BİREYSEL MÜŞTERİLER
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 700,
              marginTop: '4px',
              color: '#0f172a',
            }}
          >
            {consumerCount}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            borderRadius: '8px',
            color: '#166534',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✅</span> {successMessage}
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '14px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Filters Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="İsim, e-posta, firma, meslek ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: '1 1 300px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: '#ffffff',
            color: '#0f172a',
          }}
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <option value="all" style={{color: '#0f172a', backgroundColor: '#ffffff'}}>
            Tüm Kayıtlar
          </option>
          <option value="architect" style={{color: '#0f172a', backgroundColor: '#ffffff'}}>
            Mimarlar
          </option>
          <option value="subscriber" style={{color: '#0f172a', backgroundColor: '#ffffff'}}>
            Bülten Aboneleri
          </option>
          <option value="consumer" style={{color: '#0f172a', backgroundColor: '#ffffff'}}>
            Bireysel Müşteriler
          </option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <option value="all" style={{color: '#0f172a', backgroundColor: '#ffffff'}}>
            Tüm Onay Durumları
          </option>
          <option value="pending" style={{color: '#0f172a', backgroundColor: '#ffffff'}}>
            Onay Bekleyenler
          </option>
          <option value="approved" style={{color: '#0f172a', backgroundColor: '#ffffff'}}>
            Onaylananlar
          </option>
          <option value="rejected" style={{color: '#0f172a', backgroundColor: '#ffffff'}}>
            Reddedilenler
          </option>
        </select>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{padding: '60px', textAlign: 'center', color: '#64748b'}}>
            🔄 Üye verileri Supabase'den yükleniyor...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div style={{padding: '60px', textAlign: 'center', color: '#64748b'}}>
            Kriterlere uygun üye kaydı bulunamadı.
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                <th style={{padding: '14px 16px'}}>Üye / Abone Bilgisi</th>
                <th style={{padding: '14px 16px'}}>Rol / Tip</th>
                <th style={{padding: '14px 16px'}}>Firma & Meslek</th>
                <th style={{padding: '14px 16px'}}>İletişim</th>
                <th style={{padding: '14px 16px'}}>Mimar Onayı</th>
                <th style={{padding: '14px 16px'}}>Kayıt Tarihi</th>
                <th style={{padding: '14px 16px', textAlign: 'right'}}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => {
                const displayName =
                  m.name ||
                  `${m.first_name || ''} ${m.last_name || ''}`.trim() ||
                  m.email.split('@')[0]
                const isSubscriber =
                  m.profession?.toLowerCase().includes('abone') ||
                  m.name?.toLowerCase().includes('abone')
                const isPending =
                  m.architect_verification_status === 'pending' ||
                  m.architect_verification_status === 'pending_verification'
                const isApproved =
                  m.architect_verification_status === 'approved' ||
                  m.architect_verification_status === 'verified'
                const isRejected = m.architect_verification_status === 'rejected'

                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <td
                      style={{padding: '14px 16px', cursor: 'pointer'}}
                      onClick={() => setSelectedMember(m)}
                      title="Detayları görüntülemek için tıklayın"
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{displayName}</span>
                        <span style={{fontSize: '11px', color: '#6366f1', opacity: 0.8}}>🔍</span>
                      </div>
                      <div style={{color: '#64748b', fontSize: '12px'}}>{m.email}</div>
                    </td>

                    <td style={{padding: '14px 16px'}}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor:
                            m.role === 'architect'
                              ? '#ede9fe'
                              : isSubscriber
                                ? '#cffafe'
                                : '#e0f2fe',
                          color:
                            m.role === 'architect'
                              ? '#6d28d9'
                              : isSubscriber
                                ? '#0e7490'
                                : '#0369a1',
                        }}
                      >
                        {m.role === 'architect'
                          ? '📐 Mimar'
                          : isSubscriber
                            ? '📬 Bülten Abonesi'
                            : '👤 Müşteri'}
                      </span>
                    </td>

                    <td style={{padding: '14px 16px'}}>
                      <div style={{color: '#0f172a'}}>
                        {m.company || '-'}
                        {m.country ? (
                          <span
                            style={{
                              marginLeft: '6px',
                              fontSize: '11px',
                              color: '#475569',
                              backgroundColor: '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 500,
                            }}
                          >
                            🌍 {m.country}
                          </span>
                        ) : null}
                      </div>
                      <div style={{color: '#64748b', fontSize: '12px'}}>
                        {m.profession
                          ? m.profession
                              .replace(/B[^\w\s]lten/gi, 'Bülten')
                              .replace(/B\?lten/gi, 'Bülten')
                          : '-'}
                      </div>
                    </td>

                    <td style={{padding: '14px 16px'}}>
                      <div style={{color: '#0f172a'}}>{m.phone || '-'}</div>
                      <div style={{fontSize: '11px'}}>
                        {m.is_verified ? (
                          <span style={{color: '#10b981'}}>● E-posta Doğrulandı</span>
                        ) : (
                          <span style={{color: '#f59e0b'}}>○ Doğrulama Bekliyor</span>
                        )}
                      </div>
                    </td>

                    <td style={{padding: '14px 16px'}}>
                      {m.role === 'architect' ? (
                        isApproved ? (
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                            }}
                          >
                            ✓ Onaylı Mimar
                          </span>
                        ) : isPending ? (
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: '#fef3c7',
                              color: '#b45309',
                            }}
                          >
                            ⏳ Onay Bekliyor
                          </span>
                        ) : isRejected ? (
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                            }}
                          >
                            ✕ Reddedildi
                          </span>
                        ) : (
                          <span style={{color: '#94a3b8'}}>Talep Yok</span>
                        )
                      ) : (
                        <span style={{color: '#94a3b8'}}>-</span>
                      )}
                    </td>

                    <td style={{padding: '14px 16px', color: '#64748b'}}>
                      {m.created_at
                        ? new Date(m.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </td>

                    <td style={{padding: '14px 16px', textAlign: 'right'}}>
                      {actionLoading === m.id ? (
                        <span style={{fontSize: '12px', color: '#64748b'}}>İşleniyor...</span>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            gap: '6px',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            onClick={() => setSelectedMember(m)}
                            title="Tüm Detayları Gör"
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#e0e7ff',
                              color: '#3730a3',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>🔍</span> Detay
                          </button>

                          {m.role === 'architect' && !isApproved && (
                            <button
                              onClick={() => handleUpdateStatus(m.id, 'approved')}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              Onayla
                            </button>
                          )}

                          {m.role === 'architect' && !isRejected && (
                            <button
                              onClick={() => handleUpdateStatus(m.id, 'rejected')}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#f59e0b',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              Reddet
                            </button>
                          )}

                          {!m.is_verified && (
                            <button
                              onClick={() => copyVerificationLink(m)}
                              title="Doğrulama Linkini Kopyala"
                              style={{
                                padding: '5px 8px',
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fcd34d',
                                borderRadius: '6px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              🔗 Link
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteMember(m.id, m.email)}
                            title="Kullanıcıyı Sil"
                            style={{
                              padding: '5px 8px',
                              backgroundColor: '#ffffff',
                              color: '#ef4444',
                              border: '1px solid #fca5a5',
                              borderRadius: '6px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            🗑️ Sil
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detay Çekmecesi / Modal (Slide-Over Drawer) */}
      {selectedMember && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedMember(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '740px',
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '-6px 0 25px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              color: '#0f172a',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '24px 24px 16px 24px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <div style={{display: 'flex', gap: '14px', alignItems: 'center'}}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor:
                      selectedMember.role === 'architect'
                        ? '#7c3aed'
                        : selectedMember.profession?.toLowerCase().includes('abone') ||
                            selectedMember.name?.toLowerCase().includes('abone')
                          ? '#0891b2'
                          : '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {(
                    selectedMember.name ||
                    selectedMember.first_name ||
                    selectedMember.email
                  ).substring(0, 2)}
                </div>

                <div>
                  <h2
                    style={{
                      margin: '0 0 4px 0',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    {selectedMember.name ||
                      `${selectedMember.first_name || ''} ${
                        selectedMember.last_name || ''
                      }`.trim() ||
                      selectedMember.email.split('@')[0]}
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor:
                          selectedMember.role === 'architect'
                            ? '#ede9fe'
                            : selectedMember.profession?.toLowerCase().includes('abone')
                              ? '#cffafe'
                              : '#e0f2fe',
                        color:
                          selectedMember.role === 'architect'
                            ? '#6d28d9'
                            : selectedMember.profession?.toLowerCase().includes('abone')
                              ? '#0e7490'
                              : '#0369a1',
                      }}
                    >
                      {selectedMember.role === 'architect'
                        ? '📐 Mimar'
                        : selectedMember.profession?.toLowerCase().includes('abone') ||
                            selectedMember.name?.toLowerCase().includes('abone')
                          ? '📬 Bülten Abonesi'
                          : '👤 Standart Müşteri'}
                    </span>

                    {selectedMember.role === 'architect' && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor:
                            selectedMember.architect_verification_status === 'approved' ||
                            selectedMember.architect_verification_status === 'verified'
                              ? '#dcfce7'
                              : selectedMember.architect_verification_status === 'rejected'
                                ? '#fee2e2'
                                : '#fef3c7',
                          color:
                            selectedMember.architect_verification_status === 'approved' ||
                            selectedMember.architect_verification_status === 'verified'
                              ? '#15803d'
                              : selectedMember.architect_verification_status === 'rejected'
                                ? '#b91c1c'
                                : '#b45309',
                        }}
                      >
                        {selectedMember.architect_verification_status === 'approved' ||
                        selectedMember.architect_verification_status === 'verified'
                          ? '✓ Onaylı'
                          : selectedMember.architect_verification_status === 'rejected'
                            ? '✕ Reddedildi'
                            : '⏳ Onay Bekliyor'}
                      </span>
                    )}

                    {selectedMember.is_verified ? (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                        }}
                      >
                        ✓ E-posta Doğrulanmış
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                        }}
                      >
                        ○ E-posta Onaysız
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                style={{
                  background: '#e2e8f0',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#475569',
                  fontWeight: 700,
                }}
                title="Kapat"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                padding: '0 24px',
                gap: '8px',
              }}
            >
              <button
                onClick={() => setActiveDrawerTab('profile')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeDrawerTab === 'profile' ? 700 : 500,
                  color: activeDrawerTab === 'profile' ? '#2563eb' : '#64748b',
                  borderBottom:
                    activeDrawerTab === 'profile' ? '2px solid #2563eb' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>👤</span> Profil & Detaylar
              </button>

              <button
                onClick={() => setActiveDrawerTab('analytics')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeDrawerTab === 'analytics' ? 700 : 500,
                  color: activeDrawerTab === 'analytics' ? '#2563eb' : '#64748b',
                  borderBottom:
                    activeDrawerTab === 'analytics' ? '2px solid #2563eb' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>📊</span> Aktivite & Analitik Grafikleri
                {detailActivities.length > 0 && (
                  <span
                    style={{
                      backgroundColor: '#dbeafe',
                      color: '#1d4ed8',
                      fontSize: '11px',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {detailActivities.length}
                  </span>
                )}
              </button>
            </div>

            {/* Drawer Body */}
            <div
              style={{
                padding: '24px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {detailLoading && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#64748b',
                    textAlign: 'center',
                  }}
                >
                  Canlı Supabase oturum, favori ve aktivite verileri yükleniyor...
                </div>
              )}

              {/* TAB 1: PROFİL & HESAP DETAYLARI */}
              {activeDrawerTab === 'profile' &&
                (isEditingProfile ? (
                  <div
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '20px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#0f172a',
                        borderBottom: '1px solid #e2e8f0',
                        paddingBottom: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>✏️ Üye Bilgilerini Düzenle</span>
                      <span style={{fontSize: '11px', color: '#64748b'}}>
                        {selectedMember.email}
                      </span>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: '#334155'}}>
                        Ad Soyad:
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        placeholder="Örn: Cenk Tanrıkulu"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: '#334155'}}>
                        Firma Adı:
                      </label>
                      <input
                        type="text"
                        value={editFormData.company}
                        onChange={(e) =>
                          setEditFormData({...editFormData, company: e.target.value})
                        }
                        placeholder="Örn: Tanrıkulu Mimarlık"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: '#334155'}}>
                        Ülke:
                      </label>
                      <input
                        type="text"
                        value={editFormData.country}
                        onChange={(e) =>
                          setEditFormData({...editFormData, country: e.target.value})
                        }
                        placeholder="Örn: Türkiye"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: '#334155'}}>
                        Meslek / Uzmanlık:
                      </label>
                      <input
                        type="text"
                        value={editFormData.profession}
                        onChange={(e) =>
                          setEditFormData({...editFormData, profession: e.target.value})
                        }
                        placeholder="Örn: Mimar / İç Mimar"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: '#334155'}}>
                        Telefon Numarası:
                      </label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                        placeholder="Örn: +90 532 123 4567"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: '#334155'}}>
                        Vergi No / T.C. Kimlik:
                      </label>
                      <input
                        type="text"
                        value={editFormData.tax_id}
                        onChange={(e) => setEditFormData({...editFormData, tax_id: e.target.value})}
                        placeholder="İsteğe bağlı vergi veya kimlik no"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: '#334155'}}>
                        Kullanıcı Rolü:
                      </label>
                      <select
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <option value="architect">📐 Mimar (architect)</option>
                        <option value="user">👤 Standart Üye / Bülten Abonesi (user)</option>
                        <option value="admin">⚡ Yönetici (admin)</option>
                      </select>
                    </div>

                    <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                      <button
                        onClick={handleSaveProfileEdit}
                        disabled={actionLoading === selectedMember.id}
                        style={{
                          padding: '10px 18px',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: actionLoading === selectedMember.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {actionLoading === selectedMember.id
                          ? 'Kaydediliyor...'
                          : '✓ Değişiklikleri Kaydet'}
                      </button>
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Bölüm 1: Temel & İletişim Bilgileri */}
                    <div
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0f172a',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <span>👤</span> Temel & İletişim Bilgileri
                        </div>
                        <button
                          onClick={startEditProfile}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>✏️</span> Bilgileri Düzenle
                        </button>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr',
                          gap: '10px',
                          fontSize: '13px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{color: '#64748b'}}>Kullanıcı ID (UUID):</span>
                          <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <code
                              style={{
                                backgroundColor: '#f1f5f9',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: '#0f172a',
                              }}
                            >
                              {selectedMember.id.substring(0, 12)}...
                            </code>
                            <button
                              onClick={() => copyToClipboard(selectedMember.id, 'id')}
                              style={{
                                fontSize: '11px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: '#2563eb',
                                fontWeight: 600,
                              }}
                            >
                              {copiedField === 'id' ? '✓ Kopyalandı' : 'Kopyala'}
                            </button>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{color: '#64748b'}}>E-posta:</span>
                          <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <a
                              href={`mailto:${selectedMember.email}`}
                              style={{
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontWeight: 600,
                              }}
                            >
                              {selectedMember.email}
                            </a>
                            <button
                              onClick={() => copyToClipboard(selectedMember.email, 'email')}
                              style={{
                                fontSize: '11px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: '#2563eb',
                                fontWeight: 600,
                              }}
                            >
                              {copiedField === 'email' ? '✓ Kopyalandı' : 'Kopyala'}
                            </button>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{color: '#64748b'}}>Telefon:</span>
                          {selectedMember.phone ? (
                            <a
                              href={`tel:${selectedMember.phone}`}
                              style={{
                                color: '#0f172a',
                                fontWeight: 600,
                                textDecoration: 'none',
                              }}
                            >
                              {selectedMember.phone}
                            </a>
                          ) : (
                            <span style={{color: '#94a3b8'}}>Belirtilmedi</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bölüm 2: Kurumsal & Mesleki Bilgiler */}
                    <div
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0f172a',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>💼</span> Kurumsal & Mesleki Bilgiler
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr',
                          gap: '10px',
                          fontSize: '13px',
                        }}
                      >
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{color: '#64748b'}}>Meslek / Üyelik Detayı:</span>
                          <span style={{fontWeight: 600, color: '#0f172a'}}>
                            {selectedMember.profession
                              ? selectedMember.profession
                                  .replace(/B[^\w\s]lten/gi, 'Bülten')
                                  .replace(/B\?lten/gi, 'Bülten')
                              : '-'}
                          </span>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{color: '#64748b'}}>Firma / Ofis:</span>
                          <span style={{fontWeight: 600, color: '#0f172a'}}>
                            {selectedMember.company || '-'}
                          </span>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{color: '#64748b'}}>Ülke:</span>
                          <span style={{fontWeight: 600, color: '#0f172a'}}>
                            {selectedMember.country ||
                              (detailAuthUser?.user_metadata?.country as string) ||
                              '-'}
                          </span>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{color: '#64748b'}}>Vergi No / T.C. Kimlik:</span>
                          <span style={{fontWeight: 600, color: '#0f172a'}}>
                            {selectedMember.tax_id || '-'}
                          </span>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{color: '#64748b'}}>Kullanıcı Rolü:</span>
                          <span
                            style={{
                              textTransform: 'capitalize',
                              fontWeight: 600,
                              color: '#0f172a',
                            }}
                          >
                            {selectedMember.role || 'user'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bölüm 3: Oturum & Zaman Damgaları */}
                    <div
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0f172a',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>🕒</span> Oturum & Zaman Damgaları
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr',
                          gap: '10px',
                          fontSize: '13px',
                        }}
                      >
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{color: '#64748b'}}>Kayıt / Katılım Tarihi:</span>
                          <span style={{fontWeight: 600, color: '#0f172a'}}>
                            {selectedMember.created_at
                              ? new Date(selectedMember.created_at).toLocaleString('tr-TR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </span>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{color: '#64748b'}}>Son Profil Güncelleme:</span>
                          <span style={{fontWeight: 600, color: '#0f172a'}}>
                            {selectedMember.updated_at
                              ? new Date(selectedMember.updated_at).toLocaleString('tr-TR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </span>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{color: '#64748b'}}>Son Canlı Giriş:</span>
                          <span style={{fontWeight: 600, color: '#0f172a'}}>
                            {detailAuthUser?.last_sign_in_at
                              ? new Date(detailAuthUser.last_sign_in_at).toLocaleString('tr-TR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Henüz giriş yapılmadı'}
                          </span>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{color: '#64748b'}}>E-posta Onaylanma:</span>
                          <span style={{fontWeight: 600, color: '#0f172a'}}>
                            {detailAuthUser?.email_confirmed_at
                              ? new Date(detailAuthUser.email_confirmed_at).toLocaleString(
                                  'tr-TR',
                                  {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )
                              : selectedMember.is_verified
                                ? 'Onaylandı'
                                : 'Onay Bekliyor'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bölüm 4: Favori Ürünler */}
                    <div
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0f172a',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <span>❤️</span> Favoriye Alınan Ürünler
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 700,
                          }}
                        >
                          {detailFavorites.length}
                        </span>
                      </div>

                      {detailFavorites.length === 0 ? (
                        <p style={{margin: 0, fontSize: '12px', color: '#94a3b8'}}>
                          Bu kullanıcının henüz favoriye eklediği bir ürün bulunmuyor.
                        </p>
                      ) : (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                          {detailFavorites.map((fav) => (
                            <div
                              key={fav.id}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px',
                              }}
                            >
                              <span style={{fontWeight: 600, color: '#0f172a'}}>
                                {fav.product_name || fav.product_slug || 'Ürün'}
                              </span>
                              <span style={{color: '#94a3b8', fontSize: '11px'}}>
                                {fav.created_at
                                  ? new Date(fav.created_at).toLocaleDateString('tr-TR')
                                  : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ))}

              {/* TAB 2: AKTİVİTE & ANALİTİK GRAFİKLERİ */}
              {activeDrawerTab === 'analytics' &&
                (() => {
                  // Determine whether to show real activities or sample fallback for preview
                  const hasActivities = detailActivities.length > 0
                  const isDemo = !hasActivities && showSampleAnalytics

                  // Sample fallback activities so admin can visualize charts before users start browsing
                  const sampleActivities: UserActivityRecord[] = [
                    {
                      id: 'sample-1',
                      user_id: selectedMember.id,
                      session_id: 'sess_1',
                      activity_type: 'session_start',
                      page_url: '/',
                      page_title: 'Ana Sayfa | Birim',
                      duration_seconds: 0,
                      platform: 'Desktop',
                      os: 'macOS',
                      browser: 'Chrome',
                      referrer: 'https://google.com',
                      city: 'İstanbul',
                      country: 'TR',
                      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
                    },
                    {
                      id: 'sample-2',
                      user_id: selectedMember.id,
                      session_id: 'sess_1',
                      activity_type: 'page_dwell',
                      page_url: '/products/arven-sofa',
                      page_title: 'Arven Kanepe | Koleksiyon',
                      duration_seconds: 245,
                      platform: 'Desktop',
                      os: 'macOS',
                      browser: 'Chrome',
                      city: 'İstanbul',
                      country: 'TR',
                      created_at: new Date(Date.now() - 1000 * 60 * 41).toISOString(),
                    },
                    {
                      id: 'sample-3',
                      user_id: selectedMember.id,
                      session_id: 'sess_1',
                      activity_type: 'download',
                      page_url: '/products/arven-sofa',
                      page_title: 'Arven Kanepe | Koleksiyon',
                      download_file_name: 'arven-kanepe-2d-dwg.zip',
                      download_file_type: 'cad_2d',
                      duration_seconds: 0,
                      platform: 'Desktop',
                      os: 'macOS',
                      browser: 'Chrome',
                      city: 'İstanbul',
                      country: 'TR',
                      created_at: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
                    },
                    {
                      id: 'sample-4',
                      user_id: selectedMember.id,
                      session_id: 'sess_1',
                      activity_type: 'page_dwell',
                      page_url: '/products/zenith-chair',
                      page_title: 'Zenith Sandalye | Koleksiyon',
                      duration_seconds: 180,
                      platform: 'Desktop',
                      os: 'macOS',
                      browser: 'Chrome',
                      city: 'İstanbul',
                      country: 'TR',
                      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
                    },
                    {
                      id: 'sample-5',
                      user_id: selectedMember.id,
                      session_id: 'sess_1',
                      activity_type: 'download',
                      page_url: '/products/zenith-chair',
                      page_title: 'Zenith Sandalye | Koleksiyon',
                      download_file_name: 'zenith-chair-3d-model.obj',
                      download_file_type: '3d_model',
                      duration_seconds: 0,
                      platform: 'Desktop',
                      os: 'macOS',
                      browser: 'Chrome',
                      city: 'İstanbul',
                      country: 'TR',
                      created_at: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
                    },
                    {
                      id: 'sample-6',
                      user_id: selectedMember.id,
                      session_id: 'sess_1',
                      activity_type: 'session_end',
                      page_url: '/products/zenith-chair',
                      duration_seconds: 0,
                      platform: 'Desktop',
                      os: 'macOS',
                      browser: 'Chrome',
                      city: 'İstanbul',
                      country: 'TR',
                      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                    },
                    {
                      id: 'sample-7',
                      user_id: selectedMember.id,
                      session_id: 'sess_2',
                      activity_type: 'session_start',
                      page_url: '/materials',
                      page_title: 'Malzemeler & Dokular | Birim',
                      duration_seconds: 0,
                      platform: 'Mobile',
                      os: 'iOS',
                      browser: 'Safari',
                      referrer: 'Direct',
                      city: 'Ankara',
                      country: 'TR',
                      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                    },
                    {
                      id: 'sample-8',
                      user_id: selectedMember.id,
                      session_id: 'sess_2',
                      activity_type: 'page_dwell',
                      page_url: '/materials',
                      page_title: 'Malzemeler & Dokular | Birim',
                      duration_seconds: 310,
                      platform: 'Mobile',
                      os: 'iOS',
                      browser: 'Safari',
                      city: 'Ankara',
                      country: 'TR',
                      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                    },
                  ]

                  const activeData = hasActivities
                    ? detailActivities
                    : isDemo
                      ? sampleActivities
                      : []

                  if (!hasActivities && !isDemo) {
                    return (
                      <div
                        style={{
                          padding: '36px 20px',
                          textAlign: 'center',
                          backgroundColor: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px dashed #cbd5e1',
                        }}
                      >
                        <div style={{fontSize: '32px', marginBottom: '8px'}}>📈</div>
                        <h3
                          style={{
                            margin: '0 0 8px 0',
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#0f172a',
                          }}
                        >
                          Henüz Kaydedilmiş Canlı Aktivite Yok
                        </h3>
                        <p
                          style={{
                            margin: '0 auto 16px auto',
                            fontSize: '13px',
                            color: '#64748b',
                            maxWidth: '440px',
                            lineHeight: '1.5',
                          }}
                        >
                          Bu üye web sitesini ziyaret edip sayfaları gezdiğinde veya dosya
                          indirdiğinde tüm analitik ve kalma süresi grafikleri burada otomatik
                          görünecektir.
                        </p>
                        <button
                          onClick={() => setShowSampleAnalytics(true)}
                          style={{
                            padding: '9px 16px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>👁️</span> Grafik Arayüzünü Örnek Verilerle İncele (Demo)
                        </button>
                      </div>
                    )
                  }

                  // Compute Metrics
                  const totalDwellSeconds = activeData.reduce(
                    (acc, item) => acc + (Number(item.duration_seconds) || 0),
                    0,
                  )
                  const totalMinutes = Math.floor(totalDwellSeconds / 60)
                  const remainingSeconds = totalDwellSeconds % 60
                  const formattedDuration =
                    totalMinutes >= 60
                      ? `${Math.floor(totalMinutes / 60)} sa ${totalMinutes % 60} dk`
                      : `${totalMinutes} dk ${remainingSeconds} sn`

                  const uniqueSessions = new Set(
                    activeData.map((a) => a.session_id).filter(Boolean),
                  ).size

                  const pageViewsCount = activeData.filter(
                    (a) => a.activity_type === 'page_view' || a.activity_type === 'page_dwell',
                  ).length

                  const downloadsList = activeData.filter((a) => a.activity_type === 'download')
                  const totalDownloads = downloadsList.length

                  // Group by Page for Top Viewed Pages
                  const pageStatsMap = new Map<
                    string,
                    {count: number; totalDuration: number; title: string}
                  >()

                  activeData.forEach((a) => {
                    if (
                      (a.activity_type === 'page_view' || a.activity_type === 'page_dwell') &&
                      a.page_url
                    ) {
                      const existing = pageStatsMap.get(a.page_url) || {
                        count: 0,
                        totalDuration: 0,
                        title: a.page_title || a.page_url,
                      }
                      existing.count += 1
                      existing.totalDuration += Number(a.duration_seconds) || 0
                      if (a.page_title) existing.title = a.page_title
                      pageStatsMap.set(a.page_url, existing)
                    }
                  })

                  const topPages = Array.from(pageStatsMap.entries())
                    .map(([url, stats]) => ({
                      url,
                      ...stats,
                      avgDuration: Math.round(stats.totalDuration / Math.max(1, stats.count)),
                    }))
                    .sort((a, b) => b.totalDuration - a.totalDuration)
                    .slice(0, 6)

                  // Platform Breakdown
                  const platformCounts = {Desktop: 0, Mobile: 0, Tablet: 0, Other: 0}
                  activeData.forEach((a) => {
                    const p = a.platform?.toLowerCase() || ''
                    if (p.includes('desktop')) platformCounts.Desktop++
                    else if (p.includes('mobile')) platformCounts.Mobile++
                    else if (p.includes('tablet')) platformCounts.Tablet++
                    else if (a.platform) platformCounts.Other++
                  })

                  const totalPlatformEvents =
                    platformCounts.Desktop +
                      platformCounts.Mobile +
                      platformCounts.Tablet +
                      platformCounts.Other || 1

                  // Daily Activity Histogram (Last 7 days)
                  const daysList: {
                    label: string
                    dateStr: string
                    count: number
                    duration: number
                  }[] = []
                  for (let i = 6; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    const dateStr = d.toISOString().split('T')[0]
                    const label = d.toLocaleDateString('tr-TR', {weekday: 'short', day: 'numeric'})
                    daysList.push({label, dateStr, count: 0, duration: 0})
                  }

                  activeData.forEach((a) => {
                    if (!a.created_at) return
                    const itemDateStr = a.created_at.split('T')[0]
                    const targetDay = daysList.find((d) => d.dateStr === itemDateStr)
                    if (targetDay) {
                      targetDay.count += 1
                      targetDay.duration += Number(a.duration_seconds) || 0
                    }
                  })

                  const maxDayEvents = Math.max(...daysList.map((d) => d.count), 5)

                  return (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                      {isDemo && (
                        <div
                          style={{
                            padding: '10px 14px',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#1e40af',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>
                            💡 <strong>Demo Görünümü:</strong> Aşağıdaki grafikler sistemin nasıl
                            göründüğünü simüle etmek için örnek verilerle çizdirilmektedir.
                          </span>
                          <button
                            onClick={() => setShowSampleAnalytics(false)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            ✕ Kapat
                          </button>
                        </div>
                      )}

                      {/* KPI Özet Kartları */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '12px',
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: '#f8fafc',
                            padding: '14px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{fontSize: '11px', color: '#64748b', fontWeight: 600}}>
                            🕒 Toplam Kalma Süresi
                          </div>
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: '#0f172a',
                              marginTop: '4px',
                            }}
                          >
                            {formattedDuration}
                          </div>
                        </div>

                        <div
                          style={{
                            backgroundColor: '#f8fafc',
                            padding: '14px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{fontSize: '11px', color: '#64748b', fontWeight: 600}}>
                            🚪 Ziyaret / Oturum
                          </div>
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: '#2563eb',
                              marginTop: '4px',
                            }}
                          >
                            {uniqueSessions}
                          </div>
                        </div>

                        <div
                          style={{
                            backgroundColor: '#f8fafc',
                            padding: '14px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{fontSize: '11px', color: '#64748b', fontWeight: 600}}>
                            📄 Sayfa İnceleme
                          </div>
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: '#0f172a',
                              marginTop: '4px',
                            }}
                          >
                            {pageViewsCount}
                          </div>
                        </div>

                        <div
                          style={{
                            backgroundColor: '#f8fafc',
                            padding: '14px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{fontSize: '11px', color: '#64748b', fontWeight: 600}}>
                            📥 İndirilen Dosya
                          </div>
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: '#16a34a',
                              marginTop: '4px',
                            }}
                          >
                            {totalDownloads}
                          </div>
                        </div>
                      </div>

                      {/* GRAFİK 1: Günlük Ziyaret & Sayfa Trafiği Histogramı */}
                      <div
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '18px',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#0f172a',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>📈</span> Son 7 Günlük Ziyaret ve Etkileşim Grafiği
                          </div>
                          <span style={{fontSize: '11px', color: '#64748b'}}>
                            Sayfa Gezintileri & İşlemler
                          </span>
                        </div>

                        {/* Bar Chart Container */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            height: '140px',
                            paddingTop: '20px',
                            borderBottom: '1px solid #e2e8f0',
                            gap: '12px',
                          }}
                        >
                          {daysList.map((day, idx) => {
                            const heightPct = Math.max(
                              8,
                              Math.round((day.count / maxDayEvents) * 100),
                            )
                            return (
                              <div
                                key={idx}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  height: '100%',
                                  justifyContent: 'flex-end',
                                }}
                              >
                                <div
                                  title={`${day.label}: ${day.count} işlem, ${Math.round(
                                    day.duration / 60,
                                  )} dk`}
                                  style={{
                                    width: '100%',
                                    maxWidth: '36px',
                                    height: `${heightPct}%`,
                                    backgroundColor: day.count > 0 ? '#3b82f6' : '#e2e8f0',
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.3s ease, background-color 0.2s',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    paddingTop: '2px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {day.count > 0 ? day.count : ''}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* X-Axis Labels */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '8px',
                            fontSize: '11px',
                            color: '#64748b',
                          }}
                        >
                          {daysList.map((day, idx) => (
                            <div key={idx} style={{flex: 1, textAlign: 'center', fontWeight: 500}}>
                              {day.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* GRAFİK 2: Platform & Cihaz Dağılımı */}
                      <div
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '18px',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#0f172a',
                            marginBottom: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>💻</span> Platform, Cihaz & Giriş Noktası
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '14px',
                          }}
                        >
                          {/* Masaüstü */}
                          <div
                            style={{
                              padding: '12px',
                              backgroundColor: '#f8fafc',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              <span>🖥️ Masaüstü (PC/Mac)</span>
                              <span style={{color: '#2563eb'}}>
                                {Math.round((platformCounts.Desktop / totalPlatformEvents) * 100)}%
                              </span>
                            </div>
                            <div
                              style={{
                                height: '6px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '3px',
                                marginTop: '8px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${(platformCounts.Desktop / totalPlatformEvents) * 100}%`,
                                  height: '100%',
                                  backgroundColor: '#2563eb',
                                  borderRadius: '3px',
                                }}
                              />
                            </div>
                          </div>

                          {/* Mobil */}
                          <div
                            style={{
                              padding: '12px',
                              backgroundColor: '#f8fafc',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              <span>📱 Mobil Telefon</span>
                              <span style={{color: '#0891b2'}}>
                                {Math.round((platformCounts.Mobile / totalPlatformEvents) * 100)}%
                              </span>
                            </div>
                            <div
                              style={{
                                height: '6px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '3px',
                                marginTop: '8px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${(platformCounts.Mobile / totalPlatformEvents) * 100}%`,
                                  height: '100%',
                                  backgroundColor: '#0891b2',
                                  borderRadius: '3px',
                                }}
                              />
                            </div>
                          </div>

                          {/* Tablet / Diğer */}
                          <div
                            style={{
                              padding: '12px',
                              backgroundColor: '#f8fafc',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              <span>📟 Tablet / Diğer</span>
                              <span style={{color: '#7c3aed'}}>
                                {Math.round(
                                  ((platformCounts.Tablet + platformCounts.Other) /
                                    totalPlatformEvents) *
                                    100,
                                )}
                                %
                              </span>
                            </div>
                            <div
                              style={{
                                height: '6px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '3px',
                                marginTop: '8px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${
                                    ((platformCounts.Tablet + platformCounts.Other) /
                                      totalPlatformEvents) *
                                    100
                                  }%`,
                                  height: '100%',
                                  backgroundColor: '#7c3aed',
                                  borderRadius: '3px',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BÖLÜM 3: En Çok İncelenen Sayfalar & Kalma Süresi */}
                      <div
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '18px',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#0f172a',
                            marginBottom: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>📑</span> En Çok İncelenen Sayfalar & Kalma Süreleri
                        </div>

                        {topPages.length === 0 ? (
                          <p style={{margin: 0, fontSize: '12px', color: '#94a3b8'}}>
                            Henüz sayfa inceleme kaydı bulunmuyor.
                          </p>
                        ) : (
                          <table
                            style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '12px',
                            }}
                          >
                            <thead>
                              <tr
                                style={{
                                  borderBottom: '1px solid #e2e8f0',
                                  color: '#64748b',
                                  textAlign: 'left',
                                }}
                              >
                                <th style={{padding: '8px 10px'}}>Sayfa Yolu & Başlık</th>
                                <th style={{padding: '8px 10px'}}>Ziyaret</th>
                                <th style={{padding: '8px 10px'}}>Toplam Süre</th>
                                <th style={{padding: '8px 10px', textAlign: 'right'}}>Ort. Süre</th>
                              </tr>
                            </thead>
                            <tbody>
                              {topPages.map((page, idx) => (
                                <tr key={idx} style={{borderBottom: '1px solid #f1f5f9'}}>
                                  <td style={{padding: '10px'}}>
                                    <div style={{fontWeight: 600, color: '#0f172a'}}>
                                      {page.title}
                                    </div>
                                    <div style={{color: '#64748b', fontSize: '11px'}}>
                                      {page.url}
                                    </div>
                                  </td>
                                  <td style={{padding: '10px'}}>
                                    <span
                                      style={{
                                        backgroundColor: '#f1f5f9',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                      }}
                                    >
                                      {page.count} kez
                                    </span>
                                  </td>
                                  <td style={{padding: '10px', color: '#0f172a', fontWeight: 600}}>
                                    {page.totalDuration >= 60
                                      ? `${Math.floor(page.totalDuration / 60)} dk ${
                                          page.totalDuration % 60
                                        } sn`
                                      : `${page.totalDuration} sn`}
                                  </td>
                                  <td
                                    style={{
                                      padding: '10px',
                                      textAlign: 'right',
                                      color: '#2563eb',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {page.avgDuration >= 60
                                      ? `${Math.floor(page.avgDuration / 60)} dk ${
                                          page.avgDuration % 60
                                        } sn`
                                      : `${page.avgDuration} sn`}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* BÖLÜM 4: İndirilen Dosyalar */}
                      <div
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '18px',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#0f172a',
                            marginBottom: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <span>📥</span> İndirilen Teknik & 3D Dosyalar
                          </div>
                          <span
                            style={{
                              fontSize: '11px',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontWeight: 700,
                            }}
                          >
                            {downloadsList.length} dosya
                          </span>
                        </div>

                        {downloadsList.length === 0 ? (
                          <p style={{margin: 0, fontSize: '12px', color: '#94a3b8'}}>
                            Bu kullanıcı henüz bir teknik dosya (DWG/CAD/3D) indirmedi.
                          </p>
                        ) : (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            {downloadsList.map((dl, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '10px 14px',
                                  backgroundColor: '#f8fafc',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '12px',
                                }}
                              >
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                  <span style={{fontSize: '16px'}}>
                                    {dl.download_file_type === '3d_model'
                                      ? '🧊'
                                      : dl.download_file_type === 'cad_2d'
                                        ? '📐'
                                        : '📑'}
                                  </span>
                                  <div>
                                    <div style={{fontWeight: 600, color: '#0f172a'}}>
                                      {dl.download_file_name || 'Dosya'}
                                    </div>
                                    <div style={{color: '#64748b', fontSize: '11px'}}>
                                      {dl.page_title || dl.page_url || ''}
                                    </div>
                                  </div>
                                </div>

                                <div style={{textAlign: 'right'}}>
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      color: '#15803d',
                                      backgroundColor: '#dcfce7',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {dl.download_file_type === '3d_model'
                                      ? '3D Model'
                                      : dl.download_file_type === 'cad_2d'
                                        ? '2D DWG / CAD'
                                        : 'Katalog / PDF'}
                                  </span>
                                  <div
                                    style={{
                                      fontSize: '10px',
                                      color: '#94a3b8',
                                      marginTop: '4px',
                                    }}
                                  >
                                    {dl.created_at
                                      ? new Date(dl.created_at).toLocaleString('tr-TR')
                                      : ''}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* BÖLÜM 5: Kronolojik Aktivite Zaman Tüneli (Timeline) */}
                      <div
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '18px',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#0f172a',
                            marginBottom: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>🕒</span> Kronolojik Aktivite Akışı (Timeline)
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            position: 'relative',
                            paddingLeft: '14px',
                            borderLeft: '2px solid #e2e8f0',
                            marginLeft: '8px',
                          }}
                        >
                          {activeData.slice(0, 15).map((act, idx) => {
                            const isStart = act.activity_type === 'session_start'
                            const isEnd = act.activity_type === 'session_end'
                            const isDl = act.activity_type === 'download'

                            return (
                              <div key={idx} style={{position: 'relative'}}>
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: '-21px',
                                    top: '3px',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: isStart
                                      ? '#2563eb'
                                      : isEnd
                                        ? '#64748b'
                                        : isDl
                                          ? '#16a34a'
                                          : '#0891b2',
                                    border: '2px solid #ffffff',
                                  }}
                                />

                                <div style={{fontSize: '12px'}}>
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <span style={{fontWeight: 600, color: '#0f172a'}}>
                                      {isStart
                                        ? '🚀 Siteye Giriş Yaptı (Oturum Başladı)'
                                        : isEnd
                                          ? '🚪 Siteden Ayrıldı / Oturum Kapandı'
                                          : isDl
                                            ? `📥 Dosya İndirdi: ${act.download_file_name}`
                                            : `📄 Sayfa İnceledi: ${act.page_title || act.page_url}`}
                                    </span>

                                    <span style={{color: '#94a3b8', fontSize: '11px'}}>
                                      {act.created_at
                                        ? new Date(act.created_at).toLocaleTimeString('tr-TR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : ''}
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      color: '#64748b',
                                      fontSize: '11px',
                                      marginTop: '2px',
                                    }}
                                  >
                                    {act.platform && <span>Cihaz: {act.platform}</span>}
                                    {act.os && <span> • OS: {act.os}</span>}
                                    {act.browser && <span> • Tarayıcı: {act.browser}</span>}
                                    {act.city && (
                                      <span>
                                        {' '}
                                        • Konum: {act.city}, {act.country}
                                      </span>
                                    )}
                                    {act.duration_seconds > 0 && (
                                      <span style={{color: '#2563eb', fontWeight: 600}}>
                                        {' '}
                                        • Sayfada Geçirilen Süre: {act.duration_seconds} sn
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })()}
            </div>

            {/* Drawer Footer Actions */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                display: 'flex',
                gap: '10px',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{display: 'flex', gap: '8px'}}>
                <a
                  href={`mailto:${selectedMember.email}`}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>✉️</span> E-posta Yaz
                </a>

                {selectedMember.role === 'architect' && (
                  <>
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedMember.id, 'approved')
                        setSelectedMember((prev) =>
                          prev ? {...prev, architect_verification_status: 'approved'} : null,
                        )
                      }}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ✓ Mimarı Onayla
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedMember.id, 'rejected')
                        setSelectedMember((prev) =>
                          prev ? {...prev, architect_verification_status: 'rejected'} : null,
                        )
                      }}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ✕ Reddet
                    </button>
                  </>
                )}

                <button
                  onClick={() => copyVerificationLink(selectedMember)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fcd34d',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Doğrulama Linkini Kopyala"
                >
                  <span>🔗</span> Doğrulama Linki
                </button>

                <button
                  onClick={() =>
                    handleToggleEmailVerified(
                      selectedMember.id,
                      selectedMember.email,
                      selectedMember.is_verified,
                    )
                  }
                  style={{
                    padding: '8px 12px',
                    backgroundColor: selectedMember.is_verified ? '#f1f5f9' : '#dcfce7',
                    color: selectedMember.is_verified ? '#475569' : '#15803d',
                    border: selectedMember.is_verified ? '1px solid #cbd5e1' : '1px solid #86efac',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {selectedMember.is_verified
                    ? '○ E-posta Onayını Kaldır'
                    : '✓ E-postayı Manuel Doğrula'}
                </button>
              </div>

              <div style={{display: 'flex', gap: '8px'}}>
                <button
                  onClick={() => {
                    const idToDelete = selectedMember.id
                    const emailToDelete = selectedMember.email
                    setSelectedMember(null)
                    handleDeleteMember(idToDelete, emailToDelete)
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🗑️ Sil
                </button>

                <button
                  onClick={() => setSelectedMember(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
