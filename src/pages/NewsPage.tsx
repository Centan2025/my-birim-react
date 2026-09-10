import {useState, useEffect} from 'react'
import {useSearchParams} from 'react-router-dom'
import {NewsPageV1} from './NewsPageV1'
import {NewsPageV2} from './NewsPageV2'
import {NewsPageV3} from './NewsPageV3'
import {NewsVersionSwitcher} from '../components/news/NewsVersionSwitcher'

export function NewsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const paramVersion = searchParams.get('v')

  // Layout View Version: 'v1' | 'v2' | 'v3'
  const initialVersion: 'v1' | 'v2' | 'v3' =
    paramVersion === '3' || paramVersion === 'v3'
      ? 'v3'
      : paramVersion === '2' || paramVersion === 'v2'
        ? 'v2'
        : paramVersion === '1' || paramVersion === 'v1'
          ? 'v1'
          : (typeof window !== 'undefined' &&
              (localStorage.getItem('birim_news_view_version') as 'v1' | 'v2' | 'v3')) ||
            'v1'

  const [viewVersion, setViewVersion] = useState<'v1' | 'v2' | 'v3'>(initialVersion)

  useEffect(() => {
    if (paramVersion === '3' || paramVersion === 'v3') {
      setViewVersion('v3')
    } else if (paramVersion === '2' || paramVersion === 'v2') {
      setViewVersion('v2')
    } else if (paramVersion === '1' || paramVersion === 'v1') {
      setViewVersion('v1')
    }
  }, [paramVersion])

  const handleVersionChange = (v: 'v1' | 'v2' | 'v3') => {
    setViewVersion(v)
    if (typeof window !== 'undefined') {
      localStorage.setItem('birim_news_view_version', v)
    }
    const newParams = new URLSearchParams(searchParams)
    newParams.set('v', v === 'v3' ? '3' : v === 'v2' ? '2' : '1')
    setSearchParams(newParams, {replace: true})
  }

  return (
    <>
      {viewVersion === 'v3' ? (
        <NewsPageV3 />
      ) : viewVersion === 'v2' ? (
        <NewsPageV2 />
      ) : (
        <NewsPageV1 />
      )}

      {/* Floating Version Switcher (V1 Klasik / V2 Dikey Kart / V3 Dizin) */}
      <NewsVersionSwitcher activeVersion={viewVersion} onChange={handleVersionChange} />
    </>
  )
}

export default NewsPage


