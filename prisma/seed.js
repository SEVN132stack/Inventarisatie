const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  // Idempotency check
  const bestaandeGebruikers = await prisma.gebruiker.count()
  if (bestaandeGebruikers > 0) {
    console.log('Database al gevuld, seed overgeslagen.')
    
    // Zorg wel dat wachtwoorden altijd ingesteld zijn (fix voor upgrade)
    const zonderWachtwoord = await prisma.gebruiker.findMany({
      where: { OR: [{ wachtwoord: '' }, { wachtwoord: null as any }] }
    })
    if (zonderWachtwoord.length > 0) {
      console.log('Wachtwoorden herstellen voor', zonderWachtwoord.length, 'gebruiker(s)...')
      for (const g of zonderWachtwoord) {
        const hash = await bcrypt.hash('admin123', 12)
        await prisma.gebruiker.update({ where: { id: g.id }, data: { wachtwoord: hash } })
      }
    }
    return
  }

  console.log('Database seeden...')

  const adminHash = await bcrypt.hash('admin123', 12)
  const medHash   = await bcrypt.hash('medewerker123', 12)

  const admin = await prisma.gebruiker.create({
    data: { naam: 'Admin', email: 'admin@winkel.nl', wachtwoord: adminHash, rol: 'ADMIN' },
  })
  await prisma.gebruiker.create({
    data: { naam: 'Medewerker', email: 'medewerker@winkel.nl', wachtwoord: medHash, rol: 'MEDEWERKER' },
  })

  const cats = await Promise.all([
    prisma.categorie.create({ data: { naam: 'Elektronica', omschrijving: 'Elektronische apparaten en accessoires' } }),
    prisma.categorie.create({ data: { naam: 'Kantoorartikelen', omschrijving: 'Pennen, papier, mappen' } }),
    prisma.categorie.create({ data: { naam: 'Voeding', omschrijving: 'Eten en drinken' } }),
  ])

  const lev = await prisma.leverancier.create({
    data: { naam: 'Groothandel BV', contactpersoon: 'Jan de Vries', email: 'jan@groothandel.nl', telefoon: '0612345678' },
  })

  const producten = await Promise.all([
    prisma.product.create({ data: { naam: 'USB-C Kabel 2m',    sku: 'EL-001', barcode: '8710123456781', categorieId: cats[0].id, leverancierId: lev.id, inkoopprijs: 3.50,  verkoopprijs: 9.99,  voorraadAantal: 45, minVoorraad: 10 } }),
    prisma.product.create({ data: { naam: 'Bluetooth Muis',    sku: 'EL-002', barcode: '8710123456782', categorieId: cats[0].id, leverancierId: lev.id, inkoopprijs: 12.00, verkoopprijs: 29.99, voorraadAantal: 8,  minVoorraad: 10 } }),
    prisma.product.create({ data: { naam: 'HDMI Kabel 1.5m',   sku: 'EL-003', barcode: '8710123456783', categorieId: cats[0].id, leverancierId: lev.id, inkoopprijs: 4.00,  verkoopprijs: 12.99, voorraadAantal: 23, minVoorraad: 5  } }),
    prisma.product.create({ data: { naam: 'Balpen Blauw (10x)',sku: 'KA-001', barcode: '8710123456784', categorieId: cats[1].id, leverancierId: lev.id, inkoopprijs: 1.20,  verkoopprijs: 3.49,  voorraadAantal: 60, minVoorraad: 20, eenheid: 'pak'  } }),
    prisma.product.create({ data: { naam: 'A4 Papier 500 vel', sku: 'KA-002', barcode: '8710123456785', categorieId: cats[1].id, leverancierId: lev.id, inkoopprijs: 3.80,  verkoopprijs: 7.99,  voorraadAantal: 3,  minVoorraad: 10, eenheid: 'ream' } }),
    prisma.product.create({ data: { naam: 'Koffie 500g',       sku: 'VO-001', barcode: '8710123456786', categorieId: cats[2].id,                        inkoopprijs: 5.50,  verkoopprijs: 11.99, voorraadAantal: 18, minVoorraad: 5,  eenheid: 'pak'  } }),
  ])

  // Demo verkopen
  const nu = new Date()
  for (let i = 0; i < 15; i++) {
    const dag = new Date(nu)
    dag.setDate(dag.getDate() - Math.floor(Math.random() * 30))
    const product = producten[Math.floor(Math.random() * producten.length)]
    const aantal = Math.floor(Math.random() * 4) + 1
    const subtotaal = Number(product.verkoopprijs) * aantal
    await prisma.verkoop.create({
      data: {
        gebruikerId: admin.id,
        betalingsMethode: ['CONTANT', 'PIN', 'ONLINE'][Math.floor(Math.random() * 3)],
        totaalBedrag: subtotaal,
        verkochtenOp: dag,
        regels: { create: { productId: product.id, aantal, eenheidsprijs: product.verkoopprijs, btw: product.btw, subtotaal } }
      }
    })
  }

  await prisma.emailInstelling.create({
    data: { ontvangerEmail: 'troy.janssens.it@gmail.com', ontvangerNaam: 'Admin', verzendDag: 1 },
  })

  console.log('')
  console.log('✅ Seed voltooid!')
  console.log('📧 Login: admin@winkel.nl       / admin123')
  console.log('📧 Login: medewerker@winkel.nl  / medewerker123')
}

main().catch(e => { console.error('Seed fout:', e); process.exit(1) }).finally(() => prisma.$disconnect())
