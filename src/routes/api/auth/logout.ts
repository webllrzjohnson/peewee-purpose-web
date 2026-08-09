import { createFileRoute } from "@tanstack/react-router";

import { destroySessionCookie } from "@/lib/auth";
import { jsonResponse } from "@/lib/http";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async () => {
        return jsonResponse(
          { message: "Logged out successfully" },
          { headers: { "Set-Cookie": destroySessionCookie() } },
        );
      },
    },
  },
});
