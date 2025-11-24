import {definePlugin} from 'sanity'
import {ExcelImportTool} from './excelImport/ExcelImportTool'

export const excelImportTool = definePlugin({
  name: 'excel-import',
  tools: [
    {
      name: 'excel-import',
      title: "Excel'den Ürün Yükle",
      component: ExcelImportTool,
    },
  ],
})
