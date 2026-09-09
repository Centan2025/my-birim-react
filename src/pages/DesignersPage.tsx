import {useState, useEffect} from 'react'
import {useSearchParams} from 'react-router-dom'
import {DesignersPageV1} from './DesignersPageV1'
import {DesignersPageV2} from './DesignersPageV2'
import {DesignersVersionSwitcher} from '../components/designers/DesignersVersionSwitcher'

export function DesignersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const paramVersion = searchParams.get('v')

  // Layout View Version: 'v1' | 'v2'
  const initialVersion: 'v1' | 'v2' =
    paramVersion === '2' || paramVersion === 'v2'
      ? 'v2'
      : paramVersion === '1' || paramVersion === 'v1'
        ? 'v1'
        : (typeof window !== 'undefined' &&
            (localStorage.getItem('birim_designers_view_version') as 'v1' | 'v2')) ||
          'v1'

  const [viewVersion, setViewVersion] = useState<'v1' | 'v2'>(initialVersion)

  useEffect(() => {
    if (paramVersion === '2' || paramVersion === 'v2') {
      setViewVersion('v2')
    } else if (paramVersion === '1' || paramVersion === 'v1') {
      setViewVersion('v1')
    }
  }, [paramVersion])

  const handleVersionChange = (v: 'v1' | 'v2') => {
    setViewVersion(v)
    if (typeof window !== 'undefined') {
      localStorage.setItem('birim_designers_view_version', v)
    }
    const newParams = new URLSearchParams(searchParams)
    newParams.set('v', v === 'v2' ? '2' : '1')
    setSearchParams(newParams, {replace: true})
  }

  return (
    <>
      {viewVersion === 'v2' ? <DesignersPageV2 /> : <DesignersPageV1 />}

      {/* Floating Version Switcher (V1 Izgara / V2 Tam Ekran) */}
      <DesignersVersionSwitcher activeVersion={viewVersion} onChange={handleVersionChange} />
    </>
  )
}

export {DesignersPageV1, DesignersPageV2}
export default DesignersPage
