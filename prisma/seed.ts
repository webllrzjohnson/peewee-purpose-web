import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPkg from "@prisma/client";

const { PrismaClient } = prismaClientPkg;

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const db = new PrismaClient({ adapter: new PrismaPg(connectionString) });

const courses = [
  {
    slug: "healthcare-provider-bls",
    title: "Healthcare Provider BLS",
    audience: "Nurses, dental teams, EMT students, clinical staff and healthcare professionals.",
    description: null,
    details: [
      "Online HeartCode + hands-on skills",
      "AHA BLS completion card",
      "Best for new or renewing providers",
    ],
    priceLabel: "From $100",
    priceCents: 10000,
    ctaLabel: "Book BLS",
    isPublished: true,
    sortOrder: 10,
  },
  {
    slug: "acls-pals-certification",
    title: "ACLS & PALS Certification",
    audience: "Advanced healthcare professionals who respond to cardiac or pediatric emergencies.",
    description: null,
    details: [
      "Instructor-led or blended options",
      "Initial and renewal pathways",
      "Scenario-based practice",
    ],
    priceLabel: "From $199",
    priceCents: 19900,
    ctaLabel: "Ask about ACLS/PALS",
    isPublished: true,
    sortOrder: 20,
  },
  {
    slug: "heartsaver-cpr-aed",
    title: "Heartsaver® CPR AED",
    audience:
      "Workplaces, community members, coaches, parents and anyone who wants CPR confidence.",
    description: null,
    details: [
      "No medical background required",
      "CPR and AED response",
      "Two-year course completion card",
    ],
    priceLabel: "Contact for dates",
    priceCents: null,
    ctaLabel: "Request Heartsaver CPR",
    isPublished: true,
    sortOrder: 30,
  },
  {
    slug: "pediatric-first-aid-cpr-aed",
    title: "Pediatric First Aid CPR AED",
    audience: "Childcare providers, teachers, camp counselors and youth program staff.",
    description: null,
    details: [
      "Child and infant emergency response",
      "First aid, CPR and AED",
      "Great for schools and childcare teams",
    ],
    priceLabel: "From $90",
    priceCents: 9000,
    ctaLabel: "Book pediatric CPR",
    isPublished: true,
    sortOrder: 40,
  },
];

for (const course of courses) {
  await db.courseOffering.upsert({
    where: { slug: course.slug },
    update: course,
    create: course,
  });
}

console.log(`Seeded ${courses.length} course offerings`);
await db.$disconnect();
