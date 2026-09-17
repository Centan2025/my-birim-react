import React, {useState, useMemo} from 'react'
import styled from 'styled-components'
import {TrendingUp, BarChart2} from 'lucide-react'
import type {DailyPoint} from '../types'
import {formatCurrencyAmount} from './MetricCard'

interface SalesTrendProps {
  daily: DailyPoint[]
  currency: string
  range: string
}

const TrendCard = styled.div`
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

const ChartContainer = styled.div`
  width: 100%;
  height: 240px;
  position: relative;
`

const SvgWrapper = styled.svg`
  width: 100%;
  height: 100%;
  overflow: visible;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #94a3b8;
  gap: 0.5rem;
  font-size: 0.875rem;
`

const TooltipBox = styled.div<{left: number; top: number}>`
  position: absolute;
  left: ${(props) => props.left}px;
  top: ${(props) => props.top}px;
  transform: translate(-50%, -100%);
  margin-top: -10px;
  background: #0f172a;
  color: #ffffff;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  pointer-events: none;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  z-index: 10;
  white-space: nowrap;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #0f172a transparent transparent transparent;
  }
`

const TooltipDate = styled.div`
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 0.25rem;
  font-size: 0.7rem;
`

const TooltipRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: #64748b;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`

const LegendDot = styled.span<{color: string}>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => props.color};
`

export const SalesTrend: React.FC<SalesTrendProps> = ({daily, currency, range}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: DailyPoint
    x: number
    y: number
  } | null>(null)

  const filteredDaily = useMemo(() => {
    return (daily || []).filter((d) => d.currency.toUpperCase() === currency.toUpperCase())
  }, [daily, currency])

  const maxNetSales = useMemo(() => {
    if (filteredDaily.length === 0) return 0
    return Math.max(...filteredDaily.map((d) => d.netSales), 100)
  }, [filteredDaily])

  const hasData =
    filteredDaily.length > 0 && filteredDaily.some((d) => d.netSales > 0 || d.paidOrders > 0)

  // Chart dimensions
  const width = 800
  const height = 200
  const paddingX = 40
  const paddingY = 30
  const usableWidth = width - paddingX * 2
  const usableHeight = height - paddingY * 2

  const points = useMemo(() => {
    if (filteredDaily.length === 0) return []
    const step =
      filteredDaily.length > 1 ? usableWidth / (filteredDaily.length - 1) : usableWidth / 2

    return filteredDaily.map((d, index) => {
      const x = paddingX + (filteredDaily.length > 1 ? index * step : usableWidth / 2)
      const ratio = maxNetSales > 0 ? d.netSales / maxNetSales : 0
      const y = height - paddingY - ratio * usableHeight
      return {x, y, data: d}
    })
  }, [filteredDaily, maxNetSales, usableWidth, usableHeight, height])

  const linePath = useMemo(() => {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
    }, '')
  }, [points])

  const areaPath = useMemo(() => {
    if (points.length === 0) return ''
    const baseLine = height - paddingY
    const first = points[0]
    const last = points[points.length - 1]
    return `${linePath} L ${last.x} ${baseLine} L ${first.x} ${baseLine} Z`
  }, [points, linePath, height])

  return (
    <TrendCard>
      <HeaderRow>
        <TitleGroup>
          <BarChart2 size={18} color="#0f172a" />
          <Title>Günlük Satış Trendi</Title>
          <Subtitle>({currency})</Subtitle>
        </TitleGroup>

        <Legend>
          <LegendItem>
            <LegendDot color="#0f172a" />
            <span>Net Satış</span>
          </LegendItem>
        </Legend>
      </HeaderRow>

      <ChartContainer>
        {!hasData ? (
          <EmptyState>
            <TrendingUp size={24} />
            <span>Seçilen dönemde ({range}) satış trendi verisi bulunmuyor.</span>
          </EmptyState>
        ) : (
          <>
            <SvgWrapper viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line
                x1={paddingX}
                y1={height - paddingY}
                x2={width - paddingX}
                y2={height - paddingY}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <line
                x1={paddingX}
                y1={paddingY}
                x2={width - paddingX}
                y2={paddingY}
                stroke="#f1f5f9"
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {/* Area & Line */}
              <path d={areaPath} fill="url(#areaGradient)" />
              <path
                d={linePath}
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Interactive Points */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.point.date === p.data.date ? 5 : 3}
                    fill="#ffffff"
                    stroke="#0f172a"
                    strokeWidth="2"
                    style={{cursor: 'pointer', transition: 'r 0.15s ease'}}
                    onMouseEnter={(e) => {
                      const rect = (
                        e.currentTarget.parentElement?.parentElement as SVGSVGElement
                      )?.getBoundingClientRect()
                      if (rect) {
                        const relX = (p.x / width) * rect.width
                        const relY = (p.y / height) * rect.height
                        setHoveredPoint({point: p.data, x: relX, y: relY})
                      }
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Date labels at bottom */}
                  {(i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1) && (
                    <text
                      x={p.x}
                      y={height - 10}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="inherit"
                    >
                      {p.data.date}
                    </text>
                  )}
                </g>
              ))}
            </SvgWrapper>

            {hoveredPoint && (
              <TooltipBox left={hoveredPoint.x} top={hoveredPoint.y}>
                <TooltipDate>{hoveredPoint.point.date}</TooltipDate>
                <TooltipRow>
                  <span>Net Satış:</span>
                  <strong>{formatCurrencyAmount(hoveredPoint.point.netSales, currency)}</strong>
                </TooltipRow>
                <TooltipRow>
                  <span>Sipariş Sayısı:</span>
                  <span>{hoveredPoint.point.paidOrders} sipariş</span>
                </TooltipRow>
              </TooltipBox>
            )}
          </>
        )}
      </ChartContainer>
    </TrendCard>
  )
}
