import fastify from "fastify";
import { config } from "./config";
import { logger } from "./logger";
import { registerPlugins } from "./plugins";

const app = fastify();

(async () => {
  try {
    await registerPlugins(app);

    await app.listen(
      {
        port: config.port as number,
        host: config.host,
      },
      (err, address) => {
        if (err) {
          throw err;
        }
        logger.info(`Server listening at ${address}`);
      }
    );
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
})();
