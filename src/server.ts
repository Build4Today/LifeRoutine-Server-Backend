import Fastify from "fastify";
import cors from "@fastify/cors";
import { appRoutes } from "./routes";
import { config } from "./config";
import { logger } from "./logger";

const app = Fastify();

app.register(cors);
app.register(appRoutes);

app.listen(
  {
    port: config.port as number,
    host: config.host,
  },
  (err, address) => {
    if (err) {
      logger.error(err);
      process.exit(1);
    }

    logger.info(`HTTP Server running on port ${address}`);
  }
);
