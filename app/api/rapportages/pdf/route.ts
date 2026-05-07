export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { periodeStart, periodeEinde } = await req.json()
    const start = new Date(periodeStart)
    const einde = new Date(periodeEinde)

    const [verkopen, producten, verkoopRegels] = await Promise.all([
      prisma.verkoop.findMany({
        where: { verkochtenOp: { gte: start, lte: einde } },
        include: { regels: { include: { product: { select: { naam: true } } } } },
        orderBy: { verkochtenOp: 'desc' },
      }),
      prisma.product.findMany({
        where: { actief: true },
        select: { naam: true, sku: true, voorraadAantal: true, minVoorraad: true, verkoopprijs: true, inkoopprijs: true },
        orderBy: { naam: 'asc' },
      }),
      prisma.verkoopRegel.groupBy({
        by: ['productId'],
        where: { verkoop: { verkochtenOp: { gte: start, lte: einde } } },
        _sum: { subtotaal: true, aantal: true },
        orderBy: { _sum: { subtotaal: 'desc' } },
        take: 10,
      }),
    ])

    const productNamen = await prisma.product.findMany({
      where: { id: { in: verkoopRegels.map(r => r.productId) } },
      select: { id: true, naam: true },
    })

    const totaalOmzet = verkopen.reduce((s, v) => s + Number(v.totaalBedrag), 0)
    const laagVoorraad = producten.filter(p => p.voorraadAantal <= p.minVoorraad)

    // Gebruik jsPDF (server-side compatibel)
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const W = 210
    const MARGIN = 18
    const COL = W - MARGIN * 2
    let y = MARGIN

    // Kleuren
    const DARK = [13, 15, 18] as [number, number, number]
    const CARD = [19, 22, 27] as [number, number, number]
    const ACCENT = [79, 142, 247] as [number, number, number]
    const GREEN = [52, 211, 153] as [number, number, number]
    const AMBER = [251, 191, 36] as [number, number, number]
    const TEXT = [232, 234, 240] as [number, number, number]
    const MUTED = [122, 127, 142] as [number, number, number]

    // Achtergrond
    doc.setFillColor(...DARK)
    doc.rect(0, 0, W, 297, 'F')

    // Header
    doc.setFillColor(...ACCENT)
    doc.rect(0, 0, W, 36, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('WinkelPro', MARGIN, 14)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Rapportage ${periodeStart} t/m ${periodeEinde}`, MARGIN, 22)
    doc.text(`Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}`, MARGIN, 29)
    y = 46

    // Helper: sectie header
    const sectionHeader = (titel: string) => {
      doc.setFillColor(...CARD)
      doc.rect(MARGIN, y, COL, 8, 'F')
      doc.setTextColor(...ACCENT)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(titel.toUpperCase(), MARGIN + 3, y + 5.5)
      y += 12
    }

    // Helper: stat blok
    const statBlok = (label: string, waarde: string, kleur: [number, number, number] = TEXT, x = MARGIN, breedte = COL) => {
      doc.setFillColor(...CARD)
      doc.roundedRect(x, y, breedte, 14, 2, 2, 'F')
      doc.setTextColor(...MUTED)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(label.toUpperCase(), x + 4, y + 5)
      doc.setTextColor(...kleur)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(waarde, x + 4, y + 11.5)
    }

    // ── Samenvatting stats ───────────────────────────────────────────────────
    sectionHeader('Samenvatting')
    const kolW = (COL - 6) / 4
    statBlok('Totale omzet', `EUR ${totaalOmzet.toFixed(2)}`, GREEN, MARGIN, kolW)
    statBlok('Verkopen', String(verkopen.length), TEXT, MARGIN + kolW + 2, kolW)
    statBlok('Producten', String(producten.length), TEXT, MARGIN + (kolW + 2) * 2, kolW)
    statBlok('Lage voorraad', String(laagVoorraad.length), laagVoorraad.length > 0 ? AMBER : GREEN, MARGIN + (kolW + 2) * 3, kolW)
    y += 20

    // ── Top producten ────────────────────────────────────────────────────────
    sectionHeader('Top 10 producten')
    const tpHeaders = ['#', 'Product', 'Stuks', 'Omzet (EUR)']
    const tpWidths = [8, COL - 54, 18, 28]
    let tx = MARGIN
    doc.setFillColor(37, 40, 48)
    doc.rect(MARGIN, y - 2, COL, 7, 'F')
    tpHeaders.forEach((h, i) => {
      doc.setTextColor(...MUTED)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text(h, tx + 2, y + 3.5)
      tx += tpWidths[i]
    })
    y += 7

    verkoopRegels.forEach((r, idx) => {
      const prod = productNamen.find(p => p.id === r.productId)
      doc.setFillColor(idx % 2 === 0 ? 19 : 26, idx % 2 === 0 ? 22 : 29, idx % 2 === 0 ? 27 : 36)
      doc.rect(MARGIN, y, COL, 6, 'F')
      const vals = [
        String(idx + 1),
        prod?.naam ?? '–',
        String(r._sum.aantal ?? 0),
        `${Number(r._sum.subtotaal ?? 0).toFixed(2)}`,
      ]
      let vx = MARGIN
      vals.forEach((v, i) => {
        doc.setTextColor(idx === 0 ? 79 : 232, idx === 0 ? 142 : 234, idx === 0 ? 247 : 240)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', i === 0 ? 'bold' : 'normal')
        const maxW = tpWidths[i] - 3
        const txt = doc.splitTextToSize(v, maxW)[0]
        doc.text(txt, vx + 2, y + 4)
        vx += tpWidths[i]
      })
      y += 6
    })
    y += 6

    // ── Lage voorraad ────────────────────────────────────────────────────────
    if (laagVoorraad.length > 0) {
      if (y > 220) { doc.addPage(); doc.setFillColor(...DARK); doc.rect(0, 0, W, 297, 'F'); y = MARGIN }
      sectionHeader('Lage voorraad waarschuwingen')
      laagVoorraad.forEach((p, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 61 : 45, idx % 2 === 0 ? 26 : 20, idx % 2 === 0 ? 0 : 0)
        doc.rect(MARGIN, y, COL, 7, 'F')
        doc.setTextColor(...AMBER)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.text(`${p.naam} (${p.sku})`, MARGIN + 3, y + 4.5)
        doc.setFont('helvetica', 'normal')
        doc.text(`Voorraad: ${p.voorraadAantal} / Min: ${p.minVoorraad}`, MARGIN + COL - 35, y + 4.5)
        y += 7
      })
      y += 4
    }

    // ── Recente verkopen (max 20) ────────────────────────────────────────────
    if (y > 200) { doc.addPage(); doc.setFillColor(...DARK); doc.rect(0, 0, W, 297, 'F'); y = MARGIN }
    sectionHeader('Recente verkopen')
    const rvHeaders = ['Datum', 'Producten', 'Methode', 'Totaal (EUR)']
    const rvWidths = [24, COL - 72, 22, 26]
    let rx = MARGIN
    doc.setFillColor(37, 40, 48)
    doc.rect(MARGIN, y - 2, COL, 7, 'F')
    rvHeaders.forEach((h, i) => {
      doc.setTextColor(...MUTED)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text(h, rx + 2, y + 3.5)
      rx += rvWidths[i]
    })
    y += 7

    verkopen.slice(0, 20).forEach((v, idx) => {
      if (y > 270) { doc.addPage(); doc.setFillColor(...DARK); doc.rect(0, 0, W, 297, 'F'); y = MARGIN }
      doc.setFillColor(idx % 2 === 0 ? 19 : 26, idx % 2 === 0 ? 22 : 29, idx % 2 === 0 ? 27 : 36)
      doc.rect(MARGIN, y, COL, 6, 'F')
      const productStr = v.regels.map(r => r.product.naam).slice(0, 2).join(', ')
      const vals = [
        v.verkochtenOp.toLocaleDateString('nl-NL'),
        productStr + (v.regels.length > 2 ? ` +${v.regels.length - 2}` : ''),
        v.betalingsMethode,
        Number(v.totaalBedrag).toFixed(2),
      ]
      let vx = MARGIN
      vals.forEach((val, i) => {
        doc.setTextColor(...TEXT)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        const maxW = rvWidths[i] - 3
        const txt = doc.splitTextToSize(val, maxW)[0]
        doc.text(txt, vx + 2, y + 4)
        vx += rvWidths[i]
      })
      y += 6
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFillColor(19, 22, 27)
      doc.rect(0, 287, W, 10, 'F')
      doc.setTextColor(...MUTED)
      doc.setFontSize(7)
      doc.text('WinkelPro Inventarisatie Systeem', MARGIN, 293)
      doc.text(`Pagina ${i} van ${pageCount}`, W - MARGIN, 293, { align: 'right' })
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rapportage-${periodeStart}-${periodeEinde}.pdf"`,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
