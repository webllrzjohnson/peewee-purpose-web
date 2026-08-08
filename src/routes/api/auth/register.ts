import { createFileRoute } from "@tanstack/react-router";
import { hash } from "bcryptjs";

import { jsonResponse, readJsonBody } from "@/lib/http";
import { getDb } from "@/lib/prisma";

type RegisterRequest = {
  email: string;
  password: string;
  name?: string;
};

function parseRegisterRequest(input: unknown): RegisterRequest | null {
  if (input == null || typeof input !== "object") {
    return null;
  }

  const data = input as Record<string, unknown>;
  const email = typeof data["email"] === "string" ? data["email"].trim().toLowerCase() : "";
  const password = typeof data["password"] === "string" ? data["password"] : "";
  const rawName = typeof data["name"] === "string" ? data["name"].trim() : "";
  const name = rawName.length > 0 ? rawName : undefined;

  if (!email || password.length < 8) {
    return null;
  }

  return name ? { email, password, name } : { email, password };
}

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const registration = parseRegisterRequest(await readJsonBody(request));

        if (!registration) {
          return jsonResponse(
            { message: "A valid email and password of at least 8 characters are required" },
            { status: 400 },
          );
        }

        try {
          const db = getDb();
          const existingUser = await db.user.findUnique({ where: { email: registration.email } });
          if (existingUser) {
            return jsonResponse({ message: "Email already in use" }, { status: 409 });
          }

          const hashedPassword = await hash(registration.password, 12);
          const user = await db.user.create({
            data: {
              email: registration.email,
              password: hashedPassword,
              ...(registration.name ? { name: registration.name } : {}),
              role: "USER",
            },
          });

          return jsonResponse(
            { message: "User created successfully", userId: user.id },
            { status: 201 },
          );
        } catch (error) {
          console.error("Registration failed", error);
          return jsonResponse({ message: "Registration failed" }, { status: 500 });
        }
      },
    },
  },
});
