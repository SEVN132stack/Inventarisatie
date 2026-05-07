import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma'

export async function GET() {
  const rapportages = await prisma.rapportage.findMany({
    orderBy: { aangemaaktOp: 'desc' },
    take: 20,
    include: { gegenereerddoor: { select: { naam: true } } }
  })
  return NextResponse.json(rapportages)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, periodeStart, periodeEinde, stuurMail } = body

    const gebruiker = await prisma.gebruiker.findFirst({ where: { rol: 'ADMIN' } })
    if (!gebruiker) return NextResponse.json({ error: 'Geen gebruiker gevonden' }, { status: 400 })

    const start = new Date(periodeStart)
    const einde = new Date(periodeEinde)

    // Bereken rapportagesamenvatting
    const [verkopen, topProducten, aantalProducten, laagVoorraad] = await Promise.all([
      prisma.verkoop.aggregate({
        where: { verkochtenOp: { gte: start, lte: einde } },
        _sum: { totaalBedrag: true },
        _count: true,
      }),
      prisma.verkoopRegel.groupBy({
        by: ['productId'],
        where: { verkoop: { verkochtenOp: { gte: start, lte: einde } } },
        _sum: { subtotaal: true, aantal: true },
        orderBy: { _sum: { subtotaal: 'desc' } },
        take: 5,
      }),
      prisma.product.count({ where: { actief: true } }),
      prisma.product.count({ where: { actief: true, voorraadAantal: { lte: 5 } } }),
    ])

    // Haal productnamen op voor top
    const productIds = topProducten.map(t => t.productId)
    const productenNamen = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, naam: true },
    })

    const samenvatting = {
      omzet: Number(verkopen._sum.totaalBedrag ?? 0),
      aantalVerkopen: verkopen._count,
      aantalProducten,
      laagVoorraad,
      topProducten: topProducten.map(t => ({
        naam: productenNamen.find(p => p.id === t.productId)?.naam ?? '–',
        omzet: Number(t._sum.subtotaal ?? 0),
        aantal: t._sum.aantal,
      }))
    }

    // Maak rapportage aan
    const rapportage = await prisma.rapportage.create({
      data: {
        gegenereerddoorId: gebruiker.id,
        type: type ?? 'HANDMATIG',
        status: 'GEREED',
        periodeStart: start,
        periodeEinde: einde,
        samenvatting,
        voltooidOp: new Date(),
      }
    })

    // Verstuur e-mail via Brevo als gevraagd
    if (stuurMail && process.env.BREVO_API_KEY) {
      const ontvangers = await prisma.emailInstelling.findMany({ where: { actief: true } })

      const brevo = await import('@getbrevo/brevo')
      const apiInstance = new brevo.TransactionalEmailsApi()
      apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY)

      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: #0d0f12; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #4f8ef7; margin: 0; font-size: 20px;">WinkelPro</h1>
            <p style="color: #7a7f8e; margin: 4px 0 0; font-size: 13px;">Automatische rapportage</p>
          </div>
          <div style="background: #13161b; padding: 28px 32px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #e8eaf0; font-size: 16px; margin: 0 0 4px;">
              ${type} rapportage
            </h2>
            <p style="color: #7a7f8e; font-size: 13px; margin: 0 0 24px;">
              Periode: ${periodeStart} t/m ${periodeEinde}
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 14px; background: #1a1d24; border-radius: 8px 8px 0 0; color: #7a7f8e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em;">Totale omzet</td>
                <td style="padding: 10px 14px; background: #1a1d24; border-radius: 8px 8px 0 0; text-align: right; color: #34d399; font-family: monospace; font-size: 20px; font-weight: bold;">€${samenvatting.omzet.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 14px; background: #13161b; color: #7a7f8e; font-size: 13px; border-bottom: 1px solid #252830;">Aantal verkopen</td>
                <td style="padding: 8px 14px; background: #13161b; text-align: right; color: #e8eaf0; font-family: monospace; border-bottom: 1px solid #252830;">${samenvatting.aantalVerkopen}</td>
              </tr>
              <tr>
                <td style="padding: 8px 14px; background: #13161b; color: #7a7f8e; font-size: 13px; border-bottom: 1px solid #252830;">Actieve producten</td>
                <td style="padding: 8px 14px; background: #13161b; text-align: right; color: #e8eaf0; font-family: monospace; border-bottom: 1px solid #252830;">${samenvatting.aantalProducten}</td>
              </tr>
              <tr>
                <td style="padding: 8px 14px; background: #13161b; color: #fbbf24; font-size: 13px;">⚠ Lage voorraad</td>
                <td style="padding: 8px 14px; background: #13161b; text-align: right; color: #fbbf24; font-family: monospace;">${samenvatting.laagVoorraad} producten</td>
              </tr>
            </table>

            <h3 style="color: #e8eaf0; font-size: 14px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.06em;">Top 5 producten</h3>
            <table style="width: 100%; border-collapse: collapse; background: #1a1d24; border-radius: 8px; overflow: hidden;">
              <tr style="background: #252830;">
                <th style="padding: 8px 12px; text-align: left; color: #7a7f8e; font-size: 11px; font-weight: 500; text-transform: uppercase;">Product</th>
                <th style="padding: 8px 12px; text-align: right; color: #7a7f8e; font-size: 11px; font-weight: 500; text-transform: uppercase;">Omzet</th>
                <th style="padding: 8px 12px; text-align: right; color: #7a7f8e; font-size: 11px; font-weight: 500; text-transform: uppercase;">Stuks</th>
              </tr>
              ${samenvatting.topProducten.map((p, i) => `
                <tr style="border-top: 1px solid #252830;">
                  <td style="padding: 8px 12px; color: #e8eaf0; font-size: 13px;">${p.naam}</td>
                  <td style="padding: 8px 12px; text-align: right; color: #4f8ef7; font-family: monospace; font-size: 12px;">€${p.omzet.toFixed(2)}</td>
                  <td style="padding: 8px 12px; text-align: right; color: #7a7f8e; font-family: monospace; font-size: 12px;">${p.aantal}</td>
                </tr>
              `).join('')}
            </table>

            <p style="margin-top: 28px; color: #454b5a; font-size: 11px; border-top: 1px solid #252830; padding-top: 16px;">
              Dit rapport is automatisch gegenereerd door WinkelPro Inventarisatie Systeem.
              Beheer je rapportage-instellingen via de app.
            </p>
          </div>
        </div>
      `

      const onderwerp = `WinkelPro rapportage ${type} – ${periodeStart} t/m ${periodeEinde}`

      for (const ontvanger of ontvangers) {
        try {
          const sendSmtpEmail = new brevo.SendSmtpEmail()
          sendSmtpEmail.subject = onderwerp
          sendSmtpEmail.htmlContent = htmlBody
          sendSmtpEmail.sender = {
            name: process.env.EMAIL_NAAM ?? 'WinkelPro',
            email: process.env.EMAIL_FROM ?? 'noreply@winkel.nl',
          }
          sendSmtpEmail.to = [{
            email: ontvanger.ontvangerEmail,
            name: ontvanger.ontvangerNaam ?? ontvanger.ontvangerEmail,
          }]

          const result = await apiInstance.sendTransacEmail(sendSmtpEmail)
          const messageId = (result.body as any)?.messageId ?? null

          await prisma.emailLog.create({
            data: {
              rapportageId: rapportage.id,
              ontvanger: ontvanger.ontvangerEmail,
              onderwerp,
              status: 'VERZONDEN',
              providerRef: messageId,
            }
          })
        } catch (mailErr: any) {
          await prisma.emailLog.create({
            data: {
              rapportageId: rapportage.id,
              ontvanger: ontvanger.ontvangerEmail,
              onderwerp,
              status: 'MISLUKT',
              foutmelding: mailErr.message ?? String(mailErr),
            }
          })
        }
      }
    }

    return NextResponse.json(rapportage, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
