import dayjs from "dayjs";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { StatusCodes } from "http-status-codes";

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
    reply.status(StatusCodes.OK).send("Pong");
  });

  const habitsBodyMiddleware = createZodMiddleware(
    z.object({
      title: z.string().min(1).max(40),
      weekDays: z.array(z.number().min(0).max(6)),
      deviceId: z.string(),
    })
  );

  app.post("/device", async (request, reply) => {
    logger.info("Creating or updating device");

    try {
      const { deviceId } = request.body as { deviceId: string };

      const device = await prisma.device.findUnique({
        where: {
          id: deviceId,
        },
      });

      if (!device) {
        await prisma.device.create({
          data: {
            id: deviceId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.device.update({
          where: {
            id: deviceId,
          },
          data: {
            updatedAt: new Date(),
          },
        });
      }

      reply
        .status(StatusCodes.OK)
        .send({ message: "Device created or updated" });
    } catch (error) {
      logger.error(error);
      reply
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ error: "Internal Server Error" });
    }
  });

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
            createdAt: today,
            weekDays: {
              create: weekDays.map((weekDay) => {
                return {
                  weekDay,
                };
              }),
            },
            deviceId,
          },
        });

        reply.status(StatusCodes.CREATED).send({ message: "Habit created" });
      } catch (error) {
        logger.error(error);
        reply
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({ error: "Internal Server Error" });
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
            createdAt: {
              lte: date,
            },
            weekDays: {
              some: {
                weekDay: weekDay,
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
            return dayHabit.habitId;
          }) ?? [];
        return {
          possibleHabits,
          completedHabits,
        };
      } catch (error) {
        reply
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({ error: "Internal Server Error" });
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
            dayId_habitId_deviceId: {
              dayId: day.id,
              habitId: id,
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
              dayId: day.id,
              habitId: id,
              deviceId,
            },
          });
        }
      } catch (error) {
        reply
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({ error: "Internal Server Error" });
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
            AND H.device_id = ${deviceId}
        ) as amount
      FROM days D
      WHERE D.device_id = ${deviceId}
    `;
    return summary;
  });
}
