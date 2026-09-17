import React from 'react'
import styled from 'styled-components'
import {ShieldAlert, LogIn, RefreshCw} from 'lucide-react'

interface AuthBannerProps {
  onRetry?: () => void
}

const BannerWrapper = styled.div`
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-left: 4px solid #dc2626;
  border-radius: 6px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`

const LeftGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
`

const TextGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const Title = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #991b1b;
`

const Description = styled.span`
  font-size: 0.8125rem;
  color: #7f1d1d;
  line-height: 1.4;
`

const SecondaryNote = styled.span`
  font-size: 0.75rem;
  color: #991b1b;
  font-style: italic;
`

const ActionsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`

const LoginLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  background: #0f172a;
  color: #ffffff;
  border-radius: 4px;
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: #1e293b;
  }
`

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.75rem;
  background: #ffffff;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 4px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #fee2e2;
    border-color: #f87171;
  }
`

export const AuthBanner: React.FC<AuthBannerProps> = ({onRetry}) => {
  return (
    <BannerWrapper>
      <LeftGroup>
        <ShieldAlert size={20} color="#dc2626" style={{marginTop: 2, flexShrink: 0}} />
        <TextGroup>
          <Title>Admin Access Required</Title>
          <Description>
            Commerce data is available only to authorized BİRİM administrators.
          </Description>
          <SecondaryNote>Product Health remains available from Sanity.</SecondaryNote>
        </TextGroup>
      </LeftGroup>

      <ActionsGroup>
        {onRetry && (
          <RetryButton onClick={onRetry} title="Yeniden Dene">
            <RefreshCw size={13} />
            <span>Yeniden Dene</span>
          </RetryButton>
        )}
        <LoginLink href="/admin/login" target="_blank" rel="noopener noreferrer">
          <LogIn size={13} />
          <span>Open Admin Login</span>
        </LoginLink>
      </ActionsGroup>
    </BannerWrapper>
  )
}
