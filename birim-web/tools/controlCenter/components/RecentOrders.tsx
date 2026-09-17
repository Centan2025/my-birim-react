import React from 'react'
import styled from 'styled-components'
import {ShoppingBag, ExternalLink, AlertCircle} from 'lucide-react'
import type {OrderSummaryItem} from '../types'
import {formatCurrencyAmount} from './MetricCard'

interface RecentOrdersProps {
  orders: OrderSummaryItem[]
  loading: boolean
  error: string | null
}

const OrdersCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`

const Subtitle = styled.span`
  font-size: 0.75rem;
  color: #64748b;
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

const Th = styled.th`
  padding: 0.6rem 0.75rem;
  color: #64748b;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
`

const Td = styled.td`
  padding: 0.75rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
`

const Tr = styled.tr`
  &:hover {
    background: #f8fafc;
  }
`

const OrderNumber = styled.span`
  font-family: monospace;
  font-weight: 600;
  color: #0f172a;
`

const StatusBadge = styled.span<{$status: string}>`
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  text-transform: capitalize;

  ${(props) => {
    switch (props.$status?.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'delivered':
        return `
          background: #dcfce7;
          color: #166534;
        `
      case 'processing':
      case 'shipped':
        return `
          background: #e0e7ff;
          color: #3730a3;
        `
      case 'pending':
      case 'pending_payment':
        return `
          background: #fef3c7;
          color: #92400e;
        `
      case 'cancelled':
      case 'failed':
        return `
          background: #fee2e2;
          color: #991b1b;
        `
      case 'refunded':
      case 'partially_refunded':
        return `
          background: #f1f5f9;
          color: #475569;
        `
      default:
        return `
          background: #f1f5f9;
          color: #475569;
        `
    }
  }}
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
  color: #94a3b8;
  gap: 0.5rem;
  font-size: 0.875rem;
`

function formatOrderDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({orders, loading, error}) => {
  return (
    <OrdersCard>
      <HeaderRow>
        <TitleGroup>
          <ShoppingBag size={18} color="#0f172a" />
          <Title>Son Siparişler</Title>
          <Subtitle>(Zero-PII)</Subtitle>
        </TitleGroup>
      </HeaderRow>

      {error ? (
        <EmptyState>
          <AlertCircle size={20} color="#f59e0b" />
          <span>{error}</span>
        </EmptyState>
      ) : orders.length === 0 ? (
        <EmptyState>
          <ShoppingBag size={24} />
          <span>{loading ? 'Siparişler yükleniyor...' : 'Henüz kayıtlı sipariş bulunmuyor.'}</span>
        </EmptyState>
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Sipariş No</Th>
                <Th>Tarih</Th>
                <Th>Kalem</Th>
                <Th>Tutar</Th>
                <Th>Sipariş Durumu</Th>
                <Th>Ödeme Durumu</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <Tr key={ord.id}>
                  <Td>
                    <OrderNumber>{ord.orderNumber}</OrderNumber>
                  </Td>
                  <Td>{formatOrderDate(ord.createdAt)}</Td>
                  <Td>{ord.itemsCount} ürün</Td>
                  <Td style={{fontWeight: 600}}>
                    {formatCurrencyAmount(ord.grandTotal, ord.currency)}
                  </Td>
                  <Td>
                    <StatusBadge $status={ord.status}>{ord.status}</StatusBadge>
                  </Td>
                  <Td>
                    <StatusBadge $status={ord.paymentStatus}>{ord.paymentStatus}</StatusBadge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      )}
    </OrdersCard>
  )
}
