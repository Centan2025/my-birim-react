import React, {useEffect, useMemo, useState} from 'react'
import type {ObjectInputProps} from 'sanity'
import {useClient, set, unset, setIfMissing} from 'sanity'
import imageUrlBuilder from '@sanity/image-url'

type Material = {_key?: string; name?: any; image?: any}
type Book = { title?: any; items?: Material[] }
type GroupDoc = {_id: string; title?: any; books?: Book[]}

function genKey() { return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}` }
function withKey(items: Material[]): Material[] { return (items || []).map(m => (m && m._key ? m : {...m, _key: genKey()})) }
function assetId(img: any): string { return img?.asset?._ref || img?._ref || img?._id || img?.asset?._id || '' }
function materialIdLoose(m: any): string {
  const ntr = (m?.name?.tr || '').toString().trim()
  const nen = (m?.name?.en || '').toString().trim()
  const aid = assetId(m?.image)
  return [ntr, nen, aid].join('|')
}

export default function MaterialSelectionInput(props: ObjectInputProps) {
  const {value, onChange, renderDefault} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const [groups, setGroups] = useState<GroupDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined)
  const [selectedBookIndex, setSelectedBookIndex] = useState<number>(0)
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    client
      .fetch<GroupDoc[]>(`*[_type == "materialGroup"]{_id, title, books[]{ title, items[]{ _key, name, image{asset} } }, items[]{ _key, name, image{asset} }}`)
      .then((rows: any[]) => {
        const normalized = (rows || []).map((r) => ({ _id: r._id, title: r.title, books: r.books && r.books.length ? r.books : (r.items && r.items.length ? [{ title: r.title, items: r.items }] : []) }))
        setGroups(normalized as any)
      })
      .finally(() => setLoading(false))
  }, [client])

  const builder = useMemo(() => { const cfg = (client as any).config?.() || {}; return imageUrlBuilder({projectId: cfg.projectId, dataset: cfg.dataset}) }, [client])
  const urlFor = (img: any) => { try { return builder.image(img).width(48).height(48).fit('crop').url() } catch { return '' } }

  useEffect(() => { const existingRef = (value as any)?.group?._ref; if (existingRef && !selectedGroupId) setSelectedGroupId(existingRef) }, [value, selectedGroupId])

  useEffect(() => {
    // Ensure materials exists
    if (!value || !(value as any).materials) onChange(setIfMissing({ materials: [] }))
    // Sync local selected ids from value
    const mats: any[] = ((value as any)?.materials) || []
    setLocalSelectedIds(new Set(mats.map(materialIdLoose)))
  }, [value, onChange])

  if (!groups.length && !loading) return renderDefault(props)

  const selectedMaterials: Material[] = (value as any)?.materials || []
  const group = groups.find((g)=> g._id === selectedGroupId)
  const books = group?.books || []
  const book = books[Math.min(Math.max(selectedBookIndex,0), Math.max(books.length-1, 0))]
  const materials = book?.items || []

  return (
    <div style={{display: 'grid', gap: 10}}>
      <label style={{fontSize: 12, color: '#666'}}>Malzeme Grubu</label>
      <select value={selectedGroupId || ''} onChange={(e)=>{ const gid = e.target.value || undefined; setSelectedGroupId(gid); setSelectedBookIndex(0); if (gid) { const refObj = { _type: 'reference', _ref: gid } as any; const currentKey = (value as any)?._key; const nextObj: any = { ...(value || {}), group: refObj }; if (!Array.isArray(nextObj.materials)) nextObj.materials = []; if (currentKey) nextObj._key = currentKey; onChange(set(nextObj)) } else { onChange(unset()) } }}>
        <option value="">Grup seçin…</option>
        {groups.map((g)=> (<option key={g._id} value={g._id}>{g.title?.tr || g.title?.en || 'Grup'}</option>))}
      </select>

      {selectedGroupId && (<>
        <label style={{fontSize: 12, color: '#666'}}>Kartela</label>
        <select value={String(selectedBookIndex)} onChange={(e)=> setSelectedBookIndex(Number(e.target.value))}>
          {books.map((b, i)=> (<option key={i} value={i}>{b.title?.tr || b.title?.en || `Kartela ${i+1}`}</option>))}
        </select>
      </>)}

      {selectedGroupId && (materials.length === 0 ? (
        <div style={{fontSize: 12, color: '#999'}}>Bu kartelada malzeme yok.</div>
      ) : (
        <div style={{display: 'grid', gap: 8}}>
          {materials.map((m, idx) => {
            const id = materialIdLoose(m)
            const isChecked = localSelectedIds.has(id)
            const labelTxt = (m?.name?.tr || m?.name?.en || `Malzeme ${idx+1}`)
            return (
              <label key={m?._key || idx} style={{display: 'flex', alignItems: 'center', gap: 10, padding: 6, border: '1px solid #e5e7eb'}}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    let nextArr = [...(selectedMaterials || [])]
                    const nextIds = new Set(localSelectedIds)
                    if (e.target.checked) {
                      if (!nextIds.has(id)) {
                        const aid = assetId(m?.image)
                        const imgObj = aid ? { _type: 'image', asset: { _type: 'reference', _ref: aid } } : undefined
                        const toAdd: any = { _type: 'productMaterial', name: m?.name, _key: genKey() }
                        if (imgObj) toAdd.image = imgObj
                        // prevent duplicate push
                        nextArr = nextArr.filter((x)=> materialIdLoose(x) !== id)
                        nextArr.push(toAdd)
                        nextIds.add(id)
                      }
                    } else {
                      nextArr = nextArr.filter((x)=> materialIdLoose(x) !== id)
                      nextIds.delete(id)
                    }
                    setLocalSelectedIds(nextIds)
                    onChange(set(nextArr, ['materials']))
                  }}
                />
                {m?.image ? (<img src={urlFor(m.image)} alt={labelTxt} style={{width: 36, height: 36, objectFit: 'cover', border: '1px solid #e5e7eb'}} />) : null}
                <span style={{fontSize: 13}}>{labelTxt}</span>
              </label>
            )
          })}
        </div>
      ))}
    </div>
  )
}


