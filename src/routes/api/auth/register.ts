import { createAPIRoute } from "@tanstack/react-start/api";
import { db } from "@/lib/prisma";
import { hash } from "bcryptjs";

export const API = createAPIRoute({
  async handler(event) {
    const { method } = event;

    if (method === "POST") {
      const body = await readBody(event);
      const { email, password, name } = body;

      if (!email || !password) {
        return { status: 400, body: { message: "Email and password are required" } };
      }

      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        return { status: 409, body: { message: "Email already in use" } };
      }

      const hashedPassword = await hash(password, 10);
      const user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "USER",
        },
      });

      return { status: 201, body: { message: "User created successfully", userId: user.id } };
    }

    return { status: 405, body: { message: "Method Not Allowed" } };
  },
});
