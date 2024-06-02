import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {z} from 'zod'
import { PrismaClient } from "@prisma/client";

//Config Time Zone
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/ga';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ga');
dayjs.tz.setDefault('Europe/Berlin');

const prisma = new PrismaClient({log: ['query', 'info', 'warn']});


declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    z: typeof z;
    dayjs: typeof dayjs;
  }
}

const app: FastifyInstance = fastify({ logger: true, ajv: { customOptions: {coerceTypes: true}}});

const start = async () => {
   try{

     /*
     Decorating Fastify with Plugins
     */
     
     //Cors
     app.register(require('@fastify/cors'), {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
           
     });
     app.log.info("Server decorated with @cors")

     //Prisma
     app.decorate("prisma", prisma)
     app.log.info("Server decorated with @prisma/sqlite")  

     //Zod
     app.decorate('z', z);
     app.log.info("Server decorated with @zod")

     app.decorate('dayjs', dayjs)
     app.log.info("Server decorated with @dayjs")  

     //Swagger
    app.register(require('@fastify/swagger'), {})
    app.register(require('@fastify/swagger-ui'), {
        routePrefix: '/api/v1/documentation',
        swagger: {
          info: {
            title: 'Habit Helper API',
            description: 'Helping You Achieve a More Productive and Healthier Daily Performance',            
            version: '0.1.0'
          },
          schemes: ['http', 'https'],
          consumes: ['application/json'],
          produces: ['application/json'],
          methods: ['GET', 'POST', 'DELETE', 'PUT'] 
        },
        exposeRoute: true
    })    
     app.log.info("Server decorated with @swagger")

     /*
     Register Routes
     */
     app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
          reply.send({ Server_Status: 'Running' });
     });

     app.register(require("./routes/habits"), { prefix: '/api/v1' });     

     await app.listen({host: '0.0.0.0', port: 3000});
             
   }catch(err){
     app.log.error(err);
     process.exit(1);
   }
}

start();
