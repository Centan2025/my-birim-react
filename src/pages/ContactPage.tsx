import {useState, useEffect} from 'react'
import {useSearchParams} from 'react-router-dom'
import {ContactPageV1} from './ContactPageV1'
import {ContactPageV2} from './ContactPageV2'
import {ContactVersionSwitcher} from '../components/ContactVersionSwitcher'

export function ContactPage({defaultVersion = 'v2'}: {defaultVersion?: 'v1' | 'v2'}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const paramVersion = searchParams.get('v')

  const initialVersion: 'v1' | 'v2' =
    paramVersion === '1' || paramVersion === 'v1'
      ? 'v1'
      : paramVersion === '2' || paramVersion === 'v2'
        ? 'v2'
        : defaultVersion

  const [version, setVersion] = useState<'v1' | 'v2'>(initialVersion)

  // Sync state with search param if changed externally
  useEffect(() => {
    if (paramVersion === '1' || paramVersion === 'v1') {
      setVersion('v1')
    } else if (paramVersion === '2' || paramVersion === 'v2') {
      setVersion('v2')
    }
  }, [paramVersion])

  const handleVersionChange = (nextVersion: 'v1' | 'v2') => {
    setVersion(nextVersion)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('v', nextVersion === 'v1' ? '1' : '2')
    setSearchParams(newParams, {replace: true})
  }

  return (
    <div className="relative min-h-screen">
      {/* Active Version Component */}
      {version === 'v1' ? <ContactPageV1 /> : <ContactPageV2 />}

      {/* Floating Bottom-Right Version Switcher */}
      <ContactVersionSwitcher activeVersion={version} onChange={handleVersionChange} />
    </div>
  )
}

export default ContactPage
