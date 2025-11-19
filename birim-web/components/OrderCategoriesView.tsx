import {useClient} from 'sanity'
import {useEffect, useState} from 'react'
import {Card, Stack, Flex, Text, Button, Spinner} from '@sanity/ui'

interface Category {
  _id: string
  name: {tr?: string; en?: string}
  orderRank?: string
}

export function OrderCategoriesView() {
  const client = useClient({apiVersion: '2024-01-01'})
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await client.fetch(
        `*[_type == "category"] | order(orderRank asc) {
          _id,
          name,
          orderRank
        }`
      )
      setCategories(data)
    } catch (err) {
      console.error('Kategoriler yüklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newCategories = [...categories]
    const temp = newCategories[index]
    newCategories[index] = newCategories[index - 1]
    newCategories[index - 1] = temp
    setCategories(newCategories)
  }

  const moveDown = (index: number) => {
    if (index === categories.length - 1) return
    const newCategories = [...categories]
    const temp = newCategories[index]
    newCategories[index] = newCategories[index + 1]
    newCategories[index + 1] = temp
    setCategories(newCategories)
  }

  const saveOrder = async () => {
    setSaving(true)
    try {
      // Her kategoriye yeni orderRank değeri ata
      const updates = categories.map((cat, index) => {
        const newRank = `${(index + 1) * 1000}` // 1000, 2000, 3000...
        return client.patch(cat._id).set({orderRank: newRank}).commit()
      })
      await Promise.all(updates)
      alert('Kategori sıralaması kaydedildi!')
      loadCategories() // Yeniden yükle
    } catch (err) {
      console.error('Kaydetme hatası:', err)
      alert('Hata oluştu!')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card padding={4}>
        <Flex justify="center" align="center">
          <Spinner />
        </Flex>
      </Card>
    )
  }

  return (
    <Card padding={4}>
      <Stack space={3}>
        <Flex justify="space-between" align="center">
          <Text size={2} weight="bold">
            Kategori Sıralaması
          </Text>
          <Button
            text="Sıralamayı Kaydet"
            tone="primary"
            onClick={saveOrder}
            disabled={saving}
            loading={saving}
          />
        </Flex>

        <Stack space={2}>
          {categories.map((cat, index) => (
            <Card key={cat._id} padding={3} tone="default" border>
              <Flex justify="space-between" align="center">
                <Text size={1} weight="medium">
                  {index + 1}. {cat.name?.tr || cat.name?.en || 'İsimsiz'}
                </Text>
                <Flex gap={2}>
                  <Button
                    text="↑"
                    mode="ghost"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                  />
                  <Button
                    text="↓"
                    mode="ghost"
                    onClick={() => moveDown(index)}
                    disabled={index === categories.length - 1}
                  />
                </Flex>
              </Flex>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}

