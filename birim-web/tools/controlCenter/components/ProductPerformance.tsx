import React, {useState, useMemo} from 'react'
import styled from 'styled-components'
import {
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Info,
  Layers,
  ArrowUpDown,
} from 'lucide-react'
import type {ProductPerformanceItem, FunnelSummary} from '../types'
import {formatCurrencyAmount} from './MetricCard'

interface ProductPerformanceProps {
  products: ProductPerformanceItem[]
  funnel?: FunnelSummary
  currency: string
  range: string
  loading: boolean
  error: string | null
  onRefresh?: () => void
}

type SortField =
  | 'grossRevenue'
  | 'views'
  | 'addToBagCount'
  | 'paidOrders'
  | 'unitsSold'
  | 'viewToBagRate'
  | 'bagToPurchaseRate'

const Card = styled.div`
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const HeaderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`

const Title = styled.h3`
  font-size: 1.0625rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`

const Subtitle = styled.span`
  font-size: 0.75rem;
  color: #64748b;
`

const FunnelContainer = styled.div`
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 6px;
  padding: 1.125rem 1.25rem;
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`

const FunnelStep = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`

const StepLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #475569;
`

const StepValue = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
`

const StepSubtext = styled.div`
  font-size: 0.6875rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`

const TableWrapper = styled.div`
  overflow-x: auto;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  text-align: left;
`

const Th = styled.th<{sortable?: boolean}>`
  padding: 0.625rem 0.75rem;
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  cursor: ${(props) => (props.sortable ? 'pointer' : 'default')};
  user-select: none;

  &:hover {
    ${(props) => (props.sortable ? 'background: #f1f5f9;' : '')}
  }
`

const Td = styled.td`
  padding: 0.75rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  vertical-align: middle;
`

const Tr = styled.tr`
  &:hover {
    background: #fbfcfe;
  }
`

const ProductName = styled.div`
  font-weight: 600;
  color: #0f172a;
`

const ProductSlug = styled.div`
  font-size: 0.6875rem;
  color: #64748b;
`

const RateBadge = styled.span<{positive?: boolean}>`
  display: inline-block;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  background: ${(props) => (props.positive ? '#ecfdf5' : '#f8fafc')};
  color: ${(props) => (props.positive ? '#059669' : '#64748b')};
  border: 1px solid ${(props) => (props.positive ? '#a7f3d0' : '#e2e8f0')};
`

const Disclaimer = styled.div`
  font-size: 0.6875rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #e2e8f0;
