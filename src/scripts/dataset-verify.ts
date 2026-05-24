import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying imported data...');

  const airportCount = await prisma.airport.count();
  const airlineCount = await prisma.airline.count();
  const routeCount = await prisma.route.count();

  console.log('--- Statistics ---');
  console.log(`Airports: ${airportCount}`);
  console.log(`Airlines: ${airlineCount}`);
  console.log(`Routes:   ${routeCount}`);

  if (airportCount > 0) {
    const randomAirport = await prisma.airport.findFirst();
    console.log('Sample Airport:', randomAirport?.name, `(${randomAirport?.code})`);
  }

  if (airlineCount > 0) {
    const randomAirline = await prisma.airline.findFirst();
    console.log('Sample Airline:', randomAirline?.name, `(${randomAirline?.code})`);
  }

  if (routeCount > 0) {
    const randomRoute = await prisma.route.findFirst({
      include: {
        sourceAirport: true,
        destinationAirport: true,
        airline: true,
      }
    });
    console.log('Sample Route:', 
      `${randomRoute?.airline.name}: ${randomRoute?.sourceAirport.code} -> ${randomRoute?.destinationAirport.code}`
    );
  }

  await prisma.$disconnect();
}

main().catch(console.error);
