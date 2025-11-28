import {useState} from 'react'
import {useClient} from 'sanity'
import * as XLSX from 'xlsx'
import styled from 'styled-components'

const Container = styled.div`
  padding: 2rem;
  max-width: 960px;
  margin: 0 auto;
`

const Card = styled.div`
  background: #ffffff;
  border-radius: 8px;
  box-shadow:
    0 10px 30px rgba(15, 23, 42, 0.12),
    0 1px 3px rgba(15, 23, 42, 0.08);
  padding: 1.75rem 2rem;
`

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #111827;
`

const Subtitle = styled.p`
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
  color: #4b5563;
`

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-top: 1rem;
`

const PrimaryButton = styled.button`
  background: #111827;
  color: #ffffff;
  border: none;
  padding: 0.7rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;

  &:hover:not(:disabled) {
    background: #020617;
  }

  &:disabled {
    background: #6b7280;
    cursor: wait;
  }
`

const GhostButton = styled.button`
  background: transparent;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.55rem 1rem;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }
`

const InfoText = styled.p`
  margin: 0.75rem 0 0 0;
  font-size: 0.8rem;
  color: #6b7280;
`

const StatusText = styled.p<{isError?: boolean}>`
  margin: 1rem 0 0 0;
  font-size: 0.85rem;
  color: ${(props) => (props.isError ? '#b91c1c' : '#065f46')};
`

interface User {
  _id: string
  email: string
  name?: string
  company?: string
  profession?: string
  country?: string
  userType?: 'email_subscriber' | 'full_member'
  isVerified?: boolean
  isActive?: boolean
  createdAt?: string
}

export function EmailExportTool() {
  const client = useClient({apiVersion: '2025-01-01'})
  const [isExporting, setIsExporting] = useState(false)
  const [status, setStatus] = useState<{message: string; isError?: boolean} | null>(null)
  const [lastCount, setLastCount] = useState<number | null>(null)

  const fetchAllUsers = async (): Promise<User[]> => {
    const query = `*[_type == "user"]{
      _id,
      email,
      name,
      company,
      profession,
      country,
      userType,
      isVerified,
      isActive,
      createdAt
    } | order(createdAt desc)`

    return client.fetch(query)
  }

  const exportToExcel = async () => {
    setIsExporting(true)
    setStatus(null)

    try {
      const users = await fetchAllUsers()
      setLastCount(users.length)

      if (!users.length) {
        setStatus({message: 'Kayıtlı üye bulunamadı.', isError: true})
        return
      }

      const rows = users.map((u, index) => ({
        '#': index + 1,
        Email: u.email,
        'Üyelik Tipi': u.userType === 'full_member' ? 'Tam Üye' : 'E-posta Abonesi',
        'Ad Soyad': u.name || '',
        Firma: u.company || '',
        Meslek: u.profession || '',
        Ülke: u.country || '',
        'Doğrulandı mı?': u.isVerified ? 'Evet' : 'Hayır',
        'Aktif mi?': u.isActive === false ? 'Hayır' : 'Evet',
        'Kayıt Tarihi': u.createdAt ? new Date(u.createdAt).toLocaleString('tr-TR') : '',
      }))

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tüm Üyeler')

      const wbout = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'})
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `birim-tum-uyeler-${timestamp}.xlsx`

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      const emailSubscribers = users.filter((u) => u.userType === 'email_subscriber').length
      const fullMembers = users.filter((u) => u.userType === 'full_member').length

      setStatus({
        message: `Excel dosyası oluşturuldu ve indirildi. Toplam üye: ${users.length} (E-posta Abonesi: ${emailSubscribers}, Tam Üye: ${fullMembers})`,
        isError: false,
      })
    } catch (error: any) {
      console.error('User export error', error)
      setStatus({
        message: `Üyeler dışa aktarılırken bir hata oluştu: ${error.message || String(error)}`,
        isError: true,
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleCountOnly = async () => {
    setIsExporting(true)
    setStatus(null)
    try {
      const users = await fetchAllUsers()
      setLastCount(users.length)
      const emailSubscribers = users.filter((u) => u.userType === 'email_subscriber').length
      const fullMembers = users.filter((u) => u.userType === 'full_member').length
      setStatus({
        message: `Toplam kayıtlı üye: ${users.length} (E-posta Abonesi: ${emailSubscribers}, Tam Üye: ${fullMembers})`,
        isError: false,
      })
    } catch (error: any) {
      setStatus({
        message: `Üye sayısı alınırken hata oluştu: ${error.message || String(error)}`,
        isError: true,
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Container>
      <Card>
        <Title>Tüm Üyeleri Dışa Aktar</Title>
        <Subtitle>
          Bu araç, CMS&apos;te kayıtlı <strong>tüm üyeleri</strong> (E-posta Aboneleri ve Tam
          Üyeler) tek tıklamayla Excel dosyası olarak indirmenizi sağlar. Dosya; e-posta, üyelik
          tipi, ad soyad, firma, meslek, ülke, doğrulama ve kayıt tarihi bilgilerini içerir.
        </Subtitle>

        <ButtonRow>
          <PrimaryButton onClick={exportToExcel} disabled={isExporting}>
            {isExporting ? 'Hazırlanıyor...' : 'Excel Olarak İndir'}
          </PrimaryButton>
          <GhostButton onClick={handleCountOnly} disabled={isExporting}>
            Toplam üye sayısını göster
          </GhostButton>
          {lastCount !== null && <InfoText>Son sorgulanan toplam üye sayısı: {lastCount}</InfoText>}
        </ButtonRow>

        <InfoText>
          Not: Tüm üyeler (hem <strong>E-posta Aboneleri</strong> hem de <strong>Tam Üyeler</strong>
          ) Excel dosyasına dahil edilir. Üyelik tipi bilgisi &quot;Üyelik Tipi&quot; kolonunda
          gösterilir.
        </InfoText>

        {status && <StatusText isError={status.isError}>{status.message}</StatusText>}
      </Card>
    </Container>
  )
}
