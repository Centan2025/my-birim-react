import {useState, useEffect} from 'react'
import {useSearchParams} from 'react-router-dom'
import {FactoryPageV1} from './FactoryPageV1'
import {FactoryPageV2} from './FactoryPageV2'
import {FactoryPageV3} from './FactoryPageV3'
import {FactoryVersionSwitcher} from '../components/FactoryVersionSwitcher'

export function FactoryPage({defaultVersion = 'v1'}: {defaultVersion?: 'v1' | 'v2' | 'v3'}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const paramVersion = searchParams.get('v')

  const initialVersion: 'v1' | 'v2' | 'v3' =
    paramVersion === '3' || paramVersion === 'v3'
      ? 'v3'
      : paramVersion === '2' || paramVersion === 'v2'
        ? 'v2'
        : paramVersion === '1' || paramVersion === 'v1'
          ? 'v1'
          : defaultVersion

  const [version, setVersion] = useState<'v1' | 'v2' | 'v3'>(initialVersion)

  // Sync state with search param if search param changes externally
  useEffect(() => {
    if (paramVersion === '3' || paramVersion === 'v3') {
      setVersion('v3')
    } else if (paramVersion === '2' || paramVersion === 'v2') {
      setVersion('v2')
    } else if (paramVersion === '1' || paramVersion === 'v1') {
      setVersion('v1')
    }
  }, [paramVersion])

  const handleVersionChange = (nextVersion: 'v1' | 'v2' | 'v3') => {
    setVersion(nextVersion)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('v', nextVersion === 'v3' ? '3' : nextVersion === 'v2' ? '2' : '1')
    setSearchParams(newParams, {replace: true})
  }

  return (
    <div className="relative min-h-screen">
      {/* Active Version Component */}
      {version === 'v3' ? (
        <FactoryPageV3 />
      ) : version === 'v2' ? (
        <FactoryPageV2 />
      ) : (
        <FactoryPageV1 />
      )}

      {/* Floating Bottom-Right Version Switcher */}
      <FactoryVersionSwitcher activeVersion={version} onChange={handleVersionChange} />
    </div>
  )
}
