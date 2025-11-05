import React, {useEffect, useMemo, useState} from 'react'
import type {ObjectInputProps} from 'sanity'
import {useClient, set, unset} from 'sanity'
import imageUrlBuilder from '@sanity/image-url'

type Material = {_key?: string; name?: any; image?: any}
type Book = { title?: any; items?: Material[] }
type GroupDoc = {_id: string; title?: any; books?: Book[]}

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
  const [openBookIndex, setOpenBookIndex] = useState<number>(0)

  useEffect(() => {
    setLoading(true)
    client
      .fetch<GroupDoc[]>(`*[_type == "materialGroup"]{_id, title, books{ title, items }, items}`)
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

  if (!groups.length && !loading) return renderDefault(props)

  const selectedMaterials: Material[] = value?.materials || []

  const openGroup = (id: string) => {
    setOpenGroupId(id)
    setOpenBookIndex(0)
    const refObj = { _type: 'reference', _ref: id } as any
    const currentKey = (value as any)?._key
    const nextObj: any = { ...(value || {}), group: refObj }
    if (!Array.isArray(nextObj.materials)) nextObj.materials = []
    if (currentKey) nextObj._key = currentKey
    onChange(set(nextObj))
  }

  const group = groups.find((g)=> g._id === openGroupId)
  const books = group?.books || []
  const safeIndex = Math.min(Math.max(openBookIndex, 0), Math.max(books.length-1, 0))
  const currentBook = books[safeIndex]
  const materials = currentBook?.items || []

  return (
    <div style={{display: 'grid', gap: 10}}>
      {/* Groups */}
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
        {groups.map((g) => {
          const isOpen = openGroupId === g._id
          const hasSelected = selectedMaterials.length > 0 && value?.group?._ref === g._id
          return (
            <button key={g._id} type="button" onClick={() => openGroup(g._id)}
              style={{ border: '1px solid rgba(17,24,39,0.15)', padding: '6px 12px', borderRadius: 9999, background: isOpen ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.6)', color: isOpen ? '#fff' : '#111827', backdropFilter: 'saturate(180%) blur(6px)', boxShadow: isOpen ? '0 6px 18px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.08)', transition: 'all .2s ease', cursor: 'pointer' }}>
              {(g.title?.tr || g.title?.en || 'Grup')}
              {hasSelected ? (<span style={{marginLeft: 8, fontSize: 11, color: isOpen ? '#a7f3d0' : '#059669'}}>●</span>) : null}
            </button>
          )
        })}
      </div>

      {/* Books */}
      {openGroupId && books.length>0 && (
        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
          {books.map((b, i)=> (
            <button key={i} type="button" onClick={()=> setOpenBookIndex(i)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(17,24,39,0.15)', background: openBookIndex===i ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.6)', color: openBookIndex===i ? '#fff' : '#111827', transition: 'all .2s ease' }}>
              {b.title?.tr || b.title?.en || `Kartela ${i+1}`}
            </button>
          ))}
        </div>
      )}

      {/* Materials */}
      {openGroupId ? (
        materials.length === 0 ? (
          <div style={{fontSize: 12, color: '#999'}}>Bu kartelada malzeme yok.</div>
        ) : (
          <div style={{display: 'grid', gap: 8}}>
            {materials.map((m, idx) => {
              const isChecked = Boolean(selectedMaterials.find((x: any) => x?.name?.tr === m?.name?.tr && x?.name?.en === m?.name?.en))
              return (
                <label key={idx} style={{display: 'flex', alignItems: 'center', gap: 10, padding: 6, border: '1px solid #e5e7eb'}}>
                  <input type="checkbox" checked={isChecked} onChange={(e) => {
                      const next = new Set(selectedMaterials.map((x: any) => JSON.stringify(x)))
                      const key = JSON.stringify(m)
                      if (e.target.checked) next.add(key); else next.delete(key)
                      const nextArr = Array.from(next).map((s) => JSON.parse(s))
                      onChange(set(withKey(nextArr), ['materials']))
                    }} />
                  {m?.image ? (<img src={urlFor(m.image)} alt={m?.name?.tr || m?.name?.en || 'Material'} style={{width: 36, height: 36, objectFit: 'cover', border: '1px solid #e5e7eb'}} />) : null}
                  <span style={{fontSize: 13}}>{m?.name?.tr || m?.name?.en || 'Malzeme'}</span>
                </label>
              )
            })}
          </div>
        )
      ) : (
        <div style={{fontSize: 12, color: '#6b7280'}}>Bir malzeme grubu seçin.</div>
      )}
    </div>
  )
}


