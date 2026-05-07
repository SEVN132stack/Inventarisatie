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

    const W   = 210
    const H   = 297
    const ML  = 20
    const MR  = 20
    const COL = W - ML - MR
    let y = 20

    // Kleurenpalet — oranje header, witte achtergrond
    const WIT      = [255, 255, 255] as [number,number,number]
    const ORANJE   = [220, 100, 20]  as [number,number,number]
    const ORANJE_L = [245, 140, 50]  as [number,number,number]  // licht oranje accenten
    const ZWART    = [30, 30, 30]    as [number,number,number]
    const GRIJS    = [100, 100, 100] as [number,number,number]
    const GRIJS_L  = [180, 180, 180] as [number,number,number]
    const GRIJS_BG = [245, 245, 245] as [number,number,number]
    const GROEN    = [34, 160, 90]   as [number,number,number]

    // ── Witte achtergrond ─────────────────────────────────────────────────────
    doc.setFillColor(...WIT)
    doc.rect(0, 0, W, H, 'F')

    // ── Oranje header balk ────────────────────────────────────────────────────
    doc.setFillColor(...ORANJE)
    doc.rect(0, 0, W, 48, 'F')

    // Logo
    const logoSize = 38
    doc.addImage(LOGO_BASE64, LOGO_MEDIA_TYPE, ML, 5, logoSize, logoSize)

    // Bedrijfsnaam
    const tekstX = ML + logoSize + 8
    doc.setTextColor(...WIT)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('The Fantasy Realm', tekstX, 20)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Diezerplein 27  |  8021 CT  Zwolle', tekstX, 29)
    doc.text('Verkoopbon / Kassabon', tekstX, 38)

    // Bonnummer + datum rechts
    doc.setFontSize(9)
    doc.text(`Bon #${params.id.slice(-8).toUpperCase()}`, W - MR, 20, { align: 'right' })
    doc.text(verkoop.verkochtenOp.toLocaleDateString('nl-NL', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }), W - MR, 29, { align: 'right' })

    y = 62

    // ── Info blok (lichtgrijs) ────────────────────────────────────────────────
    doc.setFillColor(...GRIJS_BG)
    doc.roundedRect(ML, y, COL, 26, 3, 3, 'F')
    doc.setDrawColor(...GRIJS_L)
    doc.setLineWidth(0.3)
    doc.roundedRect(ML, y, COL, 26, 3, 3, 'S')

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
      doc.setTextColor(...GRIJS)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(label.toUpperCase(), x, y + 8)
      doc.setTextColor(...ZWART)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(waarde, x, y + 18)
    })

    y += 36

    // ── Tabel header (oranje) ─────────────────────────────────────────────────
    doc.setFillColor(...ORANJE)
    doc.rect(ML, y, COL, 9, 'F')

    const xPos = {
      omschrijving: ML + 4,
      aantal:       ML + 74,
      eenhprijs:    ML + 94,
      btw:          ML + 126,
      btwbedrag:    ML + 148,
      subtotaal:    W - MR - 4,
    }

    doc.setTextColor(...WIT)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('OMSCHRIJVING', xPos.omschrijving, y + 6)
    doc.text('AANTAL',       xPos.aantal,       y + 6)
    doc.text('STUKSPRIJS',   xPos.eenhprijs,    y + 6)
    doc.text('BTW %',        xPos.btw,          y + 6)
    doc.text('BTW BEDRAG',   xPos.btwbedrag,    y + 6)
    doc.text('TOTAAL',       xPos.subtotaal,    y + 6, { align: 'right' })

    y += 9

    // ── Productregels (afwisselend wit / lichtgrijs) ───────────────────────────
    let totaalExBtw     = 0
    let totaalBtwBedrag = 0
    const btwGroepen: Record<string, { grondslag: number; bedrag: number }> = {}

    verkoop.regels.forEach((r, idx) => {
      const regelH = 14
      doc.setFillColor(...(idx % 2 === 0 ? WIT : GRIJS_BG))
      doc.rect(ML, y, COL, regelH, 'F')

      // Dunne scheidingslijn
      doc.setDrawColor(...GRIJS_L)
      doc.setLineWidth(0.2)
      doc.line(ML, y + regelH, W - MR, y + regelH)

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
      doc.setTextColor(...ZWART)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.text(naam, xPos.omschrijving, y + 6)

      // SKU
      doc.setTextColor(...GRIJS)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'normal')
      doc.text(r.product.sku, xPos.omschrijving, y + 11)

      // Overige kolommen
      doc.setTextColor(...ZWART)
      doc.setFontSize(8.5)
      doc.text(String(r.aantal),            xPos.aantal,    y + 8)
      doc.text(`€ ${eenhprijs.toFixed(2)}`, xPos.eenhprijs, y + 8)
      doc.text(`${btwPct.toFixed(0)}%`,      xPos.btw,       y + 8)
      doc.text(`€ ${btwBedrag.toFixed(2)}`, xPos.btwbedrag, y + 8)
      doc.setTextColor(...ORANJE)
      doc.setFont('helvetica', 'bold')
      doc.text(`€ ${subtotaal.toFixed(2)}`, xPos.subtotaal, y + 8, { align: 'right' })

      y += regelH
    })

    y += 8

    // ── Scheidingslijn oranje ─────────────────────────────────────────────────
    doc.setDrawColor(...ORANJE)
    doc.setLineWidth(0.6)
    doc.line(ML, y, W - MR, y)
    y += 10

    // ── Totaaloverzicht ───────────────────────────────────────────────────────
    const totaalIncBtw  = Number(verkoop.totaalBedrag)
    const kortingBedrag = Number(verkoop.kortingBedrag ?? 0)

    const totaalRijen: { label: string; waarde: string; kleur: [number,number,number]; groot?: boolean; vetLabel?: boolean }[] = [
      { label: 'Subtotaal (excl. BTW)', waarde: `€ ${totaalExBtw.toFixed(2)}`,    kleur: GRIJS },
      { label: 'BTW',                   waarde: `€ ${totaalBtwBedrag.toFixed(2)}`, kleur: GRIJS },
      ...(kortingBedrag > 0 ? [{ label: 'Korting', waarde: `- € ${kortingBedrag.toFixed(2)}`, kleur: [200,80,0] as [number,number,number] }] : []),
      { label: 'TOTAAL (incl. BTW)',    waarde: `€ ${totaalIncBtw.toFixed(2)}`,    kleur: GROEN, groot: true, vetLabel: true },
    ]

    totaalRijen.forEach(rij => {
      doc.setTextColor(...GRIJS)
      doc.setFontSize(rij.groot ? 11 : 9)
      doc.setFont('helvetica', rij.vetLabel ? 'bold' : 'normal')
      doc.text(rij.label, W - MR - 80, y)
      doc.setTextColor(...rij.kleur)
      doc.setFont('helvetica', 'bold')
      doc.text(rij.waarde, W - MR, y, { align: 'right' })
      y += rij.groot ? 11 : 7
    })

    y += 8

    // ── BTW specificatie (lichtgrijs kader) ───────────────────────────────────
    const btwRijen = Object.keys(btwGroepen).length
    const btwBlokH = 12 + btwRijen * 7 + 6
    doc.setFillColor(...GRIJS_BG)
    doc.roundedRect(ML, y, 110, btwBlokH, 3, 3, 'F')
    doc.setDrawColor(...GRIJS_L)
    doc.setLineWidth(0.3)
    doc.roundedRect(ML, y, 110, btwBlokH, 3, 3, 'S')

    doc.setTextColor(...ORANJE)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('BTW SPECIFICATIE', ML + 5, y + 8)

    doc.setTextColor(...GRIJS)
    doc.text('TARIEF',    ML + 5,  y + 15)
    doc.text('GRONDSLAG', ML + 30, y + 15)
    doc.text('BTW',       ML + 62, y + 15)
    doc.text('TOTAAL',    ML + 86, y + 15)

    let btwY = y + 22
    Object.entries(btwGroepen).forEach(([tarief, data]) => {
      doc.setTextColor(...ZWART)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.text(tarief,                                            ML + 5,  btwY)
      doc.text(`€ ${data.grondslag.toFixed(2)}`,                 ML + 30, btwY)
      doc.text(`€ ${data.bedrag.toFixed(2)}`,                    ML + 62, btwY)
      doc.text(`€ ${(data.grondslag + data.bedrag).toFixed(2)}`, ML + 86, btwY)
      btwY += 7
    })

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = H - 22
    doc.setFillColor(...ORANJE)
    doc.rect(0, footerY - 2, W, 24, 'F')

    doc.addImage(LOGO_BASE64, LOGO_MEDIA_TYPE, ML, footerY + 2, 10, 10)

    doc.setTextColor(...WIT)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('The Fantasy Realm', ML + 13, footerY + 8)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Bedankt voor uw aankoop!  —  Diezerplein 27, 8021 CT Zwolle', ML + 13, footerY + 15)

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
