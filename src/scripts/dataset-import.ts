import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DATASET_DIR = path.join(process.cwd(), 'data/openflights');

function parseLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result.map(v => v === '\\N' ? '' : v);
}

async function importAirports() {
  console.log('Importing airports...');
  const filePath = path.join(DATASET_DIR, 'airports.csv');
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  for await (const line of rl) {
    const parts = parseLine(line);
    if (parts.length < 10) continue;

    const name = parts[1];
    const city = parts[2];
    const country = parts[3];
    const iata = parts[4].length === 3 ? parts[4] : null;
    const icao = parts[5].length === 4 ? parts[5] : null;
    const lat = parseFloat(parts[6]);
    const lng = parseFloat(parts[7]);
    const timezone = parts[11] || parts[9];

    if (!iata && !icao) continue;

    try {
      const airportData = {
        name,
        city,
        country,
        icaoCode: icao,
        latitude: lat,
        longitude: lng,
        timezone,
      };

      await prisma.airport.upsert({
        where: { code: iata || icao || "" },
        update: airportData,
        create: {
          ...airportData,
          code: iata,
        },
      });
      count++;
      if (count % 500 === 0) console.log(`Imported ${count} airports...`);
    } catch {
      // Skip duplicates or errors
    }
  }
  console.log(`Finished importing ${count} airports.`);
}

async function importAirlines() {
  console.log('Importing airlines...');
  const filePath = path.join(DATASET_DIR, 'airlines.csv');
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  for await (const line of rl) {
    const parts = parseLine(line);
    if (parts.length < 8) continue;

    const name = parts[1];
    const iata = parts[3].length === 2 ? parts[3] : null;
    const icao = parts[4].length === 3 ? parts[4] : null;
    const country = parts[6];
    const active = parts[7] === 'Y';

    if (!iata && !icao) continue;

    try {
      const airlineData = {
        name,
        icaoCode: icao,
        country,
        active,
      };

      await prisma.airline.upsert({
        where: { code: iata || icao || "" },
        update: airlineData,
        create: {
          ...airlineData,
          code: iata,
        },
      });
      count++;
      if (count % 500 === 0) console.log(`Imported ${count} airlines...`);
    } catch {
      // Skip
    }
  }
  console.log(`Finished importing ${count} airlines.`);
}

async function importRoutes() {
  console.log('Importing routes...');
  const filePath = path.join(DATASET_DIR, 'routes.csv');
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  for await (const line of rl) {
    const parts = parseLine(line);
    if (parts.length < 9) continue;

    const airlineCode = parts[0];
    const sourceAirportCode = parts[2];
    const destAirportCode = parts[4];
    const stops = parseInt(parts[7]) || 0;
    const equipment = parts[8];

    try {
      const airline = await prisma.airline.findFirst({
        where: { OR: [{ code: airlineCode }, { icaoCode: airlineCode }] }
      });
      const source = await prisma.airport.findFirst({
        where: { OR: [{ code: sourceAirportCode }, { icaoCode: sourceAirportCode }] }
      });
      const dest = await prisma.airport.findFirst({
        where: { OR: [{ code: destAirportCode }, { icaoCode: destAirportCode }] }
      });

      if (airline && source && dest) {
        await prisma.route.create({
          data: {
            airlineId: airline.id,
            sourceAirportId: source.id,
            destinationAirportId: dest.id,
            stops,
            equipment,
          }
        });
        count++;
        if (count % 1000 === 0) console.log(`Imported ${count} routes...`);
      }
    } catch {
      // Skip
    }
  }
  console.log(`Finished importing ${count} routes.`);
}

async function main() {
  try {
    // Clear routes first as they have relations
    console.log('Clearing existing routes...');
    await prisma.route.deleteMany({});
    
    await importAirports();
    await importAirlines();
    await importRoutes();
    
    console.log('ETL Pipeline completed successfully.');
  } catch (error) {
    console.error('ETL Pipeline failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
