import { FastifyReply, FastifyRequest } from "fastify";
import { AnyZodObject, ZodError } from "zod";

export function createZodMiddleware(schema: AnyZodObject) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await schema.parseAsync(request.body);
      request.body = data;
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.format();
        reply.status(400).send({
          error: formattedErrors,
        });
        return;
      }
      reply.status(500).send({
        error: "Internal Server Error",
      });
    }
  };
}
