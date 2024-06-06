import dayjs from "dayjs";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "./prisma";

import { logger } from "./logger";

import { createZodMiddleware } from "./utils/zod-middleware";

interface CreateHabitBody {
  title: string;
  weekDays: number[];
  deviceId: string;
}

interface GetDayBody {
  date: Date;
  deviceId: string;
}

interface ToggleHabitBody {
  id: string;
  deviceId: string;
}

interface GetSummaryQuery {
  deviceId: string;
}

export async function appRoutes(app: FastifyInstance) {
  app.get("/ping", (request, reply) => {
    reply.status(200).send("Pong");
  });

  const habitsBodyMiddleware = createZodMiddleware(
    z.object({
      title: z.string().min(1).max(40),
      weekDays: z.array(z.number().min(0).max(6)),
      deviceId: z.string(),
    })
  );

  app.post(
    "/habits",
    { preHandler: habitsBodyMiddleware },
    async (request, reply) => {
      logger.info("Creating habit");
      try {
        const { title, weekDays, deviceId } = request.body as CreateHabitBody;
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
            deviceId,
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
      deviceId: z.string(),
    })
  );

  app.get(
    "/day",
    { preHandler: getDayParamsMiddleware },
    async (request, reply) => {
      logger.info("Getting day habits");
      try {
        const { date, deviceId } = request.body as GetDayBody;

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
            deviceId,
          },
        });
        const day = await prisma.day.findFirst({
          where: {
            date: parsedDate.toDate(),
            deviceId,
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
      deviceId: z.string(),
    })
  );

  app.patch(
    "/habits/:id/toggle",
    { preHandler: toggleHabitParamsMiddleware },
    async (request, reply) => {
      logger.info("Toggling habit");
      try {
        const { id, deviceId } = request.body as ToggleHabitBody;

        const today = dayjs().startOf("day").toDate();
        let day = await prisma.day.findUnique({
          where: {
            date_deviceId: {
              date: today,
              deviceId,
            },
          },
        });

        if (!day) {
          day = await prisma.day.create({
            data: {
              date: today,
              deviceId,
            },
          });
        }

        const dayHabit = await prisma.dayHabit.findUnique({
          where: {
            day_id_habit_id_deviceId: {
              day_id: day.id,
              habit_id: id,
              deviceId,
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
              deviceId,
            },
          });
        }
      } catch (error) {
        reply.status(500).send({ error: "Internal Server Error" });
      }
    }
  );

  app.get("/summary", async (request) => {
    logger.info("Getting summary");

    const { deviceId } = request.query as GetSummaryQuery;
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
            AND H.deviceId = ${deviceId}
        ) as amount
      FROM days D
      WHERE D.deviceId = ${deviceId}
    `;
    return summary;
  });
}
