import React, {useEffect, useMemo, useState} from 'react'
import type {ObjectInputProps} from 'sanity'
import {useClient, set, unset} from 'sanity'
import imageUrlBuilder from '@sanity/image-url'

type Material = {_key?: string; name?: any; image?: any}
type GroupDoc = {_id: string; title?: any; items?: Material[]}

function withKey(items: Material[]): Material[] {
  const gen = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  return (items || []).map((m) => (m && m._key ? m : {...m, _key: gen()}))
}

export default function MaterialSelectionInput(props: ObjectInputProps) {
  const {value, onChange, renderDefault} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const [groups, setGroups] = useState<GroupDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [openGroupId, setOpenGroupId] = useState<string | undefined>(undefined)

  useEffect(() => {
    setLoading(true)
    client
      .fetch<GroupDoc[]>(`*[_type == "materialGroup"]{_id, title, items}`)
      .then((rows) => setGroups(rows || []))
      .finally(() => setLoading(false))
  }, [client])

  const builder = useMemo(() => {
    const cfg = (client as any).config?.() || {}
    return imageUrlBuilder({projectId: cfg.projectId, dataset: cfg.dataset})
  }, [client])
  const urlFor = (img: any) => {
    try { return builder.image(img).width(48).height(48).fit('crop').url() } catch { return '' }
  }

  // Fallback to default if no data
  if (!groups.length && !loading) return renderDefault(props)

  const selectedMaterials: Material[] = value?.materials || []

  const toggleGroup = (id: string) => {
    // İlk kez açılıyorsa group ref set et; tekrar tıklamada sadece açık/kapalı değişsin
    setOpenGroupId((prev) => (prev === id ? undefined : id))
    if (!value?.group?._ref || value.group._ref !== id) {
      onChange(set({group: {_type: 'reference', _ref: id}, materials: []}))
    }
  }

  return (
    <div style={{display: 'grid', gap: 10}}>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
        {groups.map((g) => {
          const isOpen = openGroupId === g._id
          const hasSelected = selectedMaterials.length > 0 && value?.group?._ref === g._id
          return (
            <button
              key={g._id}
              type="button"
              onClick={() => toggleGroup(g._id)}
              style={{
                border: '1px solid #e5e7eb',
                padding: '6px 10px',
                borderRadius: 9999,
                background: isOpen ? '#111827' : '#fff',
                color: isOpen ? '#fff' : '#111827',
                cursor: 'pointer',
              }}
            >
              {(g.title?.tr || g.title?.en || 'Grup')}
              {hasSelected ? (
                <span style={{marginLeft: 8, fontSize: 11, color: isOpen ? '#d1fae5' : '#10b981'}}>●</span>
              ) : null}
            </button>
          )
        })}
      </div>

      {openGroupId ? (
        (() => {
          const group = groups.find((gg) => gg._id === openGroupId)
          const materials = group?.items || []
          if (!materials.length) return <div style={{fontSize: 12, color: '#999'}}>Bu grupta malzeme yok.</div>
          return (
            <div style={{display: 'grid', gap: 8}}>
              {materials.map((m, idx) => {
                const isChecked = Boolean(
                  selectedMaterials.find((x: any) => x?.name?.tr === m?.name?.tr && x?.name?.en === m?.name?.en)
                )
                return (
                  <label key={idx} style={{display: 'flex', alignItems: 'center', gap: 10, padding: 6, border: '1px solid #e5e7eb', borderRadius: 8}}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const next = new Set(selectedMaterials.map((x: any) => JSON.stringify(x)))
                        const key = JSON.stringify(m)
                        if (e.target.checked) next.add(key)
                        else next.delete(key)
                        const nextArr = Array.from(next).map((s) => JSON.parse(s))
                        onChange(set(withKey(nextArr), ['materials']))
                      }}
                    />
                    {m?.image ? (
                      <img src={urlFor(m.image)} alt={m?.name?.tr || m?.name?.en || 'Material'} style={{width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb'}} />
                    ) : null}
                    <span style={{fontSize: 13}}>{m?.name?.tr || m?.name?.en || 'Malzeme'}</span>
                  </label>
                )
              })}
            </div>
          )
        })()
      ) : (
        <div style={{fontSize: 12, color: '#6b7280'}}>Bir malzeme grubu seçin.</div>
      )}
    </div>
  )
}


