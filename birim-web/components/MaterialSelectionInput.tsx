import React, {useEffect, useMemo, useState, useRef} from 'react'
import type {ObjectInputProps} from 'sanity'
import {useClient, set, unset, setIfMissing} from 'sanity'
import imageUrlBuilder from '@sanity/image-url'

type Material = {_key?: string; name?: any; image?: any}
type Book = {title?: any; items?: Material[]}
type GroupDoc = {_id: string; title?: any; books?: Book[]}

function genKey() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
function withKey(items: Material[]): Material[] {
  return (items || []).map((m) => (m && m._key ? m : {...m, _key: genKey()}))
}
function assetId(img: any): string {
  return img?.asset?._ref || img?._ref || img?._id || img?.asset?._id || ''
}
function ensureKey(m: any): any {
  if (!m) return m
  if (m._key) return m
  return {...m, _key: genKey()}
}
function materialIdLoose(m: any): string {
  // Öncelik _key; yoksa ad + görsel fallback
  const key = m?._key || ''
  if (key) return key
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
  const [groupCache, setGroupCache] = useState<
    Record<string, {materials: Material[]; bookIndex: number; ids: string[]}>
  >({})
  const restoringRef = useRef(false)
  const touchedRef = useRef(false)

  useEffect(() => {
    setLoading(true)
    client
      .fetch<GroupDoc[]>(
        `*[_type == "materialGroup"]{
          _id,
          title,
          books[]{
            title,
            items[]{
              _key,
              name,
              image{
                crop,
                hotspot,
                asset->{_id, _ref, url}
              }
            }
          },
          items[]{
            _key,
            name,
            image{
              crop,
              hotspot,
              asset->{_id, _ref, url}
            }
          }
        }`,
      )
      .then((rows: any[]) => {
        const normalized = (rows || []).map((r) => {
          const hasBooks = r.books && r.books.length
          const books = hasBooks
            ? r.books.map((b: any) => ({...b, items: withKey(b.items || [])}))
            : r.items && r.items.length
              ? [{title: r.title, items: withKey(r.items)}]
              : []
          return {
            _id: r._id,
            title: r.title,
            books,
          }
        })
        setGroups(normalized as any)
      })
      .finally(() => setLoading(false))
  }, [client])

  const builder = useMemo(() => {
    const cfg = (client as any).config?.() || {}
    return imageUrlBuilder({projectId: cfg.projectId, dataset: cfg.dataset})
  }, [client])
  const urlFor = (img: any) => {
    try {
      return builder.image(img).width(48).height(48).fit('crop').url()
    } catch {
      return ''
    }
  }

  useEffect(() => {
    const existingRef = (value as any)?.group?._ref
    if (existingRef && !selectedGroupId) setSelectedGroupId(existingRef)
  }, [value, selectedGroupId])

  useEffect(() => {
    // Ensure materials exists
    if (!value || !(value as any).materials) onChange(setIfMissing({materials: []}))
    // Sync local selected ids from value
    const mats: any[] = (value as any)?.materials || []
    setLocalSelectedIds(new Set(mats.map(materialIdLoose)))
  }, [value, onChange])

  // Seçimler değiştikçe aktif grubu cache'e yaz (publish etmeden geri dönebilmek için)
  useEffect(() => {
    if (!selectedGroupId) return
    if (restoringRef.current) return
    const valueGroupId = (value as any)?.group?._ref
    // Değer başka gruba aitken bu grubu cache'leme
    if (valueGroupId && valueGroupId !== selectedGroupId) return
    const mats: Material[] = Array.isArray((value as any)?.materials) ? (value as any).materials : []
    const nextIds = Array.from(localSelectedIds)
    const prev = groupCache[selectedGroupId]
    const prevIdsKey = prev?.ids?.join('|') || ''
    const nextIdsKey = nextIds.join('|')
    const matKey = (ms: Material[]) => ms.map(materialIdLoose).join('|')
    const prevMatKey = prev ? matKey(prev.materials || []) : ''
    const nextMatKey = matKey(mats)
    const needsUpdate =
      !prev ||
      prev.bookIndex !== selectedBookIndex ||
      prevIdsKey !== nextIdsKey ||
      prevMatKey !== nextMatKey
    if (!needsUpdate) return
    setGroupCache(prevCache => ({
      ...prevCache,
      [selectedGroupId]: {
        materials: mats,
        bookIndex: selectedBookIndex,
        ids: nextIds,
      },
    }))
  }, [selectedGroupId, selectedBookIndex, localSelectedIds, value, groupCache])

  // Grup değiştiğinde cache varsa ve değer boşsa geri yükle (Sanity render sırasındaki kayıpları önlemek için)
  useEffect(() => {
    if (!selectedGroupId) return
    if (restoringRef.current) return
    if (touchedRef.current) return
    const cached = groupCache[selectedGroupId]
    if (!cached) return
    const mats: any[] = (value as any)?.materials || []
    const isEmpty = mats.length === 0
    if (!isEmpty) return

    restoringRef.current = true
    onChange(set(cached.materials || [], ['materials']))
    setSelectedBookIndex(cached.bookIndex || 0)
    setLocalSelectedIds(new Set(cached.ids || []))
  }, [selectedGroupId, groupCache, value, onChange])

  // Restore tamamlanınca bayrağı temizle
  useEffect(() => {
    if (!restoringRef.current) return
    const mats: any[] = (value as any)?.materials || []
    if (mats.length > 0) restoringRef.current = false
  }, [value])

  if (!groups.length && !loading) return renderDefault(props)

  const selectedMaterials: Material[] = (value as any)?.materials || []
  const group = groups.find((g) => g._id === selectedGroupId)
  const books = group?.books || []
  const book = books[Math.min(Math.max(selectedBookIndex, 0), Math.max(books.length - 1, 0))]
  const materials = book?.items || []
  const isBookFullySelected =
    materials.length > 0 && materials.every((m) => localSelectedIds.has(materialIdLoose(m)))

  const toggleSelectBook = (selectAll: boolean) => {
    if (!selectedGroupId) return
    touchedRef.current = true

    let nextArr = [...(selectedMaterials || [])]
    const nextIds = new Set(localSelectedIds)

    if (selectAll) {
      // Bu karteladaki TÜM malzemeleri ekle
      for (const m of materials) {
        const id = materialIdLoose(m)
        if (!id || nextIds.has(id)) continue

        const aid = assetId(m?.image)
        const imgObj = aid
          ? {
              _type: 'image',
              asset: {_type: 'reference', _ref: aid},
              // crop/hotspot bilgisi varsa kopyala ki kırpma kaybolmasın
              ...(m?.image?.crop ? {crop: m.image.crop} : {}),
              ...(m?.image?.hotspot ? {hotspot: m.image.hotspot} : {}),
            }
          : undefined
        const sourceKey = m?._key || genKey()
        const toAdd: any = {
          _type: 'productMaterial',
          name: m?.name,
          _key: sourceKey,
        }
        if (imgObj) toAdd.image = imgObj

        // Aynı id'ye sahip eski kaydı sil, yenisini ekle
        nextArr = nextArr.filter((x) => materialIdLoose(x) !== id)
        nextArr.push(toAdd)
        nextIds.add(id)
      }
    } else {
      // Bu karteladaki TÜM malzemeleri kaldır
      const bookIds = new Set(materials.map((m) => materialIdLoose(m)))
      nextArr = nextArr.filter((x) => !bookIds.has(materialIdLoose(x)))
      for (const bid of bookIds) {
        nextIds.delete(bid)
      }
    }

    setLocalSelectedIds(nextIds)
    onChange(set(nextArr, ['materials']))
  }

  return (
    <div style={{display: 'grid', gap: 10}}>
      <label style={{fontSize: 12, color: '#666'}}>Malzeme Grubu</label>
      <select
        value={selectedGroupId || ''}
        onChange={(e) => {
          touchedRef.current = false
          const gid = e.target.value || undefined
          const isGroupChanged = gid !== selectedGroupId

          // Mevcut gruptaki seçimleri cache'le
          if (selectedGroupId) {
            const currentMats: Material[] = Array.isArray(selectedMaterials) ? selectedMaterials : []
            setGroupCache((prev) => ({
              ...prev,
              [selectedGroupId]: {
                materials: currentMats,
                bookIndex: selectedBookIndex,
                ids: Array.from(localSelectedIds),
              },
            }))
          }

          // Yeni gruba geçerken cache'te varsa geri yükle
          const cached = gid ? groupCache[gid] : undefined
          setSelectedGroupId(gid)
          setSelectedBookIndex(cached ? cached.bookIndex : 0)
          setLocalSelectedIds(new Set(cached ? cached.ids : []))

          if (gid) {
            const refObj = {_type: 'reference', _ref: gid} as any
            const currentKey = (value as any)?._key
            const nextObj: any = {...(value || {}), group: refObj}
            const nextMaterials = cached ? cached.materials : []
            nextObj.materials = Array.isArray(nextMaterials) ? nextMaterials : []
            if (currentKey) nextObj._key = currentKey
            onChange(set(nextObj))
          } else {
            // Grup temizlenince seçimleri de sıfırla
            setLocalSelectedIds(new Set())
            onChange(unset())
          }
        }}
      >
        <option value="">Grup seçin…</option>
        {groups.map((g) => (
          <option key={g._id} value={g._id}>
            {g.title?.tr || g.title?.en || 'Grup'}
          </option>
        ))}
      </select>

      {selectedGroupId && (
        <>
          <label style={{fontSize: 12, color: '#666'}}>Kartela</label>
          <select
            value={String(selectedBookIndex)}
            onChange={(e) => setSelectedBookIndex(Number(e.target.value))}
          >
            {books.map((b, i) => (
              <option key={i} value={i}>
                {b.title?.tr || b.title?.en || `Kartela ${i + 1}`}
              </option>
            ))}
          </select>
          {materials.length > 0 && (
            <button
              type="button"
              onClick={() => toggleSelectBook(!isBookFullySelected)}
              style={{
                marginTop: 6,
                alignSelf: 'flex-start',
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 4,
                border: isBookFullySelected ? '1px solid #b91c1c' : '1px solid #2563eb',
                background: isBookFullySelected ? '#fee2e2' : '#dbeafe',
                color: isBookFullySelected ? '#991b1b' : '#1d4ed8',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.18)',
                cursor: 'pointer',
              }}
            >
              {isBookFullySelected
                ? 'Bu karteladaki tüm malzemeleri kaldır'
                : 'Bu karteladaki tüm malzemeleri seç'}
            </button>
          )}
        </>
      )}

      {selectedGroupId &&
        (materials.length === 0 ? (
          <div style={{fontSize: 12, color: '#999'}}>Bu kartelada malzeme yok.</div>
        ) : (
          <div style={{display: 'grid', gap: 8}}>
            {materials.map((m, idx) => {
              const id = materialIdLoose(m)
              const isChecked = localSelectedIds.has(id)
              const labelTxt = m?.name?.tr || m?.name?.en || `Malzeme ${idx + 1}`
              return (
                <label
                  key={m?._key || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 6,
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                  onChange={(e) => {
                      touchedRef.current = true
                      let nextArr = [...(selectedMaterials || [])]
                      const nextIds = new Set(localSelectedIds)
                      if (e.target.checked) {
                        if (!nextIds.has(id)) {
                          const aid = assetId(m?.image)
                          const imgObj = aid
                            ? {
                                _type: 'image',
                                asset: {_type: 'reference', _ref: aid},
                                // crop/hotspot bilgisi varsa kopyala ki kırpma kaybolmasın
                                ...(m?.image?.crop ? {crop: m.image.crop} : {}),
                                ...(m?.image?.hotspot ? {hotspot: m.image.hotspot} : {}),
                              }
                            : undefined
                          const sourceKey = m?._key || genKey()
                          const toAdd: any = {
                            _type: 'productMaterial',
                            name: m?.name,
                            _key: sourceKey,
                          }
                          if (imgObj) toAdd.image = imgObj
                          // prevent duplicate push
                          nextArr = nextArr.filter((x) => materialIdLoose(x) !== id)
                          nextArr.push(toAdd)
                          nextIds.add(id)
                        }
                      } else {
                        nextArr = nextArr.filter((x) => materialIdLoose(x) !== id)
                        nextIds.delete(id)
                      }
                      setLocalSelectedIds(nextIds)
                      onChange(set(nextArr, ['materials']))
                    }}
                  />
                  {m?.image ? (
                    <img
                      src={urlFor(m.image)}
                      alt={labelTxt}
                      style={{
                        width: 36,
                        height: 36,
                        objectFit: 'cover',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  ) : null}
                  <span style={{fontSize: 13}}>{labelTxt}</span>
                </label>
              )
            })}
          </div>
        ))}
    </div>
  )
}
