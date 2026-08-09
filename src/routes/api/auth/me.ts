import { createFileRoute } from "@tanstack/react-router";

import { getCurrentUser } from "@/lib/auth";
import { jsonResponse } from "@/lib/http";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getCurrentUser(request);
        return jsonResponse({ user });
      },
    },
  },
});