`

export const ProductPerformance: React.FC<ProductPerformanceProps> = ({
  products,
  funnel,
  currency,
  range,
  loading,
  error,
}) => {
  const [sortField, setSortField] = useState<SortField>('grossRevenue')
  const [sortAsc, setSortAsc] = useState<boolean>(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const valA = a[sortField] || 0
      const valB = b[sortField] || 0
      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }, [products, sortField, sortAsc])

  const totalViews = funnel?.views || products.reduce((acc, p) => acc + p.views, 0)
  const totalAddToBags = funnel?.addToBags || products.reduce((acc, p) => acc + p.addToBagCount, 0)
  const totalCheckoutStarts = funnel?.checkoutStarts || 0
  const totalPaidOrders = funnel?.paidOrders || products.reduce((acc, p) => acc + p.paidOrders, 0)

  const viewToBagFunnelRate =
    totalViews > 0 ? Number(((totalAddToBags / totalViews) * 100).toFixed(1)) : 0
  const bagToCheckoutRate =
    totalAddToBags > 0 ? Number(((totalCheckoutStarts / totalAddToBags) * 100).toFixed(1)) : 0
  const checkoutToPurchaseRate =
    totalCheckoutStarts > 0 ? Number(((totalPaidOrders / totalCheckoutStarts) * 100).toFixed(1)) : 0
  const overallRate =
    funnel?.overallConversionRate ??
    (totalViews > 0 ? Number(((totalPaidOrders / totalViews) * 100).toFixed(2)) : 0)

  return (
    <Card>
      <HeaderRow>
        <TitleGroup>
          <Layers size={18} color="#0f172a" />
          <div>
            <Title>Ürün Performansı & Dönüşüm Hunisi</Title>
            <Subtitle>
              {range} dönemi etkileşim ve satış analizi ({currency})
            </Subtitle>
          </div>
        </TitleGroup>
      </HeaderRow>

      {/* Funnel Overview Cards */}
      <FunnelContainer>
        <FunnelStep>
          <StepLabelRow>
            <Eye size={14} color="#64748b" />
            1. Ürün Görüntüleme
          </StepLabelRow>
          <StepValue>{totalViews.toLocaleString()}</StepValue>
          <StepSubtext>Katalog & PDP tekil gösterim</StepSubtext>
        </FunnelStep>

        <FunnelStep>
          <StepLabelRow>
            <ShoppingBag size={14} color="#64748b" />
            2. Sepete Ekleme
          </StepLabelRow>
          <StepValue>{totalAddToBags.toLocaleString()}</StepValue>
          <StepSubtext>
            <ArrowRight size={10} /> {viewToBagFunnelRate}% görüntülemeden sepete
          </StepSubtext>
        </FunnelStep>

        <FunnelStep>
          <StepLabelRow>
            <CreditCard size={14} color="#64748b" />
            3. Ödeme Başlatma
          </StepLabelRow>
          <StepValue>{totalCheckoutStarts.toLocaleString()}</StepValue>
          <StepSubtext>
            <ArrowRight size={10} /> {bagToCheckoutRate}% sepetten ödemeye
          </StepSubtext>
        </FunnelStep>

        <FunnelStep>
          <StepLabelRow>
            <CheckCircle2 size={14} color="#059669" />
            4. Onaylanan Sipariş
          </StepLabelRow>
          <StepValue style={{color: '#059669'}}>{totalPaidOrders.toLocaleString()}</StepValue>
          <StepSubtext>
            Toplam Dönüşüm:{' '}
            <strong style={{color: '#059669', marginLeft: 2}}>{overallRate}%</strong>
          </StepSubtext>
        </FunnelStep>
      </FunnelContainer>

      {/* Product Table */}
      {loading ? (
        <div style={{padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem'}}>
          Ürün performans verileri hesaplanıyor...
        </div>
      ) : error ? (
        <div
          style={{
            padding: '1.5rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '0.8125rem',
          }}
        >
          {error}
        </div>
      ) : products.length === 0 ? (
        <div
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: '6px',
            border: '1px dashed #cbd5e1',
          }}
        >
          <p style={{margin: 0, fontWeight: 600, color: '#334155', fontSize: '0.875rem'}}>
            Bu zaman aralığında ({range}) henüz ürün etkileşim veya satış kaydı bulunmuyor.
          </p>
          <p
            style={{marginTop: '0.375rem', marginBottom: 0, color: '#64748b', fontSize: '0.75rem'}}
          >
            Ziyaretçiler BİRİM SHOP ürünlerini inceleyip sepete ekledikçe performans metrikleri
            burada listelenecektir.
          </p>
        </div>
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Ürün</Th>
                <Th sortable onClick={() => handleSort('views')}>
                  Görüntüleme{' '}
                  {sortField === 'views' && (
                    <ArrowUpDown size={10} style={{verticalAlign: 'middle'}} />
                  )}
                </Th>
                <Th sortable onClick={() => handleSort('addToBagCount')}>
                  Sepete Ekleme{' '}
                  {sortField === 'addToBagCount' && (
                    <ArrowUpDown size={10} style={{verticalAlign: 'middle'}} />
                  )}
                </Th>
                <Th sortable onClick={() => handleSort('viewToBagRate')}>
                  Görüntüle → Sepet{' '}
                  {sortField === 'viewToBagRate' && (
                    <ArrowUpDown size={10} style={{verticalAlign: 'middle'}} />
                  )}
                </Th>
                <Th sortable onClick={() => handleSort('paidOrders')}>
                  Sipariş Adedi{' '}
                  {sortField === 'paidOrders' && (
                    <ArrowUpDown size={10} style={{verticalAlign: 'middle'}} />
                  )}
                </Th>
                <Th sortable onClick={() => handleSort('unitsSold')}>
                  Satılan Adet{' '}
                  {sortField === 'unitsSold' && (
                    <ArrowUpDown size={10} style={{verticalAlign: 'middle'}} />
                  )}
                </Th>
                <Th sortable onClick={() => handleSort('grossRevenue')}>
                  Brüt Satış{' '}
                  {sortField === 'grossRevenue' && (
                    <ArrowUpDown size={10} style={{verticalAlign: 'middle'}} />
                  )}
                </Th>
                <Th sortable onClick={() => handleSort('bagToPurchaseRate')}>
                  Sepet → Satış{' '}
                  {sortField === 'bagToPurchaseRate' && (
                    <ArrowUpDown size={10} style={{verticalAlign: 'middle'}} />
                  )}
                </Th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((p) => (
                <Tr key={p.productId}>
                  <Td>
                    <ProductName>{p.productName}</ProductName>
                    <ProductSlug>{p.slug || p.productId}</ProductSlug>
                  </Td>
                  <Td>{p.views.toLocaleString()}</Td>
                  <Td>{p.addToBagCount.toLocaleString()}</Td>
                  <Td>
                    <RateBadge positive={p.viewToBagRate > 0}>
                      %{p.viewToBagRate.toFixed(1)}
                    </RateBadge>
                  </Td>
                  <Td>{p.paidOrders}</Td>
                  <Td>{p.unitsSold}</Td>
                  <Td style={{fontWeight: 600}}>
                    {formatCurrencyAmount(p.grossRevenue, p.currency || currency)}
                  </Td>
                  <Td>
                    <RateBadge positive={p.bagToPurchaseRate > 0}>
                      %{p.bagToPurchaseRate.toFixed(1)}
                    </RateBadge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      )}

      <Disclaimer>
        <Info size={13} color="#94a3b8" />
        Sipariş, adet ve ciro metrikleri authoritative commerce veritabanından (onaylanmış
        siparişler) üretilmektedir. İadeler sipariş düzeyinde yönetilir.
      </Disclaimer>
    </Card>
  )
}
