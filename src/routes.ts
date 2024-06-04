import dayjs from "dayjs";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "./prisma";

import { logger } from "./logger";

import { createZodMiddleware } from "./utils/zod-middleware";

interface CreateHabitBody {
  title: string;
  weekDays: number[];
}

export async function appRoutes(app: FastifyInstance) {
  app.get("/ping", (request, reply) => {
    reply.status(200).send("Pong");
  });

  const habitsBodyMiddleware = createZodMiddleware(
    z.object({
      title: z.string().min(1).max(40),
      weekDays: z.array(z.number().min(0).max(6)),
    })
  );

  app.post(
    "/habits",
    { preHandler: habitsBodyMiddleware },
    async (request, reply) => {
      logger.info("Creating habit");
      try {
        const { title, weekDays } = request.body as CreateHabitBody;
        const today = dayjs().startOf("day").toDate();
        await prisma.habit.create({
          data: {
            title,
            created_at: today,
            weekDays: {
              create: weekDays.map((weekDay) => {
                return {
                  week_day: weekDay,
                };
              }),
            },
          },
        });

        reply.status(201).send({ message: "Habit created" });
      } catch (error) {
        logger.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
      }
    }
  );

  // Create middleware for '/day' route
  const getDayParamsMiddleware = createZodMiddleware(
    z.object({
      date: z.coerce.date(),
    })
  );

  app.get(
    "/day",
    { preHandler: getDayParamsMiddleware },
    async (request, reply) => {
      logger.info("Getting day habits");
      try {
        const { date } = request.body as { date: Date };

        const parsedDate = dayjs(date).startOf("day");
        const weekDay = parsedDate.get("day");
        const possibleHabits = await prisma.habit.findMany({
          where: {
            created_at: {
              lte: date,
            },
            weekDays: {
              some: {
                week_day: weekDay,
              },
            },
          },
        });
        const day = await prisma.day.findFirst({
          where: {
            date: parsedDate.toDate(),
          },
          include: {
            dayHabits: true,
          },
        });
        const completedHabits =
          day?.dayHabits.map((dayHabit) => {
            return dayHabit.habit_id;
          }) ?? [];
        return {
          possibleHabits,
          completedHabits,
        };
      } catch (error) {
        reply.status(500).send({ error: "Internal Server Error" });
      }
    }
  );

  // Create middleware for '/habits/:id/toggle' route
  const toggleHabitParamsMiddleware = createZodMiddleware(
    z.object({
      id: z.string().uuid(),
    })
  );

  app.patch(
    "/habits/:id/toggle",
    { preHandler: toggleHabitParamsMiddleware },
    async (request, reply) => {
      logger.info("Toggling habit");
      try {
        const { id } = request.body as { id: string };

        const today = dayjs().startOf("day").toDate();
        let day = await prisma.day.findUnique({
          where: {
            date: today,
          },
        });
        if (!day) {
          day = await prisma.day.create({
            data: {
              date: today,
            },
          });
        }
        const dayHabit = await prisma.dayHabit.findUnique({
          where: {
            day_id_habit_id: {
              day_id: day.id,
              habit_id: id,
            },
          },
        });
        if (dayHabit) {
          await prisma.dayHabit.delete({
            where: {
              id: dayHabit.id,
            },
          });
        } else {
          await prisma.dayHabit.create({
            data: {
              day_id: day.id,
              habit_id: id,
            },
          });
        }
      } catch (error) {
        reply.status(500).send({ error: "Internal Server Error" });
      }
    }
  );

  app.get("/summary", async () => {
    logger.info("Getting summary");
    const summary = await prisma.$queryRaw`
      SELECT
        D.id,
        D.date,
        (
          SELECT
            cast(count(*) as float)
          FROM day_habits DH
          WHERE DH.day_id = D.id
        ) as completed,
        (
          SELECT
            cast(count(*) as float)
          FROM habit_week_days HDW
          JOIN habits H
            ON H.id = HDW.habit_id
          WHERE
            HDW.week_day = cast(strftime('%w', D.date/1000.0, 'unixepoch') as int)
            AND H.created_at <= D.date
        ) as amount
      FROM days D
    `;
    return summary;
  });
}
