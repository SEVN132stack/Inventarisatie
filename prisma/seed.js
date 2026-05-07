const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Admin gebruiker
  const admin = await prisma.gebruiker.upsert({
    where: { email: 'admin@winkel.nl' },
    update: {},
    create: {
      naam: 'Admin',
      email: 'admin@winkel.nl',
      rol: 'ADMIN',
    },
  })

  // Categorieën
  const cats = await Promise.all([
    prisma.categorie.upsert({ where: { naam: 'Elektronica' }, update: {}, create: { naam: 'Elektronica', omschrijving: 'Elektronische apparaten en accessoires' } }),
    prisma.categorie.upsert({ where: { naam: 'Kantoorartikelen' }, update: {}, create: { naam: 'Kantoorartikelen', omschrijving: 'Pennen, papier, mappen' } }),
    prisma.categorie.upsert({ where: { naam: 'Voeding' }, update: {}, create: { naam: 'Voeding', omschrijving: 'Eten en drinken' } }),
  ])

  // Leverancier
  const lev = await prisma.leverancier.create({
    data: { naam: 'Groothandel BV', contactpersoon: 'Jan de Vries', email: 'jan@groothandel.nl', telefoon: '0612345678' },
  })

  // Producten
  const producten = await Promise.all([
    prisma.product.upsert({ where: { sku: 'EL-001' }, update: {}, create: { naam: 'USB-C Kabel 2m', sku: 'EL-001', categorieId: cats[0].id, leverancierId: lev.id, inkoopprijs: 3.50, verkoopprijs: 9.99, voorraadAantal: 45, minVoorraad: 10 } }),
    prisma.product.upsert({ where: { sku: 'EL-002' }, update: {}, create: { naam: 'Bluetooth Muis', sku: 'EL-002', categorieId: cats[0].id, leverancierId: lev.id, inkoopprijs: 12.00, verkoopprijs: 29.99, voorraadAantal: 8, minVoorraad: 10 } }),
    prisma.product.upsert({ where: { sku: 'EL-003' }, update: {}, create: { naam: 'HDMI Kabel 1.5m', sku: 'EL-003', categorieId: cats[0].id, leverancierId: lev.id, inkoopprijs: 4.00, verkoopprijs: 12.99, voorraadAantal: 23, minVoorraad: 5 } }),
    prisma.product.upsert({ where: { sku: 'KA-001' }, update: {}, create: { naam: 'Balpen Blauw (10x)', sku: 'KA-001', categorieId: cats[1].id, leverancierId: lev.id, inkoopprijs: 1.20, verkoopprijs: 3.49, voorraadAantal: 60, minVoorraad: 20, eenheid: 'pak' } }),
    prisma.product.upsert({ where: { sku: 'KA-002' }, update: {}, create: { naam: 'A4 Papier 500 vel', sku: 'KA-002', categorieId: cats[1].id, leverancierId: lev.id, inkoopprijs: 3.80, verkoopprijs: 7.99, voorraadAantal: 3, minVoorraad: 10, eenheid: 'ream' } }),
    prisma.product.upsert({ where: { sku: 'VO-001' }, update: {}, create: { naam: 'Koffie 500g', sku: 'VO-001', categorieId: cats[2].id, inkoopprijs: 5.50, verkoopprijs: 11.99, voorraadAantal: 18, minVoorraad: 5, eenheid: 'pak' } }),
  ])

  // Demo verkopen (laatste 30 dagen)
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const dag = new Date(now)
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
        regels: {
          create: {
            productId: product.id,
            aantal,
            eenheidsprijs: product.verkoopprijs,
            btw: product.btw,
            subtotaal,
          }
        }
      }
    })
  }

  // Email instelling
  await prisma.emailInstelling.upsert({
    where: { ontvangerEmail: 'eigenaar@winkel.nl' },
    update: {},
    create: { ontvangerEmail: 'eigenaar@winkel.nl', ontvangerNaam: 'Eigenaar', verzendDag: 1 },
  })

  console.log('Seed voltooid!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
