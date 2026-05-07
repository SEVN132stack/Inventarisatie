export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { LOGO_BASE64, LOGO_MEDIA_TYPE } from '../../../../lib/logo-base64'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const verkoop = await prisma.verkoop.findUnique({
      where: { id: params.id },
      include: {
        gebruiker: { select: { naam: true } },
        regels: { include: { product: { select: { naam: true, sku: true } } } }
      },
    })
    if (!verkoop) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const W  = 210
    const H  = 297
    const ML = 20
    const MR = 20
    const COL = W - ML - MR
    let y = 20

    // Kleuren
    const DARK   = [13, 15, 18]    as [number,number,number]
    const CARD   = [19, 22, 27]    as [number,number,number]
    const ACCENT = [79, 142, 247]  as [number,number,number]
    const GREEN  = [52, 211, 153]  as [number,number,number]
    const TEXT   = [232, 234, 240] as [number,number,number]
    const MUTED  = [122, 127, 142] as [number,number,number]
    const DIM    = [69, 75, 90]    as [number,number,number]

    // ── Achtergrond ───────────────────────────────────────────────────────────
    doc.setFillColor(...DARK)
    doc.rect(0, 0, W, H, 'F')

    // ── Header balk ───────────────────────────────────────────────────────────
    doc.setFillColor(...ACCENT)
    doc.rect(0, 0, W, 48, 'F')

    // Logo (cirkel crop via jsPDF — voeg afbeelding toe en clip)
    const logoSize = 38
    const logoX = ML
    const logoY = 5
    doc.addImage(LOGO_BASE64, LOGO_MEDIA_TYPE, logoX, logoY, logoSize, logoSize)

    // Bedrijfsnaam naast logo
    const tekstX = ML + logoSize + 8
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('The Fantasy Realm', tekstX, 20)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Diezerplein 27  |  8021 CT  Zwolle', tekstX, 29)
    doc.text('Verkoopbon / Kassabon', tekstX, 38)

    // Bonnummer + datum rechts in header
    doc.setFontSize(9)
    doc.text(`Bon #${params.id.slice(-8).toUpperCase()}`, W - MR, 20, { align: 'right' })
    doc.text(verkoop.verkochtenOp.toLocaleDateString('nl-NL', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }), W - MR, 29, { align: 'right' })

    y = 62

    // ── Info blok ─────────────────────────────────────────────────────────────
    doc.setFillColor(...CARD)
    doc.roundedRect(ML, y, COL, 26, 3, 3, 'F')

    const infoItems = [
      ['Bonnummer',     `#${params.id.slice(-8).toUpperCase()}`],
      ['Datum',         verkoop.verkochtenOp.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })],
      ['Tijd',          verkoop.verkochtenOp.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })],
      ['Medewerker',    verkoop.gebruiker.naam],
      ['Betaalmethode', verkoop.betalingsMethode],
    ]

    const kolBreedte = COL / infoItems.length
    infoItems.forEach(([label, waarde], i) => {
      const x = ML + i * kolBreedte + 6
      doc.setTextColor(...DIM)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(label.toUpperCase(), x, y + 8)
      doc.setTextColor(...TEXT)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(waarde, x, y + 18)
    })

    y += 36

    // ── Tabel header ──────────────────────────────────────────────────────────
    doc.setFillColor(37, 40, 48)
    doc.rect(ML, y, COL, 9, 'F')

    const xPos = {
      omschrijving: ML + 4,
      aantal:       ML + 74,
      eenhprijs:    ML + 94,
      btw:          ML + 126,
      btwbedrag:    ML + 148,
      subtotaal:    W - MR - 4,
    }

    doc.setTextColor(...MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('OMSCHRIJVING', xPos.omschrijving, y + 6)
    doc.text('AANTAL',       xPos.aantal,       y + 6)
    doc.text('STUKSPRIJS',   xPos.eenhprijs,    y + 6)
    doc.text('BTW %',        xPos.btw,          y + 6)
    doc.text('BTW BEDRAG',   xPos.btwbedrag,    y + 6)
    doc.text('TOTAAL',       xPos.subtotaal,    y + 6, { align: 'right' })

    y += 9

    // ── Productregels ─────────────────────────────────────────────────────────
    let totaalExBtw   = 0
    let totaalBtwBedrag = 0
    const btwGroepen: Record<string, { grondslag: number; bedrag: number }> = {}

    verkoop.regels.forEach((r, idx) => {
      const regelH = 14
      doc.setFillColor(...(idx % 2 === 0 ? CARD : DARK))
      doc.rect(ML, y, COL, regelH, 'F')

      const btwPct    = Number(r.btw)
      const eenhprijs = Number(r.eenheidsprijs)
      const subtotaal = Number(r.subtotaal)

      const exBtwFactor = 1 + btwPct / 100
      const exBtw       = subtotaal / exBtwFactor
      const btwBedrag   = subtotaal - exBtw

      totaalExBtw     += exBtw
      totaalBtwBedrag += btwBedrag

      const key = `${btwPct.toFixed(0)}%`
      if (!btwGroepen[key]) btwGroepen[key] = { grondslag: 0, bedrag: 0 }
      btwGroepen[key].grondslag += exBtw
      btwGroepen[key].bedrag    += btwBedrag

      // Productnaam
      const naam = doc.splitTextToSize(r.product.naam, 66)[0]
      doc.setTextColor(...TEXT)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.text(naam, xPos.omschrijving, y + 6)

      // SKU
      doc.setTextColor(...DIM)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'normal')
      doc.text(r.product.sku, xPos.omschrijving, y + 11)

      // Kolommen
      doc.setTextColor(...TEXT)
      doc.setFontSize(8.5)
      doc.text(String(r.aantal),              xPos.aantal,    y + 8)
      doc.text(`€ ${eenhprijs.toFixed(2)}`,   xPos.eenhprijs, y + 8)
      doc.text(`${btwPct.toFixed(0)}%`,        xPos.btw,       y + 8)
      doc.text(`€ ${btwBedrag.toFixed(2)}`,   xPos.btwbedrag, y + 8)
      doc.text(`€ ${subtotaal.toFixed(2)}`,   xPos.subtotaal, y + 8, { align: 'right' })

      y += regelH
    })

    y += 6

    // ── Scheidingslijn ────────────────────────────────────────────────────────
    doc.setDrawColor(...ACCENT)
    doc.setLineWidth(0.4)
    doc.line(ML, y, W - MR, y)
    y += 8

    // ── Totaaloverzicht ───────────────────────────────────────────────────────
    const totaalIncBtw  = Number(verkoop.totaalBedrag)
    const kortingBedrag = Number(verkoop.kortingBedrag ?? 0)

    const totaalRijen: { label: string; waarde: string; kleur: [number,number,number]; groot?: boolean }[] = [
      { label: 'Subtotaal (excl. BTW)', waarde: `€ ${totaalExBtw.toFixed(2)}`,     kleur: MUTED },
      { label: 'BTW',                   waarde: `€ ${totaalBtwBedrag.toFixed(2)}`,  kleur: MUTED },
      ...(kortingBedrag > 0 ? [{ label: 'Korting', waarde: `- € ${kortingBedrag.toFixed(2)}`, kleur: [251,191,36] as [number,number,number] }] : []),
      { label: 'TOTAAL (incl. BTW)',    waarde: `€ ${totaalIncBtw.toFixed(2)}`,     kleur: GREEN, groot: true },
    ]

    totaalRijen.forEach(rij => {
      doc.setTextColor(...rij.kleur)
      doc.setFontSize(rij.groot ? 13 : 9)
      doc.setFont('helvetica', rij.groot ? 'bold' : 'normal')
      doc.text(rij.label,  W - MR - 80, y)
      doc.text(rij.waarde, W - MR,      y, { align: 'right' })
      y += rij.groot ? 11 : 7
    })

    y += 8

    // ── BTW specificatie ──────────────────────────────────────────────────────
    const btwRijen = Object.keys(btwGroepen).length
    const btwBlokH = 12 + btwRijen * 7 + 6
    doc.setFillColor(...CARD)
    doc.roundedRect(ML, y, 110, btwBlokH, 3, 3, 'F')

    doc.setTextColor(...DIM)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('BTW SPECIFICATIE', ML + 5, y + 8)
    doc.text('TARIEF',     ML + 5,  y + 15)
    doc.text('GRONDSLAG',  ML + 30, y + 15)
    doc.text('BTW',        ML + 62, y + 15)
    doc.text('TOTAAL',     ML + 86, y + 15)

    let btwY = y + 22
    Object.entries(btwGroepen).forEach(([tarief, data]) => {
      doc.setTextColor(...TEXT)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.text(tarief,                                          ML + 5,  btwY)
      doc.text(`€ ${data.grondslag.toFixed(2)}`,               ML + 30, btwY)
      doc.text(`€ ${data.bedrag.toFixed(2)}`,                  ML + 62, btwY)
      doc.text(`€ ${(data.grondslag + data.bedrag).toFixed(2)}`, ML + 86, btwY)
      btwY += 7
    })

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = H - 22
    doc.setDrawColor(37, 40, 48)
    doc.setLineWidth(0.3)
    doc.line(ML, footerY, W - MR, footerY)

    // Klein logo in footer
    doc.addImage(LOGO_BASE64, LOGO_MEDIA_TYPE, ML, footerY + 4, 10, 10)

    doc.setTextColor(...DIM)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('The Fantasy Realm', ML + 13, footerY + 10)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Bedankt voor uw aankoop! — Diezerplein 27, 8021 CT Zwolle', ML + 13, footerY + 16)

    const buf = Buffer.from(doc.output('arraybuffer'))
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bon-${params.id.slice(-8)}.pdf"`,
      },
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
