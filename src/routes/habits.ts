import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

interface SummaryItem {
  id: number;
  date: Date;
  completed: number;
  amount: number;
}

async function habitsRoutes(app: FastifyInstance, options: any, done: () => void) { 
  
  app.post('/habits', async (request: FastifyRequest, reply: FastifyReply ) => {
    const createHabitBody = app.z.object({
      title: app.z.string(),
      weekDays: app.z.array(app.z.number().min(0).max(6))
    })
    const { title, weekDays } = createHabitBody.parse(request.body)
    const today = app.dayjs().startOf('day').toDate()   

    const habit = await app.prisma.habit.create({
      data: {
        title,
        createdAt: today,
        weekDays: {
          create: weekDays.map(weekDay => { 
            return{
              week_day: weekDay, 
            }
          })
        }       
         
      }
    })  
    if(!habit) reply.send({message: "Error to create habit"})
    reply.send({message: "Habit Created and will be available tomorrow",status: true, habit})
  })

  app.get('/day', async (request: FastifyRequest, reply: FastifyReply) => {
    const getDayParams = app.z.object({
      date: app.z.coerce.date()
    })
    const {date} = getDayParams.parse(request.query)

    const parsedDate = app.dayjs(date).startOf('day')
    const weekDay = parsedDate.get('day')

    const possibleHabits = await app.prisma.habit.findMany({
      where:{
        createdAt: {
          lte: date,
        },
        weekDays:{
          some:{
            week_day: weekDay,
          }
        }
      }
    })

    const day = await app.prisma.day.findUnique({
      where:{
        date: parsedDate.toDate(),
      },
      include:{
        dayHabits: true,
      }
    })

    const completedHabits = day?.dayHabits.map(dayHabit => {
      return dayHabit.habit_id    
    }) ?? []

    if(!possibleHabits) reply.send({status: false, message: "Error to get possible habits at this day"})
    reply.send({possibleHabits, completedHabits})
  })

  app.patch('/habits/:id/toggle', async (request: FastifyRequest, reply: FastifyReply) => {
    const toggleHabitsParams = app.z.object({
      id: app.z.string().uuid()
    })
  
    const { id } = toggleHabitsParams.parse(request.params)
  
    const today = app.dayjs().startOf('day').toDate()
  
    let day = await app.prisma.day.findUnique({
      where: {
        date: today,
      }
    })
  
    if (!day) {
      day = await app.prisma.day.create({
        data: {
          date: today,
        }
      })
    }
  
    const dayHabit = await app.prisma.dayHabit.findUnique({
      where: {
        day_id_habit_id: {
          day_id: day.id,
          habit_id: id,
        }
      }
    })
  
    if (dayHabit) {
      await app.prisma.dayHabit.delete({
        where: {
          id: dayHabit.id,
        }
      })
    } else {
      await app.prisma.dayHabit.create({
        data: {
          day_id: day.id,
          habit_id: id,
          },
        })
    }
  })  

  app.get('/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    const summary:[] = await app.prisma.$queryRaw`
    SELECT 
      D.id, 
      D.date,
      (
        SELECT 
          CAST(COUNT(*) AS FLOAT)
        FROM day_habits DH
        WHERE DH.day_id = D.id
      ) AS completed,
      (
        SELECT
          CAST(COUNT(*) AS FLOAT)
        FROM habit_week_days HWD
          JOIN habits H ON H.id = HWD.habit_id
        WHERE
          HWD.week_day = EXTRACT(DOW FROM TIMESTAMP 'epoch' + DATE_PART('epoch', D.date) * INTERVAL '1 second')::INT
          AND H."createdAt" < D.date
      ) AS amount
    FROM days D
  `;

  
    const formattedSummary = summary.map((item: any) => ({
      ...item,
      completed: Number(item.completed),
      amount: Number(item.amount),
    }));    
    console.log(formattedSummary)
  
    reply.send({ summary: formattedSummary });
  });
  
  
  done()
}

export default habitsRoutes
