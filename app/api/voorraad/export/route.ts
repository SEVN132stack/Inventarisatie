export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const producten = await prisma.product.findMany({
      where: { actief: true },
      include: { categorie: true, leverancier: true },
      orderBy: { naam: 'asc' },
    })

    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    wb.creator = 'WinkelPro'
    wb.created = new Date()

    const ws = wb.addWorksheet('Voorraadlijst')

    // Kolombreedte
    ws.columns = [
      { key: 'naam',        width: 32 },
      { key: 'sku',         width: 14 },
      { key: 'categorie',   width: 18 },
      { key: 'leverancier', width: 22 },
      { key: 'voorraad',    width: 12 },
      { key: 'min',         width: 10 },
      { key: 'status',      width: 12 },
      { key: 'eenheid',     width: 10 },
      { key: 'inkoop',      width: 14 },
      { key: 'verkoop',     width: 14 },
      { key: 'marge',       width: 11 },
      { key: 'waarde',      width: 16 },
    ]

    // ── Titelrij ────────────────────────────────────────────────────────────
    ws.mergeCells('A1:L1')
    const titelCell = ws.getCell('A1')
    titelCell.value = `WinkelPro — Voorraadlijst  |  Exportdatum: ${new Date().toLocaleDateString('nl-NL')}`
    titelCell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } }
    titelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F8EF7' } }
    titelCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(1).height = 26

    ws.addRow([]) // lege rij

    // ── Kolomkoppen ─────────────────────────────────────────────────────────
    const headers = [
      'Productnaam', 'SKU', 'Categorie', 'Leverancier',
      'Voorraad', 'Min.', 'Status', 'Eenheid',
      'Inkoopprijs', 'Verkoopprijs', 'Marge %', 'Voorraadwaarde',
    ]
    const headerRij = ws.addRow(headers)
    headerRij.height = 20
    headerRij.eachCell(cell => {
      cell.font = { bold: true, size: 10, color: { argb: 'FFE8EAF0' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF252830' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF4F8EF7' } },
      }
    })

    // ── Data ────────────────────────────────────────────────────────────────
    let totaalWaarde = 0
    let aantalLaag = 0
    let aantalLeeg = 0

    producten.forEach((p, i) => {
      const laag = p.voorraadAantal <= p.minVoorraad && p.voorraadAantal > 0
      const leeg = p.voorraadAantal === 0
      const marge = Number(p.verkoopprijs) > 0
        ? ((Number(p.verkoopprijs) - Number(p.inkoopprijs)) / Number(p.verkoopprijs) * 100)
        : 0
      const waarde = Number(p.inkoopprijs) * p.voorraadAantal
      totaalWaarde += waarde
      if (laag) aantalLaag++
      if (leeg) aantalLeeg++

      const status = leeg ? 'LEEG' : laag ? 'LAAG' : 'OK'

      const rij = ws.addRow({
        naam:        p.naam,
        sku:         p.sku,
        categorie:   p.categorie.naam,
        leverancier: p.leverancier?.naam ?? '–',
        voorraad:    p.voorraadAantal,
        min:         p.minVoorraad,
        status,
        eenheid:     p.eenheid,
        inkoop:      Number(p.inkoopprijs),
        verkoop:     Number(p.verkoopprijs),
        marge:       marge / 100, // als decimaal voor percentage-opmaak
        waarde,
      })

      // Afwisselende achtergrond
      const bgArgb = i % 2 === 0 ? 'FF13161B' : 'FF1A1D24'

      // Statuskleur
      const statusKleur = leeg ? 'FFF87171' : laag ? 'FFFBBF24' : 'FF34D399'

      rij.eachCell({ includeEmpty: true }, (cell, colNr) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } }
        cell.font = { size: 10, color: { argb: 'FFE8EAF0' } }
        cell.alignment = { vertical: 'middle' }

        // Status kolom
        if (colNr === 7) {
          cell.font = { bold: true, size: 10, color: { argb: statusKleur } }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
        // Voorraad kolom
        if (colNr === 5) {
          cell.font = { bold: true, size: 10, color: { argb: statusKleur } }
          cell.alignment = { horizontal: 'right', vertical: 'middle' }
        }
        // Getal kolommen rechts uitlijnen
        if ([5, 6, 9, 10, 11, 12].includes(colNr)) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' }
        }
      })

      // Getalopmaak
      rij.getCell('inkoop').numFmt  = '€ #,##0.00'
      rij.getCell('verkoop').numFmt = '€ #,##0.00'
      rij.getCell('marge').numFmt   = '0.0%'
      rij.getCell('waarde').numFmt  = '€ #,##0.00'
      rij.height = 18
    })

    // ── Totaalrij ───────────────────────────────────────────────────────────
    ws.addRow([])
    const totaalRij = ws.addRow({
      naam:   `TOTAAL (${producten.length} producten)`,
      waarde: totaalWaarde,
    })
    totaalRij.getCell('naam').font   = { bold: true, size: 10, color: { argb: 'FF34D399' } }
    totaalRij.getCell('naam').fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D3326' } }
    totaalRij.getCell('waarde').font = { bold: true, size: 10, color: { argb: 'FF34D399' } }
    totaalRij.getCell('waarde').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D3326' } }
    totaalRij.getCell('waarde').numFmt = '€ #,##0.00'
    totaalRij.getCell('waarde').alignment = { horizontal: 'right' }
    // Vul lege cellen in totaalrij met achtergrond
    ;['sku','categorie','leverancier','voorraad','min','status','eenheid','inkoop','verkoop','marge'].forEach(k => {
      const c = totaalRij.getCell(k)
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D3326' } }
    })
    totaalRij.height = 22

    // ── Samenvattingblad ────────────────────────────────────────────────────
    const ws2 = wb.addWorksheet('Samenvatting')
    ws2.columns = [{ key: 'label', width: 28 }, { key: 'waarde', width: 20 }]

    ws2.mergeCells('A1:B1')
    ws2.getCell('A1').value = 'Voorraad Samenvatting'
    ws2.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF4F8EF7' } }
    ws2.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D0F12' } }
    ws2.getCell('A1').alignment = { horizontal: 'center' }
    ws2.getRow(1).height = 28
    ws2.addRow([])

    const samData = [
      ['Exportdatum',         new Date().toLocaleDateString('nl-NL')],
      ['Totaal actieve producten', producten.length],
      ['Totale voorraadwaarde',   `€ ${totaalWaarde.toFixed(2)}`],
      ['Producten OK',            producten.length - aantalLaag - aantalLeeg],
      ['Producten laag',          aantalLaag],
      ['Producten leeg',          aantalLeeg],
    ]

    const labelKleuren: Record<number, string> = {
      3: 'FF34D399', 4: 'FF34D399', 5: 'FFFBBF24', 6: 'FFF87171',
    }

    samData.forEach(([label, waarde], idx) => {
      const r = ws2.addRow([label, waarde])
      r.getCell(1).font = { bold: true, color: { argb: 'FF7A7F8E' } }
      r.getCell(2).font = { bold: true, color: { argb: labelKleuren[idx + 1] ?? 'FFE8EAF0' } }
      r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF13161B' } }
      r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF13161B' } }
      r.height = 20
    })

    // Genereer buffer en stuur terug
    const buffer = await wb.xlsx.writeBuffer()
    const datum = new Date().toISOString().slice(0, 10)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="voorraadlijst-${datum}.xlsx"`,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
