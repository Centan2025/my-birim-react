import React, {useState, useMemo} from 'react'
import styled from 'styled-components'
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  CreditCard,
} from 'lucide-react'
import type {ControlCenterTimeRange} from './types'
import {useCommerceMetrics} from './hooks/useCommerceMetrics'
import {useRecentOrders} from './hooks/useRecentOrders'
import {useProductHealth} from './hooks/useProductHealth'
import {useProductPerformance} from './hooks/useProductPerformance'
import {DashboardHeader} from './components/DashboardHeader'
import {MetricCard, formatCurrencyAmount} from './components/MetricCard'
import {SalesTrend} from './components/SalesTrend'
import {RecentOrders} from './components/RecentOrders'
import {ProductHealthCard} from './components/ProductHealthCard'
import {ProductPerformance} from './components/ProductPerformance'
import {AuthBanner} from './components/AuthBanner'

const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
  padding: 2rem;
  box-sizing: border-box;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
`

const MaxWidthWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1280px) {
    grid-template-columns: repeat(6, 1fr);
  }
`

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: 3fr 2fr;
  }
`

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
`

export const ControlCenterTool: React.FC = () => {
  const [range, setRange] = useState<ControlCenterTimeRange>('30d')
  const [currency, setCurrency] = useState<string>('TRY')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const {
    data: metricsData,
    loading: metricsLoading,
    error: metricsError,
    isUnauthorized,
    refetch: refetchMetrics,
  } = useCommerceMetrics(range)

  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useRecentOrders(6)

  const {
    counts: healthCounts,
    loading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useProductHealth()

  const {
    data: perfData,
    loading: perfLoading,
    error: perfError,
    refetch: refetchPerf,
  } = useProductPerformance(range, currency)

  const availableCurrencies = useMemo(() => {
    if (!metricsData?.metrics) return ['TRY', 'EUR', 'USD']
    const keys = Object.keys(metricsData.metrics)
    return keys.length > 0 ? keys : ['TRY', 'EUR', 'USD']
  }, [metricsData])

  // Current selected currency metrics
  const activeCurrencyMetrics = useMemo(() => {
    if (!metricsData?.metrics) return null
    return metricsData.metrics[currency.toUpperCase()] || null
  }, [metricsData, currency])

  const handleRefreshAll = () => {
    refetchMetrics()
    refetchOrders()
    refetchHealth()
    refetchPerf()
    setLastUpdated(new Date())
  }

  const isLoading = metricsLoading || ordersLoading || healthLoading || perfLoading

  // Formatted Metric Values
  const netSalesFormatted = formatCurrencyAmount(activeCurrencyMetrics?.netSales || 0, currency)
  const grossSalesFormatted = formatCurrencyAmount(activeCurrencyMetrics?.grossSales || 0, currency)
  const aovFormatted = formatCurrencyAmount(activeCurrencyMetrics?.averageOrderValue || 0, currency)
  const refundFormatted = formatCurrencyAmount(activeCurrencyMetrics?.refundTotal || 0, currency)
  const paidOrdersCount = activeCurrencyMetrics?.paidOrdersCount || 0
  const pendingPaymentsCount = activeCurrencyMetrics?.pendingPaymentsCount || 0

  return (
    <Container>
      <MaxWidthWrapper>
        <DashboardHeader
          range={range}
          onRangeChange={(newRange) => setRange(newRange)}
          currency={currency}
          availableCurrencies={availableCurrencies}
          onCurrencyChange={(newCurr) => setCurrency(newCurr)}
          onRefresh={handleRefreshAll}
          isLoading={isLoading}
          lastUpdated={lastUpdated}
        />

        {isUnauthorized && <AuthBanner onRetry={handleRefreshAll} />}

        {/* Top 6 KPI Metric Cards */}
        <MetricsGrid>
          <MetricCard
            title="Net Satış"
            value={netSalesFormatted}
            variant="default"
            icon={<TrendingUp size={16} />}
            caption={`${range} dönemi net ciro`}
          />
          <MetricCard
            title="Brüt Satış"
            value={grossSalesFormatted}
            variant="default"
            icon={<CreditCard size={16} />}
            caption="İadeler öncesi toplam"
          />
          <MetricCard
            title="Ödenen Sipariş"
            value={paidOrdersCount}
            variant="success"
            icon={<CheckCircle2 size={16} />}
            caption="Tamamlanan sipariş adedi"
          />
          <MetricCard
            title="Ortalama Sepet (AOV)"
            value={aovFormatted}
            variant="default"
            icon={<ShoppingBag size={16} />}
            caption="Sipariş başına ortalama"
          />
          <MetricCard
            title="Toplam İade"
            value={refundFormatted}
            variant={
              refundFormatted !== '₺0,00' &&
              refundFormatted !== '$0.00' &&
              refundFormatted !== '€0,00'
                ? 'alert'
                : 'default'
            }
            icon={<RotateCcw size={16} />}
            caption="İade edilen tutar"
          />
          <MetricCard
            title="Bekleyen Havale"
            value={pendingPaymentsCount}
            variant={pendingPaymentsCount > 0 ? 'warning' : 'default'}
            icon={<Clock size={16} />}
            caption="Onay bekleyen ödemeler"
          />
        </MetricsGrid>

        {/* Center Grid: Daily Sales Chart + Product Health Card */}
        <MainGrid>
          <SalesTrend daily={metricsData?.daily || []} currency={currency} range={range} />
          <ProductHealthCard
            counts={healthCounts}
            loading={healthLoading}
            error={healthError}
            onRefresh={refetchHealth}
          />
        </MainGrid>

        {/* Product Performance & Funnel Analysis */}
        <ProductPerformance
          products={perfData?.products || []}
          funnel={perfData?.funnel}
          currency={currency}
          range={range}
          loading={perfLoading}
          error={perfError}
          onRefresh={refetchPerf}
        />

        {/* Bottom Grid: Recent Orders */}
        <BottomGrid>
          <RecentOrders orders={orders} loading={ordersLoading} error={ordersError} />
        </BottomGrid>
      </MaxWidthWrapper>
    </Container>
  )
}
