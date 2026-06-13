import { prisma } from "../app/lib/prisma";

async function main() {
  // Find superadmin to set as createdBy
  const admin = await prisma.user.findFirst({
    where: { role: "SUPERADMIN" },
    select: { id: true, username: true },
  });
  if (!admin) throw new Error("No SUPERADMIN found");

  const existing = await prisma.transportCompany.findFirst({
    where: { name: { equals: "Autohaus Birngruber", mode: "insensitive" } },
  });
  if (existing) {
    console.log("Already exists:", existing.name, "#" + existing.numericId);
    return;
  }

  const company = await prisma.transportCompany.create({
    data: {
      name:        "Autohaus Birngruber",
      country:     "Austria",
      city:        "Krems, Tulln, Langenlois",
      description: "VAG Dealership mainly focusing on Skoda, VW, Cupra, Seat, and Audi vehicles. Offers Shuttle Service, Loaners, and various repairs.",
      website:     "https://www.birngruber.at/",
      createdById: admin.id,
    },
  });
  console.log("Created:", company.name, "#" + company.numericId);
}

main().catch(console.error).finally(() => prisma.$disconnect());
