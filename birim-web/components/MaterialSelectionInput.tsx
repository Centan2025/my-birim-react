import React, {useEffect, useMemo, useState} from 'react'
import type {ObjectInputProps} from 'sanity'
import {useClient, set, unset} from 'sanity'
import imageUrlBuilder from '@sanity/image-url'

type Material = {_key?: string; name?: any; image?: any}
type Book = { title?: any; items?: Material[] }
type GroupDoc = {_id: string; title?: any; books?: Book[]}

function genKey() { return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}` }
function withKey(items: Material[]): Material[] {
  return (items || []).map((m) => (m && m._key ? m : {...m, _key: genKey()}))
}
function materialId(m: any): string {
  const n = (m?.name?.tr || m?.name?.en || '').toString().trim()
  const img = m?.image?.asset?._ref || m?.image?._id || ''
  return `${n}|${img}`
}

export default function MaterialSelectionInput(props: ObjectInputProps) {
  const {value, onChange, renderDefault} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const [groups, setGroups] = useState<GroupDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined)
  const [selectedBookIndex, setSelectedBookIndex] = useState<number>(0)

  useEffect(() => {
    setLoading(true)
    client
      .fetch<GroupDoc[]>(`*[_type == "materialGroup"]{_id, title, books[]{ title, items[]->{ name, image{asset} } }, items[]->{ name, image{asset} }}`)
      .then((rows: any[]) => {
        const normalized = (rows || []).map((r) => ({
          _id: r._id,
          title: r.title,
          books: r.books && r.books.length
            ? r.books
            : (r.items && r.items.length ? [{ title: r.title, items: r.items }] : []),
        }))
        setGroups(normalized as any)
      })
      .finally(() => setLoading(false))
  }, [client])

  const builder = useMemo(() => {
    const cfg = (client as any).config?.() || {}
    return imageUrlBuilder({projectId: cfg.projectId, dataset: cfg.dataset})
  }, [client])
  const urlFor = (img: any) => {
    try { return builder.image(img).width(48).height(48).fit('crop').url() } catch { return '' }
  }

  useEffect(() => {
    const existingRef = (value as any)?.group?._ref
    if (existingRef && !selectedGroupId) setSelectedGroupId(existingRef)
  }, [value, selectedGroupId])

  if (!groups.length && !loading) return renderDefault(props)

  const selectedMaterials: Material[] = (value as any)?.materials || []
  const selectedIds = new Set((selectedMaterials || []).map((m)=> materialId(m)))
  const group = groups.find((g)=> g._id === selectedGroupId)
  const books = group?.books || []
  const book = books[Math.min(Math.max(selectedBookIndex,0), Math.max(books.length-1, 0))]
  const materials = book?.items || []

  return (
    <div style={{display: 'grid', gap: 10}}>
      <label style={{fontSize: 12, color: '#666'}}>Malzeme Grubu</label>
      <select
        value={selectedGroupId || ''}
        onChange={(e)=>{
          const gid = e.target.value || undefined
          setSelectedGroupId(gid)
          setSelectedBookIndex(0)
          if (gid) {
            const refObj = { _type: 'reference', _ref: gid } as any
            const currentKey = (value as any)?._key
            const nextObj: any = { ...(value || {}), group: refObj }
            if (!Array.isArray(nextObj.materials)) nextObj.materials = []
            if (currentKey) nextObj._key = currentKey
            onChange(set(nextObj))
          } else {
            onChange(unset())
          }
        }}
      >
        <option value="">Grup seçin…</option>
        {groups.map((g)=> (
          <option key={g._id} value={g._id}>{g.title?.tr || g.title?.en || 'Grup'}</option>
        ))}
      </select>

      {selectedGroupId && (
        <>
          <label style={{fontSize: 12, color: '#666'}}>Kartela</label>
          <select value={String(selectedBookIndex)} onChange={(e)=> setSelectedBookIndex(Number(e.target.value))}>
            {books.map((b, i)=> (
              <option key={i} value={i}>{b.title?.tr || b.title?.en || `Kartela ${i+1}`}</option>
            ))}
          </select>
        </>
      )}

      {selectedGroupId && (
        materials.length === 0 ? (
          <div style={{fontSize: 12, color: '#999'}}>Bu kartelada malzeme yok.</div>
        ) : (
          <div style={{display: 'grid', gap: 8}}>
            {materials.map((m, idx) => {
              const id = materialId(m)
              const isChecked = selectedIds.has(id)
              return (
                <label key={idx} style={{display: 'flex', alignItems: 'center', gap: 10, padding: 6, border: '1px solid #e5e7eb'}}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      let nextArr = [...(selectedMaterials || [])]
                      if (e.target.checked) {
                        nextArr.push({ ...(m as any), _key: genKey() })
                        nextArr = withKey(nextArr)
                      } else {
                        nextArr = nextArr.filter((x)=> materialId(x) !== id)
                      }
                      onChange(set(nextArr, ['materials']))
                    }}
                  />
                  {m?.image ? (
                    <img src={urlFor(m.image)} alt={m?.name?.tr || m?.name?.en || 'Material'} style={{width: 36, height: 36, objectFit: 'cover', border: '1px solid #e5e7eb'}} />
                  ) : null}
                  <span style={{fontSize: 13}}>{m?.name?.tr || m?.name?.en || 'Malzeme'}</span>
                </label>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}


