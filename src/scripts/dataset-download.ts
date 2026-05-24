import fs from 'fs';
import path from 'path';
import https from 'https';

const DATASET_DIR = path.join(process.cwd(), 'data/openflights');

const FILES = {
  airports: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat',
  airlines: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat',
  routes: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat',
};

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(DATASET_DIR)) {
    fs.mkdirSync(DATASET_DIR, { recursive: true });
  }

  console.log('Starting dataset download...');

  for (const [name, url] of Object.entries(FILES)) {
    const dest = path.join(DATASET_DIR, `${name}.csv`);
    console.log(`Downloading ${name} from ${url}...`);
    try {
      await downloadFile(url, dest);
      console.log(`Successfully downloaded ${name}.`);
    } catch (error) {
      console.error(`Error downloading ${name}:`, error);
      process.exit(1);
    }
  }

  console.log('All datasets downloaded successfully.');
}

main().catch(console.error);
