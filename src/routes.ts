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
  date: string;
  deviceId: string;
}

interface ToggleHabitBody {
  id: string;
  deviceId: string;
}

interface GetSummaryQuery {
  deviceId: string;
}

interface DayInfoProps {
  possibleHabits: {
    id: string;
    title: string;
    streak: number;
    progress: number[];
  }[];
  completedHabits: string[];
}

export async function appRoutes(app: FastifyInstance) {
  app.get("/ping", (request, reply) => {
    reply.status(StatusCodes.OK).send("Pong");
  });

  // Create/update a device for '/device' route
  const deviceBodyMiddleware = createZodMiddleware(
    z.object({
      deviceId: z.string().min(1),
    })
  );

  app.post(
    "/device",
    { preHandler: deviceBodyMiddleware },
    async (request, reply) => {
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

          reply.status(StatusCodes.OK).send({ message: "Device created" });
        } else {
          await prisma.device.update({
            where: {
              id: deviceId,
            },
            data: {
              updatedAt: new Date(),
            },
          });

          reply
            .status(StatusCodes.OK)
            .send({ message: `${deviceId} has been updated` });
        }
      } catch (error) {
        logger.error(error);

        reply
          .status(StatusCodes.FORBIDDEN)
          .send({ error: "Cannot register the device" });
      }
    }
  );

  // Create habits for '/habits' route
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

      const today = dayjs().startOf("day").toDate();
      const { title, weekDays, deviceId } = request.body as CreateHabitBody;

      try {
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
          .send({ error: "Error while creating new habit" });
      }
    }
  );

  // Create middleware validation for '/day' route
  const getDayParamsMiddleware = createZodMiddleware(
    z.object({
      deviceId: z.string(),
      date: z.string(),
    })
  );

  app.post(
    "/day",
    { preHandler: getDayParamsMiddleware },
    async (request, reply) => {
      logger.info("Getting day habits");
      try {
        const { date, deviceId } = request.body as GetDayBody;
        logger.info(`Input Date: ${date}, DeviceId: ${deviceId}`);

        const parsedDate = dayjs(date).startOf("day");
        const unixTimestamp = parsedDate.valueOf();
        const weekDay = parsedDate.get("day");

        const possibleHabits = await prisma.habit.findMany({
          where: {
            createdAt: {
              lte: new Date(unixTimestamp),
            },
            weekDays: {
              some: {
                weekDay: weekDay,
              },
            },
            deviceId,
          },
          include: {
            dayHabits: {
              where: {
                day: {
                  date: {
                    gte: parsedDate.subtract(7, "day").toDate(),
                    lte: parsedDate.toDate(),
                  },
                },
              },
              include: {
                day: true,
              },
            },
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
          day?.dayHabits.map((dayHabit) => dayHabit.habitId) ?? [];

        const possibleHabitsWithProgress = possibleHabits.map((habit) => {
          const progress = Array(7).fill(0);
          habit.dayHabits.forEach((dayHabit: any) => {
            const dayIndex = dayjs(dayHabit.day.date).diff(parsedDate, "day");
            if (dayIndex >= 0 && dayIndex < 7) {
              progress[dayIndex] = 1;
            }
          });
          return {
            id: habit.id,
            title: habit.title,
            streak: habit.streak,
            progress,
          };
        });

        const result = {
          possibleHabits: possibleHabitsWithProgress,
          completedHabits,
        };

        return result;
      } catch (error) {
        logger.error(`Error in /day route: ${error}`);
        reply
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({ error: "Error while retrieving day habits" });
      }
    }
  );

  // Create middleware for '/habits/toggle' route
  const toggleHabitParamsMiddleware = createZodMiddleware(
    z.object({
      id: z.string().uuid(),
      deviceId: z.string(),
    })
  );

  app.patch(
    "/habits/toggle",
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
          await updateStreak(id, deviceId, false);
        } else {
          await prisma.dayHabit.create({
            data: {
              dayId: day.id,
              habitId: id,
              deviceId,
            },
          });
          await updateStreak(id, deviceId, true);
        }

        reply
          .status(StatusCodes.OK)
          .send({ message: "Habit toggled successfully" });
      } catch (error) {
        logger.error(`Error in /habits/toggle route: ${error}`);
        reply
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({ error: "Error while toggling habits" });
      }
    }
  );

  app.get("/summary", async (request, reply) => {
    logger.info("Getting summary");

    const { deviceId } = request.query as GetSummaryQuery;

    if (!deviceId) {
      reply.status(StatusCodes.BAD_REQUEST).send({
        error: "deviceId is required",
      });
      return;
    }

    try {
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
    } catch (error) {
      logger.error(`Error in /summary route: ${error}`);
      reply
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ error: "Error while retrieving summary" });
    }
  });
}

async function updateStreak(
  habitId: string,
  deviceId: string,
  completed: boolean
) {
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: { dayHabits: { orderBy: { day: { date: "desc" } }, take: 2 } },
  });

  if (!habit) return;

  let newStreak = completed ? 1 : 0;

  if (habit.dayHabits.length > 0) {
    const lastCompletionDate = habit.dayHabits[0].day.date;
    const yesterday = dayjs().subtract(1, "day").startOf("day").toDate();

    if (dayjs(lastCompletionDate).isSame(yesterday, "day")) {
      newStreak = completed ? habit.streak + 1 : 0;
    } else if (completed) {
      newStreak = 1;
    }
  }

  await prisma.habit.update({
    where: { id: habitId },
    data: { streak: newStreak },
  });
}
