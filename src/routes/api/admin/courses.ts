import { createFileRoute } from "@tanstack/react-router";

import { requireAdmin } from "@/lib/auth";
import { jsonResponse, readJsonBody } from "@/lib/http";
import { getDb } from "@/lib/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readString(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(data: Record<string, unknown>, key: string, fallback: boolean) {
  return typeof data[key] === "boolean" ? data[key] : fallback;
}

function readInteger(data: Record<string, unknown>, key: string, fallback: number) {
  const value = data[key];
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isInteger(numberValue) ? numberValue : fallback;
}

function readOptionalInteger(data: Record<string, unknown>, key: string) {
  const value = data[key];
  if (value === null || value === undefined || value === "") return null;

  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isInteger(numberValue) && numberValue >= 0 ? numberValue : null;
}

function readDetails(data: Record<string, unknown>) {
  const value = data["details"];
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseCoursePayload(input: unknown) {
  if (input == null || typeof input !== "object") return null;

  const data = input as Record<string, unknown>;
  const title = readString(data, "title");
  const audience = readString(data, "audience");
  const priceLabel = readString(data, "priceLabel");
  const ctaLabel = readString(data, "ctaLabel") || "Book now";
  const slug = slugify(readString(data, "slug") || title);

  if (!title || !audience || !priceLabel || !slug) return null;

  return {
    slug,
    title,
    audience,
    description: readString(data, "description") || null,
    details: readDetails(data),
    priceLabel,
    priceCents: readOptionalInteger(data, "priceCents"),
    ctaLabel,
    isPublished: readBoolean(data, "isPublished", true),
    sortOrder: readInteger(data, "sortOrder", 0),
  };
}

export const Route = createFileRoute("/api/admin/courses")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.user) return jsonResponse({ message: auth.message }, { status: auth.status });

        const db = getDb();
        const courses = await db.courseOffering.findMany({
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        });
        return jsonResponse(courses);
      },
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.user) return jsonResponse({ message: auth.message }, { status: auth.status });

        const payload = parseCoursePayload(await readJsonBody(request));
        if (!payload)
          return jsonResponse(
            { message: "Title, audience, and price are required" },
            { status: 400 },
          );

        try {
          const db = getDb();
          const course = await db.courseOffering.create({ data: payload });
          return jsonResponse(course, { status: 201 });
        } catch (error) {
          console.error("Admin course create failed", error);
          return jsonResponse({ message: "Unable to save course" }, { status: 500 });
        }
      },
      PATCH: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.user) return jsonResponse({ message: auth.message }, { status: auth.status });

        const body = await readJsonBody(request);
        if (body == null || typeof body !== "object") {
          return jsonResponse({ message: "Invalid request" }, { status: 400 });
        }

        const id = readString(body as Record<string, unknown>, "id");
        const payload = parseCoursePayload(body);
        if (!id || !payload)
          return jsonResponse(
            { message: "Course id and valid fields are required" },
            { status: 400 },
          );

        try {
          const db = getDb();
          const course = await db.courseOffering.update({ where: { id }, data: payload });
          return jsonResponse(course);
        } catch (error) {
          console.error("Admin course update failed", error);
          return jsonResponse({ message: "Unable to update course" }, { status: 500 });
        }
      },
    },
  },
});
