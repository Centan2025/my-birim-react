import { defineField, defineType } from 'sanity'
import R2AssetInput from '../../components/R2AssetInput'

export default defineType({
    name: 'r2Asset',
    title: 'Cloudflare R2 Asset',
    type: 'object',
    components: {
        input: R2AssetInput
    },
    fields: [
        defineField({ name: 'url', title: 'URL', type: 'string' }),
        defineField({ name: 'path', title: 'R2 Path', type: 'string' }),
        defineField({ name: 'width', title: 'Width', type: 'number' }),
        defineField({ name: 'height', title: 'Height', type: 'number' }),
        defineField({ name: 'alt', title: 'Alt Text', type: 'string' }),
        defineField({ name: 'mimeType', title: 'MIME Type', type: 'string' }),
        defineField({ name: 'hotspotX', title: 'Hotspot X', type: 'number' }),
        defineField({ name: 'hotspotY', title: 'Hotspot Y', type: 'number' }),
        defineField({ name: 'cropX', title: 'Crop X', type: 'number' }),
        defineField({ name: 'cropY', title: 'Crop Y', type: 'number' }),
        defineField({ name: 'cropWidth', title: 'Crop Width', type: 'number' }),
        defineField({ name: 'cropHeight', title: 'Crop Height', type: 'number' }),
        defineField({ name: 'hasResponsiveSizes', title: 'Has Responsive Sizes', type: 'boolean', initialValue: false }),
    ],
})
