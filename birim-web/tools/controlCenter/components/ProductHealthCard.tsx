import React from 'react'
import styled from 'styled-components'
import {CheckCircle2, AlertTriangle, Package, ExternalLink, RefreshCw} from 'lucide-react'
import type {ProductHealthCounts} from '../types'

interface ProductHealthCardProps {
  counts: ProductHealthCounts
  loading: boolean
  error: string | null
  onRefresh?: () => void
}

const HealthCard = styled.div`
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
  }
`

const StatItem = styled.div<{$bg?: string; $border?: string}>`
  padding: 0.85rem;
  border-radius: 6px;
  background: ${(props) => props.$bg || '#f8fafc'};
  border: 1px solid ${(props) => props.$border || '#e2e8f0'};
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const StatLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
`

const StatValue = styled.span<{$color?: string}>`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => props.$color || '#0f172a'};
`

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
  display: flex;
  margin: 0.25rem 0;
`

const ProgressSegment = styled.div<{$pct: number; $color: string}>`
  width: ${(props) => props.$pct}%;
  background: ${(props) => props.$color};
  height: 100%;
  transition: width 0.3s ease;
`

const AttentionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const AttentionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const AttentionTitle = styled.h4`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #b45309;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
`

const AttentionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 240px;
  overflow-y: auto;
`

const AttentionItem = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: #fef3c7;
    border-color: #fde68a;
  }
`

const ItemLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  overflow: hidden;
`

const ItemName = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #92400e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ItemIssue = styled.span`
  font-size: 0.7rem;
  color: #b45309;
`

export const ProductHealthCard: React.FC<ProductHealthCardProps> = ({
  counts,
  loading,
  error,
  onRefresh,
}) => {
  const total = counts.totalCount || 1
  const readyPct = Math.round((counts.readyCount / total) * 100)
  const attentionPct = Math.round((counts.needsAttentionCount / total) * 100)

  return (
    <HealthCard>
      <HeaderRow>
        <TitleGroup>
          <Package size={18} color="#0f172a" />
          <Title>Ürün & Envanter Sağlığı</Title>
          <Subtitle>({counts.totalCount} Toplam Ürün)</Subtitle>
        </TitleGroup>
      </HeaderRow>

      {/* Progress Bar */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            marginBottom: '0.35rem',
          }}
        >
          <span style={{color: '#166534', fontWeight: 600}}>
            %{readyPct} Satışa Hazır ({counts.readyCount})
          </span>
          <span style={{color: '#92400e', fontWeight: 600}}>
            %{attentionPct} İnceleme Gereken ({counts.needsAttentionCount})
          </span>
        </div>
        <ProgressBarContainer>
          <ProgressSegment $pct={readyPct} $color="#10b981" />
          <ProgressSegment $pct={attentionPct} $color="#f59e0b" />
        </ProgressBarContainer>
      </div>

      {/* Stats Grid */}
      <StatsGrid>
        <StatItem $bg="#ecfdf5" $border="#d1fae5">
          <StatLabel>Satışa Hazır</StatLabel>
          <StatValue $color="#059669">{counts.readyCount}</StatValue>
        </StatItem>
        <StatItem $bg="#fffbeb" $border="#fef3c7">
          <StatLabel>İnceleme Gereken</StatLabel>
          <StatValue $color="#d97706">{counts.needsAttentionCount}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Stokta</StatLabel>
          <StatValue>{counts.inStockCount}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Ön Sipariş</StatLabel>
          <StatValue>{counts.preorderCount}</StatValue>
        </StatItem>
      </StatsGrid>

      {/* Needs Attention Items */}
      {counts.needsAttentionItems.length > 0 && (
        <AttentionSection>
          <AttentionHeader>
            <AttentionTitle>
              <AlertTriangle size={14} />
              İnceleme Bekleyen Ürünler ({counts.needsAttentionItems.length})
            </AttentionTitle>
          </AttentionHeader>

          <AttentionList>
            {counts.needsAttentionItems.map((item) => {
              const trName =
                typeof item.name === 'object'
                  ? item.name?.tr || item.name?.en || 'İsimsiz'
                  : item.name || 'İsimsiz'

              const docUrl = `/structure/products;${item._id}`

              return (
                <AttentionItem
                  key={item._id}
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ItemLeft>
                    <ItemName>{trName}</ItemName>
                    <ItemIssue>{item.issue}</ItemIssue>
                  </ItemLeft>
                  <ExternalLink size={14} color="#92400e" style={{flexShrink: 0}} />
                </AttentionItem>
              )
            })}
          </AttentionList>
        </AttentionSection>
      )}
    </HealthCard>
  )
}
