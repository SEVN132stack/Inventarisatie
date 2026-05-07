export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { periodeStart, periodeEinde } = await req.json()
    const start = new Date(periodeStart)
    const einde = new Date(periodeEinde)

    // Haal alle data op
    const [verkopen, producten, verkoopRegels] = await Promise.all([
      prisma.verkoop.findMany({
        where: { verkochtenOp: { gte: start, lte: einde } },
        include: { gebruiker: { select: { naam: true } }, regels: { include: { product: { select: { naam: true, sku: true } } } } },
        orderBy: { verkochtenOp: 'desc' },
      }),
      prisma.product.findMany({
        where: { actief: true },
        include: { categorie: true },
        orderBy: { naam: 'asc' },
      }),
      prisma.verkoopRegel.groupBy({
        by: ['productId'],
        where: { verkoop: { verkochtenOp: { gte: start, lte: einde } } },
        _sum: { subtotaal: true, aantal: true },
        orderBy: { _sum: { subtotaal: 'desc' } },
      }),
    ])

    const productNamen = await prisma.product.findMany({
      where: { id: { in: verkoopRegels.map(r => r.productId) } },
      select: { id: true, naam: true, sku: true },
    })

    // Dynamisch importeren voor Next.js compatibiliteit
    const ExcelJS = (await import('exceljs')).default

    const wb = new ExcelJS.Workbook()
    wb.creator = 'WinkelPro'
    wb.created = new Date()

    // ── Blad 1: Samenvatting ─────────────────────────────────────────────────
    const ws1 = wb.addWorksheet('Samenvatting')
    ws1.columns = [
      { key: 'label', width: 30 },
      { key: 'waarde', width: 20 },
    ]

    const totaalOmzet = verkopen.reduce((s, v) => s + Number(v.totaalBedrag), 0)

    // Titel
    ws1.mergeCells('A1:B1')
    ws1.getCell('A1').value = `WinkelPro Rapportage — ${periodeStart} t/m ${periodeEinde}`
    ws1.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF4F8EF7' } }
    ws1.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D0F12' } }
    ws1.getCell('A1').alignment = { horizontal: 'center' }
    ws1.getRow(1).height = 28

    ws1.addRow([])

    const samenvattingData = [
      ['Periode', `${periodeStart} t/m ${periodeEinde}`],
      ['Totale omzet', `€ ${totaalOmzet.toFixed(2)}`],
      ['Aantal verkopen', verkopen.length],
      ['Actieve producten', producten.length],
      ['Lage voorraad', producten.filter(p => p.voorraadAantal <= p.minVoorraad).length],
    ]

    samenvattingData.forEach(([label, waarde]) => {
      const row = ws1.addRow([label, waarde])
      row.getCell(1).font = { bold: true, color: { argb: 'FF7A7F8E' } }
      row.getCell(2).font = { bold: true, color: { argb: 'FFE8EAF0' } }
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF13161B' } }
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF13161B' } }
      row.height = 20
    })

    // ── Blad 2: Verkopen ─────────────────────────────────────────────────────
    const ws2 = wb.addWorksheet('Verkopen')
    ws2.columns = [
      { header: 'Datum', key: 'datum', width: 18 },
      { header: 'Producten', key: 'producten', width: 35 },
      { header: 'Medewerker', key: 'medewerker', width: 18 },
      { header: 'Betaalmethode', key: 'methode', width: 16 },
      { header: 'Totaal (€)', key: 'totaal', width: 14 },
    ]

    // Header styling
    const headerRow = ws2.getRow(1)
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFE8EAF0' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF252830' } }
      cell.alignment = { horizontal: 'center' }
    })
    headerRow.height = 22

    verkopen.forEach((v, i) => {
      const row = ws2.addRow({
        datum: v.verkochtenOp.toLocaleDateString('nl-NL'),
        producten: v.regels.map(r => `${r.product.naam} (${r.aantal}x)`).join(', '),
        medewerker: v.gebruiker.naam,
        methode: v.betalingsMethode,
        totaal: Number(v.totaalBedrag).toFixed(2),
      })
      row.getCell('totaal').numFmt = '€ #,##0.00'
      const bg = i % 2 === 0 ? 'FF13161B' : 'FF1A1D24'
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
        cell.font = { color: { argb: 'FFE8EAF0' } }
      })
    })

    // Totaalrij
    const totaalRow = ws2.addRow({ datum: 'TOTAAL', totaal: totaalOmzet.toFixed(2) })
    totaalRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FF34D399' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D3326' } }
    })

    // ── Blad 3: Voorraad ─────────────────────────────────────────────────────
    const ws3 = wb.addWorksheet('Voorraad')
    ws3.columns = [
      { header: 'Naam', key: 'naam', width: 30 },
      { header: 'SKU', key: 'sku', width: 14 },
      { header: 'Categorie', key: 'categorie', width: 18 },
      { header: 'Voorraad', key: 'voorraad', width: 12 },
      { header: 'Min.', key: 'min', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Inkoopprijs', key: 'inkoop', width: 14 },
      { header: 'Verkoopprijs', key: 'verkoop', width: 14 },
      { header: 'Marge %', key: 'marge', width: 12 },
    ]

    ws3.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFE8EAF0' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF252830' } }
    })
    ws3.getRow(1).height = 22

    producten.forEach((p, i) => {
      const laag = p.voorraadAantal <= p.minVoorraad
      const marge = ((Number(p.verkoopprijs) - Number(p.inkoopprijs)) / Number(p.verkoopprijs) * 100)
      const row = ws3.addRow({
        naam: p.naam,
        sku: p.sku,
        categorie: p.categorie.naam,
        voorraad: p.voorraadAantal,
        min: p.minVoorraad,
        status: laag ? 'LAAG' : 'OK',
        inkoop: Number(p.inkoopprijs).toFixed(2),
        verkoop: Number(p.verkoopprijs).toFixed(2),
        marge: marge.toFixed(1) + '%',
      })
      const bg = i % 2 === 0 ? 'FF13161B' : 'FF1A1D24'
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
        cell.font = { color: { argb: laag ? 'FFFBBF24' : 'FFE8EAF0' } }
      })
    })

    // ── Blad 4: Top producten ────────────────────────────────────────────────
    const ws4 = wb.addWorksheet('Top producten')
    ws4.columns = [
      { header: '#', key: 'rank', width: 6 },
      { header: 'Product', key: 'naam', width: 30 },
      { header: 'SKU', key: 'sku', width: 14 },
      { header: 'Stuks verkocht', key: 'stuks', width: 16 },
      { header: 'Omzet (€)', key: 'omzet', width: 14 },
    ]
    ws4.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFE8EAF0' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF252830' } }
    })
    ws4.getRow(1).height = 22

    verkoopRegels.forEach((r, i) => {
      const prod = productNamen.find(p => p.id === r.productId)
      const row = ws4.addRow({
        rank: i + 1,
        naam: prod?.naam ?? '–',
        sku: prod?.sku ?? '–',
        stuks: r._sum.aantal ?? 0,
        omzet: Number(r._sum.subtotaal ?? 0).toFixed(2),
      })
      const bg = i % 2 === 0 ? 'FF13161B' : 'FF1A1D24'
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
        cell.font = { color: { argb: i === 0 ? 'FF4F8EF7' : 'FFE8EAF0' } }
      })
    })

    // Genereer buffer
    const buffer = await wb.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rapportage-${periodeStart}-${periodeEinde}.xlsx"`,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
