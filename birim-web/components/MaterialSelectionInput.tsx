import React, {useEffect, useMemo, useState} from 'react'
import type {ObjectInputProps} from 'sanity'
import {useClient} from 'sanity'
import imageUrlBuilder from '@sanity/image-url'

type Material = {name?: any; image?: any}
type GroupDoc = {_id: string; title?: any; items?: Material[]}

export default function MaterialSelectionInput(props: ObjectInputProps) {
  const {value, onChange, renderDefault} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const [groups, setGroups] = useState<GroupDoc[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    client
      .fetch<GroupDoc[]>(`*[_type == "materialGroup"]{_id, title, items}`)
      .then((rows) => setGroups(rows || []))
      .finally(() => setLoading(false))
  }, [client])

  const selectedGroupId: string | undefined = value?.group?._ref
  const group = useMemo(() => groups.find((g) => g._id === selectedGroupId), [groups, selectedGroupId])
  const materials: Material[] = group?.items || []

  const builder = useMemo(() => {
    const cfg = (client as any).config?.() || {}
    return imageUrlBuilder({projectId: cfg.projectId, dataset: cfg.dataset})
  }, [client])
  const urlFor = (img: any) => {
    try { return builder.image(img).width(48).height(48).fit('crop').url() } catch { return '' }
  }

  // Fallback to default if we cannot load groups
  if (!groups.length && !loading) return renderDefault(props)

  return (
    <div style={{display: 'grid', gap: 8}}>
      <label style={{fontSize: 12, color: '#666'}}>Malzeme Grubu</label>
      <select
        value={selectedGroupId || ''}
        onChange={(e) => {
          const _ref = e.target.value || undefined
          props.onChange({
            type: 'set',
            path: [],
            value: _ref
              ? {group: {_type: 'reference', _ref}, materials: []}
              : undefined,
          })
        }}
      >
        <option value="">Grup seçin…</option>
        {groups.map((g) => (
          <option key={g._id} value={g._id}>
            {g.title?.tr || g.title?.en || 'Grup'}
          </option>
        ))}
      </select>

      {selectedGroupId ? (
        <div style={{display: 'grid', gap: 6}}>
          <label style={{fontSize: 12, color: '#666'}}>Seçilen Malzemeler</label>
          {materials.length === 0 ? (
            <div style={{fontSize: 12, color: '#999'}}>Bu grupta malzeme yok.</div>
          ) : (
            <div style={{display: 'grid', gap: 4}}>
              {materials.map((m, idx) => {
                const isChecked = Boolean(
                  (value?.materials || []).find(
                    (x: any) => x?.name?.tr === m?.name?.tr && x?.name?.en === m?.name?.en
                  )
                )
                return (
                  <label key={idx} style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const next = new Set(
                          (value?.materials || []).map((x: any) => JSON.stringify(x))
                        )
                        const key = JSON.stringify(m)
                        if (e.target.checked) next.add(key)
                        else next.delete(key)
                        const nextArr = Array.from(next).map((s) => JSON.parse(s))
                        onChange({type: 'set', path: ['materials'], value: nextArr})
                      }}
                    />
                    {m?.image ? (
                      <img
                        src={urlFor(m.image)}
                        alt={m?.name?.tr || m?.name?.en || 'Material'}
                        style={{width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb'}}
                      />
                    ) : null}
                    <span>{m?.name?.tr || m?.name?.en || 'Malzeme'}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}


