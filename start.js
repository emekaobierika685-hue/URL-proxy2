import Fastify from "fastify";
import { createServer } from "http";
import { createBareServer } from "@nebula-services/bare-server-node";
import fastifyStatic from "@fastify/static";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const bare = createBareServer("/bare/", {
  logErrors: true,
  blockLocal: false,
});

wisp.options.allow_loopback_ips = true;
wisp.options.allow_private_ips = true;

const fastify = Fastify({
  serverFactory: (handler) => {
    return createServer()
      .on("request", (req, res) => {
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

        if (bare.shouldRoute(req)) {
          bare.routeRequest(req, res);
        } else {
          handler(req, res);
        }
      })
      .on("upgrade", (req, socket, head) => {
        if (bare.shouldRoute(req)) {
          bare.routeUpgrade(req, socket, head);
        } else {
          wisp.routeRequest(req, socket, head);
        }
      });
  },
});

const __dirname = fileURLToPath(new URL(".", import.meta.url));

fastify.register(fastifyStatic, {
  root: join(__dirname, "static"),
  decorateReply: false,
});

fastify.register(fastifyStatic, {
  root: join(__dirname, "dist"),
  prefix: "/scram/",
  decorateReply: false,
});

fastify.register(fastifyStatic, {
  root: join(__dirname, "assets"),
  prefix: "/assets/",
  decorateReply: false,
});

const PORT = process.env.PORT || 1337;

fastify.listen({ port: PORT, host: "0.0.0.0" });

console.log(`Server running on http://localhost:${PORT}`);
