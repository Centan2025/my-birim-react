import React, {useState} from 'react'
import styled from 'styled-components'
import {RefreshCw, Shield, Clock, Coins} from 'lucide-react'
import type {ControlCenterTimeRange} from '../types'

interface DashboardHeaderProps {
  range: ControlCenterTimeRange
  onRangeChange: (range: ControlCenterTimeRange) => void
  currency: string
  availableCurrencies: string[]
  onCurrencyChange: (currency: string) => void
  onRefresh: () => void
  isLoading: boolean
  lastUpdated: Date | null
}

const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1.5rem;

  @media (min-width: 1024px) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
`

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const Title = styled.h1`
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin: 0;
`

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
`

const Badge = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
`

const ControlsSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
`

const ButtonGroup = styled.div`
  display: inline-flex;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
`

const RangeButton = styled.button<{$active: boolean}>`
  background: ${(props) => (props.$active ? '#ffffff' : 'transparent')};
  color: ${(props) => (props.$active ? '#0f172a' : '#64748b')};
  font-weight: ${(props) => (props.$active ? '600' : '500')};
  border: none;
  border-radius: 4px;
  padding: 0.35rem 0.75rem;
  font-size: 0.8125rem;
  cursor: pointer;
  box-shadow: ${(props) => (props.$active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none')};
  transition: all 0.15s ease-in-out;

  &:hover {
    color: #0f172a;
  }
`

const CurrencySelectWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  gap: 0.35rem;
`

const CurrencySelect = styled.select`
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  outline: none;
`

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #0f172a;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const SpinningRefresh = styled(RefreshCw)<{$spinning: boolean}>`
  animation: ${(props) => (props.$spinning ? 'spin 1s linear infinite' : 'none')};

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`

const LastUpdateText = styled.span`
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`

const rangeOptions: {key: ControlCenterTimeRange; label: string}[] = [
  {key: 'today', label: 'Bugün'},
  {key: '7d', label: '7 Gün'},
  {key: '30d', label: '30 Gün'},
  {key: '90d', label: '90 Gün'},
]

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  range,
  onRangeChange,
  currency,
  availableCurrencies,
  onCurrencyChange,
  onRefresh,
  isLoading,
  lastUpdated,
}) => {
  const currencies = availableCurrencies.length > 0 ? availableCurrencies : ['TRY', 'EUR', 'USD']

  return (
    <HeaderWrapper>
      <TitleSection>
        <TitleRow>
          <Title>BİRİM Control Center</Title>
          <Badge>Live Overview</Badge>
        </TitleRow>
        <Subtitle>Ticari Performans, Satış Trendleri ve Ürün Hazırlık Yönetimi</Subtitle>
      </TitleSection>

      <ControlsSection>
        {lastUpdated && (
          <LastUpdateText>
            <Clock size={12} />
            {lastUpdated.toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </LastUpdateText>
        )}

        <ButtonGroup>
          {rangeOptions.map((opt) => (
            <RangeButton
              key={opt.key}
              $active={range === opt.key}
              onClick={() => onRangeChange(opt.key)}
            >
              {opt.label}
            </RangeButton>
          ))}
        </ButtonGroup>

        <CurrencySelectWrapper>
          <Coins size={14} color="#64748b" />
          <CurrencySelect
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            aria-label="Para Birimi Seçimi"
          >
            {currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </CurrencySelect>
        </CurrencySelectWrapper>

        <ActionButton onClick={onRefresh} disabled={isLoading} title="Verileri Yenile">
          <SpinningRefresh size={14} $spinning={isLoading} />
          <span>Yenile</span>
        </ActionButton>
      </ControlsSection>
    </HeaderWrapper>
  )
}
