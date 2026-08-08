import { createFileRoute } from "@tanstack/react-router";
import { compare } from "bcryptjs";

import { createSessionCookie } from "@/lib/auth";
import { jsonResponse, readJsonBody } from "@/lib/http";
import { getDb } from "@/lib/prisma";

type LoginRequest = {
  email: string;
  password: string;
};

function parseLoginRequest(input: unknown): LoginRequest | null {
  if (input == null || typeof input !== "object") {
    return null;
  }

  const data = input as Record<string, unknown>;
  const email = typeof data["email"] === "string" ? data["email"].trim().toLowerCase() : "";
  const password = typeof data["password"] === "string" ? data["password"] : "";

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const credentials = parseLoginRequest(await readJsonBody(request));

        if (!credentials) {
          return jsonResponse({ message: "Email and password are required" }, { status: 400 });
        }

        try {
          const db = getDb();
          const user = await db.user.findUnique({ where: { email: credentials.email } });
          if (!user) {
            return jsonResponse({ message: "Invalid email or password" }, { status: 401 });
          }

          const isPasswordValid = await compare(credentials.password, user.password);
          if (!isPasswordValid) {
            return jsonResponse({ message: "Invalid email or password" }, { status: 401 });
          }

          return jsonResponse(
            { message: "Logged in successfully" },
            {
              status: 200,
              headers: { "Set-Cookie": await createSessionCookie(user.id) },
            },
          );
        } catch (error) {
          console.error("Login failed", error);
          return jsonResponse({ message: "Login failed" }, { status: 500 });
        }
      },
    },
  },
});
