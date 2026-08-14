import {useState, useEffect} from 'react'
import {useSearchParams} from 'react-router-dom'
import {ProjectDetailPageV1} from './ProjectDetailPageV1'
import {ProjectDetailPageV2} from './ProjectDetailPageV2'
import {ProjectVersionSwitcher} from '../components/ProjectVersionSwitcher'

export function ProjectDetailPage({defaultVersion = 'v1'}: {defaultVersion?: 'v1' | 'v2'}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const paramVersion = searchParams.get('v')

  const initialVersion: 'v1' | 'v2' =
    paramVersion === '2' || paramVersion === 'v2'
      ? 'v2'
      : paramVersion === '1' || paramVersion === 'v1'
        ? 'v1'
        : defaultVersion

  const [version, setVersion] = useState<'v1' | 'v2'>(initialVersion)

  // Sync state with search param if changed externally
  useEffect(() => {
    if (paramVersion === '2' || paramVersion === 'v2') {
      setVersion('v2')
    } else if (paramVersion === '1' || paramVersion === 'v1') {
      setVersion('v1')
    }
  }, [paramVersion])

  const handleVersionChange = (nextVersion: 'v1' | 'v2') => {
    setVersion(nextVersion)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('v', nextVersion === 'v2' ? '2' : '1')
    setSearchParams(newParams, {replace: true})
  }

  return (
    <div className="relative min-h-screen">
      {/* Active Version Component */}
      {version === 'v2' ? <ProjectDetailPageV2 /> : <ProjectDetailPageV1 />}

      {/* Floating Bottom-Right Version Switcher (V1 / V2) */}
      <ProjectVersionSwitcher activeVersion={version} onChange={handleVersionChange} />
    </div>
  )
}
