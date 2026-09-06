import {describe, it, expect, vi} from 'vitest'
import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react'
import {ProductMaterials} from '../components/product/ProductMaterials'
import {I18nProvider} from '../i18n'

const mockMaterialsMany = [
  {image: 'img1.jpg', name: {tr: 'Kumaş 1', en: 'Fabric 1'}},
  {image: 'img2.jpg', name: {tr: 'Kumaş 2', en: 'Fabric 2'}},
  {image: 'img3.jpg', name: {tr: 'Kumaş 3', en: 'Fabric 3'}},
  {image: 'img4.jpg', name: {tr: 'Kumaş 4', en: 'Fabric 4'}},
  {image: 'img5.jpg', name: {tr: 'Kumaş 5', en: 'Fabric 5'}},
  {image: 'img6.jpg', name: {tr: 'Kumaş 6', en: 'Fabric 6'}},
]

const mockMaterialsFew = [
  {image: 'img1.jpg', name: {tr: 'Kumaş 1', en: 'Fabric 1'}},
  {image: 'img2.jpg', name: {tr: 'Kumaş 2', en: 'Fabric 2'}},
]

describe('ProductMaterials - Mobile Collapsible Animation', () => {
  it('shows "Daha Fazla Göster / Show More" button when materials count > 4 and toggles smoothly', () => {
    const onOpenLightbox = vi.fn()

    render(
      <I18nProvider>
        <ProductMaterials
          mergedGroups={[]}
          grouped={[]}
          flatMaterials={mockMaterialsMany}
          activeMaterialGroup={null}
          activeBookIndex={0}
          imageBorderClass="rounded"
          onSetActiveMaterialGroup={vi.fn()}
          onSetActiveBookIndex={vi.fn()}
          onOpenMaterialLightbox={onOpenLightbox}
        />
      </I18nProvider>
    )

    // Button should initially say "Daha Fazla Göster" / "Show More"
    const buttons = screen.getAllByRole('button', {name: /daha fazla göster|show more/i})
    const bottomButton = buttons.find(b => b.tagName === 'BUTTON')!
    expect(bottomButton).toBeInTheDocument()

    // Click to expand
    fireEvent.click(bottomButton)

    // Now button should say "Daha Az Göster" / "Show Less"
    const showLessButton = screen.getByRole('button', {name: /daha az göster|show less/i})
    expect(showLessButton).toBeInTheDocument()

    // Click to collapse back
    fireEvent.click(showLessButton)
    const collapsedButtons = screen.getAllByRole('button', {name: /daha fazla göster|show more/i})
    expect(collapsedButtons.some(b => b.tagName === 'BUTTON')).toBe(true)
  }, 15000)

  it('does not render "Daha Fazla Göster / Show More" when materials count <= 4', () => {
    render(
      <I18nProvider>
        <ProductMaterials
          mergedGroups={[]}
          grouped={[]}
          flatMaterials={mockMaterialsFew}
          activeMaterialGroup={null}
          activeBookIndex={0}
          imageBorderClass="rounded"
          onSetActiveMaterialGroup={vi.fn()}
          onSetActiveBookIndex={vi.fn()}
          onOpenMaterialLightbox={vi.fn()}
        />
      </I18nProvider>
    )

    expect(
      screen.queryByRole('button', {name: /daha fazla göster|show more/i})
    ).not.toBeInTheDocument()
  })

  it('toggles expansion when clicking the interactive card in mobile carousel and does not show +N or more', () => {
    render(
      <I18nProvider>
        <ProductMaterials
          mergedGroups={[]}
          grouped={[]}
          flatMaterials={mockMaterialsMany}
          activeMaterialGroup={null}
          activeBookIndex={0}
          imageBorderClass="rounded"
          onSetActiveMaterialGroup={vi.fn()}
          onSetActiveBookIndex={vi.fn()}
          onOpenMaterialLightbox={vi.fn()}
        />
      </I18nProvider>
    )

    // Verify that numbers like +2 and text "more" are NOT rendered
    expect(screen.queryByText('+2')).not.toBeInTheDocument()
    expect(screen.queryByText('more')).not.toBeInTheDocument()

    // Find the carousel card (DIV with button role)
    const buttons = screen.getAllByRole('button', {name: /daha fazla göster|show more/i})
    const card = buttons.find(b => b.tagName === 'DIV')!
    expect(card).toBeInTheDocument()

    // Clicking card expands the list
    fireEvent.click(card)
    expect(screen.getByRole('button', {name: /daha az göster|show less/i})).toBeInTheDocument()
  }, 15000)

  it('renders swatch book (kartela) tabs with animated selection', () => {
    const onSetActiveBookIndex = vi.fn()
    const mockGroups = [
      {
        groupTitle: {tr: 'Grup 1', en: 'Group 1'},
        books: [
          {
            bookTitle: {tr: 'Keten Kartelası', en: 'Linen Swatch'},
            materials: [{image: 'img1.jpg', name: {tr: 'Keten 1', en: 'Linen 1'}}],
          },
          {
            bookTitle: {tr: 'Deri Kartelası', en: 'Leather Swatch'},
            materials: [{image: 'img2.jpg', name: {tr: 'Deri 1', en: 'Leather 1'}}],
          },
        ],
      },
    ]

    const {rerender} = render(
      <I18nProvider>
        <ProductMaterials
          mergedGroups={mockGroups}
          grouped={[]}
          flatMaterials={[]}
          activeMaterialGroup={0}
          activeBookIndex={0}
          imageBorderClass="rounded"
          onSetActiveMaterialGroup={vi.fn()}
          onSetActiveBookIndex={onSetActiveBookIndex}
          onOpenMaterialLightbox={vi.fn()}
        />
      </I18nProvider>
    )

    const tab1 = screen.getByRole('tab', {name: /linen swatch|keten kartelası/i})
    const tab2 = screen.getByRole('tab', {name: /leather swatch|deri kartelası/i})
    expect(tab1).toBeInTheDocument()
    expect(tab2).toBeInTheDocument()
    expect(tab1).toHaveAttribute('aria-selected', 'true')
    expect(tab2).toHaveAttribute('aria-selected', 'false')

    fireEvent.click(tab2)
    expect(onSetActiveBookIndex).toHaveBeenCalledWith(1)

    // Rerender with activeBookIndex = 1
    rerender(
      <I18nProvider>
        <ProductMaterials
          mergedGroups={mockGroups}
          grouped={[]}
          flatMaterials={[]}
          activeMaterialGroup={0}
          activeBookIndex={1}
          imageBorderClass="rounded"
          onSetActiveMaterialGroup={vi.fn()}
          onSetActiveBookIndex={onSetActiveBookIndex}
          onOpenMaterialLightbox={vi.fn()}
        />
      </I18nProvider>
    )

    expect(screen.getByRole('tab', {name: /linen swatch|keten kartelası/i})).toHaveAttribute(
      'aria-selected',
      'false'
    )
    expect(screen.getByRole('tab', {name: /leather swatch|deri kartelası/i})).toHaveAttribute(
      'aria-selected',
      'true'
    )

    // New kartela's material is rendered
    expect(screen.getAllByText(/deri 1|leather 1/i).length).toBeGreaterThan(0)
  })
})
