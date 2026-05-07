export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const verkoop = await prisma.verkoop.findUnique({
      where: { id: params.id },
      include: { gebruiker: { select: { naam: true } }, regels: { include: { product: { select: { naam: true, sku: true } } } } },
    })
    if (!verkoop) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 180] })

    const W = 80; const M = 6; let y = M
    const DARK = [13, 15, 18] as [number,number,number]
    const ACCENT = [79, 142, 247] as [number,number,number]
    const TEXT = [232, 234, 240] as [number,number,number]
    const MUTED = [122, 127, 142] as [number,number,number]

    doc.setFillColor(...DARK); doc.rect(0, 0, W, 180, 'F')

    // Header
    doc.setFillColor(...ACCENT); doc.rect(0, 0, W, 18, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text('WinkelPro', W/2, 8, { align: 'center' })
    doc.setFontSize(7); doc.setFont('helvetica', 'normal')
    doc.text('Verkoopbon', W/2, 14, { align: 'center' })
    y = 24

    // Info
    doc.setFontSize(7); doc.setTextColor(...MUTED)
    doc.text(`Bon #${params.id.slice(-8).toUpperCase()}`, M, y); y += 5
    doc.text(`Datum: ${verkoop.verkochtenOp.toLocaleDateString('nl-NL', { day:'2-digit', month:'2-digit', year:'numeric' })}`, M, y); y += 5
    doc.text(`Medewerker: ${verkoop.gebruiker.naam}`, M, y); y += 5
    doc.text(`Betaling: ${verkoop.betalingsMethode}`, M, y); y += 8

    // Lijn
    doc.setDrawColor(...ACCENT); doc.setLineWidth(0.3); doc.line(M, y, W-M, y); y += 5

    // Regels
    verkoop.regels.forEach(r => {
      doc.setTextColor(...TEXT); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
      const naam = doc.splitTextToSize(r.product.naam, W - M*2 - 18)[0]
      doc.text(naam, M, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`€${Number(r.subtotaal).toFixed(2)}`, W-M, y, { align: 'right' })
      y += 5
      doc.setTextColor(...MUTED); doc.setFontSize(6.5)
      doc.text(`${r.aantal}x € ${Number(r.eenheidsprijs).toFixed(2)}`, M+3, y); y += 6
    })

    y += 2; doc.setDrawColor(...ACCENT); doc.line(M, y, W-M, y); y += 5

    // Totaal
    doc.setTextColor(...TEXT); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text('TOTAAL', M, y)
    doc.text(`€ ${Number(verkoop.totaalBedrag).toFixed(2)}`, W-M, y, { align: 'right' })
    y += 10

    // Footer
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED)
    doc.text('Bedankt voor uw aankoop!', W/2, y, { align: 'center' }); y += 5
    doc.text('WinkelPro Inventarisatie Systeem', W/2, y, { align: 'center' })

    // Trim pagina hoogte
    const pagH = Math.min(y + 10, 180)
    const finalDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, pagH] })
    finalDoc.setFillColor(...DARK); finalDoc.rect(0,0,80,pagH,'F')
    // Kopieer — simpel: gebruik gewoon de originele doc
    const buf = Buffer.from(doc.output('arraybuffer'))
    return new NextResponse(buf, {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="bon-${params.id.slice(-8)}.pdf"` }
    })
  } catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }) }
}
