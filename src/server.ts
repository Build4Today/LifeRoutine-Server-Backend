import Fastify from "fastify";
import cors from "@fastify/cors";
import { appRoutes } from "./routes";
import { config } from "./config";

const app = Fastify();

app.register(cors);
app.register(appRoutes);

app
  .listen({
    port: config.port as number,
    host: config.host,
  })
  .then((url) => {
    console.log(`HTTP Server running on port ${url}`);
  });
