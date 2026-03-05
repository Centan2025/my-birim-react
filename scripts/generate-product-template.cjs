const XLSX = require('xlsx');
const path = require('path');

// Define the file name
// Place it in the root directory for easier access
const fileName = 'urun_yukleme_sablonu.xlsx';
const filePath = path.join(process.cwd(), '..', fileName);

/**
 * Creates the workbook with 4 sheets: ÜRÜNLER, TASARIMCILAR, PROJELER, MALZEMELER
 */
function generateTemplate() {
    const wb = XLSX.utils.book_new();

    // 1. ÜRÜNLER Sheet
    // Headers: Control, Kategori, ID, Ürün Adı, Tasarımcı, Yıl, Açıklama (TR), Açıklama (EN)
    const productsData = [
        ['CONTROL', 'KATEGORİ', 'ID', 'ÜRÜN ADI', 'TASARIMCI', 'YIL', 'AÇIKLAMA (TR)', 'AÇIKLAMA (EN)'],
        ['(A)', '(B)', '(C)', '(D)', '(E)', '(F)', '(G)', '(H)'],
        ['-', 'Mobilya', 'sandalye-01', 'Ahşap Sandalye', 'Tasarımcı Adı', 2024, 'Harika bir sandalye.', 'A great chair.'],
        ['SON', '', '', '', '', '', '', '']
    ];
    const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, wsProducts, 'ÜRÜNLER');

    // 2. TASARIMCILAR Sheet
    // Headers: Control, ID, Tasarımcı Adı, Biyografi (TR), Biyografi (EN)
    const designersData = [
        ['CONTROL', 'ID', 'TASARIMCI ADI', 'BİYOGRAFİ (TR)', 'BİYOGRAFİ (EN)'],
        ['(A)', '(B)', '(C)', '(D)', '(E)'],
        ['-', 'tasarimci-id', 'Tasarımcı Adı', 'Kısa biyografi tr.', 'Short bio en.'],
        ['SON', '', '', '', '']
    ];
    const wsDesigners = XLSX.utils.aoa_to_sheet(designersData);
    XLSX.utils.book_append_sheet(wb, wsDesigners, 'TASARIMCILAR');

    // 3. PROJELER Sheet
    // Headers: Control, ID, Proje Adı, Yer + Tarih, Açıklama (TR), Açıklama (EN)
    const projectsData = [
        ['CONTROL', 'ID', 'PROJE ADI', 'YER + TARİH', 'AÇIKLAMA (TR)', 'AÇIKLAMA (EN)'],
        ['-', 'proje-id', 'Proje Adı', 'İstanbul, 2023', 'Proje açıklaması...', 'Project description...'],
        ['SON', '', '', '', '', '']
    ];
    const wsProjects = XLSX.utils.aoa_to_sheet(projectsData);
    XLSX.utils.book_append_sheet(wb, wsProjects, 'PROJELER');

    // 4. MALZEMELER Sheet
    // Headers: Control, Malzeme Grubu, Kartela Adı
    const materialsData = [
        ['CONTROL', 'MALZEME GRUBU', 'KARTELA ADI'],
        ['(A)', '(B)', '(C)'],
        ['-', 'Döşeme', 'Keten Serisi'],
        ['SON', '', '']
    ];
    const wsMaterials = XLSX.utils.aoa_to_sheet(materialsData);
    XLSX.utils.book_append_sheet(wb, wsMaterials, 'MALZEMELER');

    // Write the file
    XLSX.writeFile(wb, filePath);
    console.log(`Successfully generated: ${filePath}`);
}

generateTemplate();
