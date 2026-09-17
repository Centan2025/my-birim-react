import React from 'react'
import styled from 'styled-components'

interface MetricCardProps {
  title: string
  value: string | number
  subValue?: string
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'alert'
  caption?: string
  badge?: string
}

const CardWrapper = styled.div<{$variant: string}>`
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    border-color: #cbd5e1;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${(props) => {
      switch (props.$variant) {
        case 'success':
          return '#10b981'
        case 'warning':
          return '#f59e0b'
        case 'alert':
          return '#ef4444'
        default:
          return '#0f172a'
      }
    }};
  }
`

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`

const Title = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const IconContainer = styled.div<{$variant: string}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: ${(props) => {
    switch (props.$variant) {
      case 'success':
        return '#ecfdf5'
      case 'warning':
        return '#fffbeb'
      case 'alert':
        return '#fef2f2'
      default:
        return '#f8fafc'
    }
  }};
  color: ${(props) => {
    switch (props.$variant) {
      case 'success':
        return '#059669'
      case 'warning':
        return '#d97706'
      case 'alert':
        return '#dc2626'
      default:
        return '#334155'
    }
  }};
`

const Value = styled.div`
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
  line-height: 1.2;
`

const CardBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
`

const Caption = styled.span`
  font-size: 0.75rem;
  color: #64748b;
`

const BadgeText = styled.span<{$variant: string}>`
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: ${(props) => {
    switch (props.$variant) {
      case 'success':
        return '#dcfce7'
      case 'warning':
        return '#fef3c7'
      case 'alert':
        return '#fee2e2'
      default:
        return '#f1f5f9'
    }
  }};
  color: ${(props) => {
    switch (props.$variant) {
      case 'success':
        return '#166534'
      case 'warning':
        return '#92400e'
      case 'alert':
        return '#991b1b'
      default:
        return '#475569'
    }
  }};
`

export function formatCurrencyAmount(amount: number, currency: string = 'TRY'): string {
  const symbolMap: Record<string, string> = {
    TRY: '₺',
    EUR: '€',
    USD: '$',
    GBP: '£',
  }
  const symbol = symbolMap[currency.toUpperCase()] || currency
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)

  return `${symbol}${formatted}`
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  icon,
  variant = 'default',
  caption,
  badge,
}) => {
  return (
    <CardWrapper $variant={variant}>
      <div>
        <CardTop>
          <Title>{title}</Title>
          {icon && <IconContainer $variant={variant}>{icon}</IconContainer>}
        </CardTop>
        <Value>{value}</Value>
        {subValue && <Caption style={{marginTop: '0.25rem', display: 'block'}}>{subValue}</Caption>}
      </div>
      {(caption || badge) && (
        <CardBottom>
          {caption && <Caption>{caption}</Caption>}
          {badge && <BadgeText $variant={variant}>{badge}</BadgeText>}
        </CardBottom>
      )}
    </CardWrapper>
  )
}
