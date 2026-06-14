/**
 * Migrates all entries from carData.ts into the CarBrand/CarModel/CarGeneration DB tables.
 * Safe to run multiple times — uses upsert so existing entries are skipped.
 *
 * Run with:  npx tsx scripts/seed-catalog.ts
 */

import { PrismaClient } from "@prisma/client";
import { CAR_DATA } from "../app/lib/carData";

const prisma = new PrismaClient();

async function main() {
  let brandCount = 0, modelCount = 0, genCount = 0;

  for (const [brandName, models] of Object.entries(CAR_DATA)) {
    const brand = await (prisma as any).carBrand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });
    brandCount++;
    console.log(`✓ Brand: ${brandName}`);

    for (const [modelName, generations] of Object.entries(models)) {
      const model = await (prisma as any).carModel.upsert({
        where: { brandId_name: { brandId: brand.id, name: modelName } },
        update: {},
        create: { name: modelName, brandId: brand.id },
      });
      modelCount++;

      for (const genName of Object.keys(generations)) {
        await (prisma as any).carGeneration.upsert({
          where: { modelId_name: { modelId: model.id, name: genName } },
          update: {},
          create: { name: genName, modelId: model.id },
        });
        genCount++;
      }
      console.log(`  ✓ Model: ${modelName} (${Object.keys(generations).length} gens)`);
    }
  }

  console.log(`\nDone! ${brandCount} brands, ${modelCount} models, ${genCount} generations seeded.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
