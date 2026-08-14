import {motion} from 'framer-motion'
import {useTranslation} from '../i18n'

interface ProjectVersionSwitcherProps {
  activeVersion: 'v1' | 'v2'
  onChange: (version: 'v1' | 'v2') => void
}

export function ProjectVersionSwitcher({activeVersion, onChange}: ProjectVersionSwitcherProps) {
  const {locale} = useTranslation()
  const isTr = locale === 'tr'

  const versions: {id: 'v1' | 'v2'; label: string; descTr: string; descEn: string}[] = [
    {id: 'v1', label: 'V1', descTr: 'Klasik', descEn: 'Classic'},
    {id: 'v2', label: 'V2', descTr: 'Editoryal', descEn: 'Editorial'},
  ]

  return (
    <aside
      aria-label={isTr ? 'Proje Sayfa Sürüm Seçici' : 'Project Page Version Switcher'}
      className="fixed bottom-6 right-6 z-50 flex items-center select-none"
    >
      <div className="flex items-center gap-1 p-1 rounded-none bg-neutral-950/95 text-white backdrop-blur-xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {versions.map(v => {
          const isActive = activeVersion === v.id
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(v.id)}
              className={`relative px-3.5 sm:px-4 py-1.5 text-xs font-mono font-medium tracking-wider uppercase transition-colors duration-200 rounded-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-white ${
                isActive ? 'text-black font-semibold' : 'text-neutral-300 hover:text-white'
              }`}
              title={`${v.label} (${isTr ? v.descTr : v.descEn})`}
            >
              {isActive && (
                <motion.div
                  layoutId="project-version-pill"
                  className="absolute inset-0 bg-white rounded-none"
                  transition={{type: 'spring', stiffness: 500, damping: 35}}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span>{v.label}</span>
                <span className="text-[10px] opacity-70 font-sans font-light hidden sm:inline">
                  {isTr ? v.descTr : v.descEn}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
