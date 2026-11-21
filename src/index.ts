import { serve } from "bun";
import index from "./index.html";
import {
  handleAendereMeldung,
  handleErstelleMeldung,
  handleLadeDatei,
  handleLadeDateiHoch,
  handleLadeMeldung,
  handleListeMeldungen,
  handleLoescheMeldung,
  LIVE_TOPIC,
} from "./server/meldungen";
import { handleSummarize } from "./server/summarize";
import { handleTranscribe } from "./server/transcribe";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/transcribe": { POST: handleTranscribe },
    "/api/summarize": { POST: handleSummarize },

    "/api/meldungen": { GET: handleListeMeldungen, POST: handleErstelleMeldung },
    "/api/meldungen/:id": {
      GET: handleLadeMeldung,
      PATCH: handleAendereMeldung,
      DELETE: handleLoescheMeldung,
    },
    "/api/dateien": { POST: handleLadeDateiHoch },
    "/api/dateien/:id": { GET: handleLadeDatei },

    // Live updates: clients get "changed" after every write and refetch.
    "/api/live": (req, server) =>
      server.upgrade(req) ? undefined : new Response("WebSocket erwartet.", { status: 400 }),

    "/api/hello": {
      GET() {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      PUT() {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": (req) => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  websocket: {
    open(ws) {
      ws.subscribe(LIVE_TOPIC);
    },
    message() {},
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
