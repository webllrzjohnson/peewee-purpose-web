import { createFileRoute } from "@tanstack/react-router";

import { jsonResponse } from "@/lib/http";
import { getDb } from "@/lib/prisma";

const fallbackCourses = [
  {
    id: "fallback-bls",
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
    ctaLabel: "Book BLS",
    isPublished: true,
    sortOrder: 10,
  },
  {
    id: "fallback-acls-pals",
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
    ctaLabel: "Ask about ACLS/PALS",
    isPublished: true,
    sortOrder: 20,
  },
  {
    id: "fallback-heartsaver",
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
    ctaLabel: "Request Heartsaver CPR",
    isPublished: true,
    sortOrder: 30,
  },
  {
    id: "fallback-pediatric",
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
    ctaLabel: "Book pediatric CPR",
    isPublished: true,
    sortOrder: 40,
  },
];

export const Route = createFileRoute("/api/courses")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const db = getDb();
          const courses = await db.courseOffering.findMany({
            where: { isPublished: true },
            orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
          });

          return jsonResponse(courses.length > 0 ? courses : fallbackCourses);
        } catch (error) {
          console.error("Published courses lookup failed", error);
          return jsonResponse(fallbackCourses);
        }
      },
    },
  },
});
