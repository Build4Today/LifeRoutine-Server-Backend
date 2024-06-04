import { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import cors from "@fastify/cors";
import { appRoutes } from "./routes";

export async function registerPlugins(app: FastifyInstance) {
  const rateLimitOptions = {
    max: 100, // Max number of requests per time window
    timeWindow: "1 minute", // Time window duration
  };

  app.register(rateLimit, rateLimitOptions);
  app.register(cors);
  app.register(appRoutes);
}
