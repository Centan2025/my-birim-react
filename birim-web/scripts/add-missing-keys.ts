// scripts/add-missing-keys.ts
import {getCliClient} from 'sanity/cli'
const client = getCliClient({apiVersion: '2025-01-01'})
const gen = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`

async function run() {
  const docs = await client.fetch(`*[_type=="product" && defined(materialSelections)]{_id, materialSelections}`)
  const tx = client.transaction()
  for (const d of docs) {
    const selections = (d.materialSelections || []).map((sel: any) => ({
      ...sel,
      _key: sel._key || gen(),
      materials: (sel.materials || []).map((m: any) => ({...m, _key: m?._key || gen()})),
    }))
    tx.patch(d._id, {set: {materialSelections: selections}})
  }
  if (docs.length) await tx.commit()
  console.log(`Düzeltildi: ${docs.length} ürün`)
}
run().catch((e)=>{console.error(e);process.exit(1)})