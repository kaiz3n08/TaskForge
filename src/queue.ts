import redis from "./redis";
import { prisma } from "../prisma/lib/prismaClient";
import { Prisma } from "../generated/prisma/client";

type jobRequest = {
  data: {
    jobType: string;
    payload: object;
    priority: boolean;
  };
};
export interface Job {
  id: string;
  userId: string;
  type: string;
  payload: unknown;
  priority: boolean;

}
export async function enqueue(job: jobRequest, userId: string) {
  const priority = job.data.priority ?? false;
  const id = crypto.randomUUID();
  const newJob: Job = {
    id,
    userId,
    type: job.data.jobType,
    payload: job.data.payload,
    priority,
  };
  try {
    await prisma.jobs.create({
      data: {
        id: newJob.id,
        type: newJob.type,
        payload: newJob.payload as Prisma.InputJsonValue,
        userID: newJob.userId,
        priority: newJob.priority,
      },
    });
  } catch (err) {
    throw Error(`Database insertion error :${err}`);
  }

  const jsonJob = JSON.stringify(newJob);
  if (priority) {
    try {
      await redis.lpush("forge:queue:priority", jsonJob);
      return newJob.id;
    } catch (err) {
      throw new Error(
        `Error While queueing Job:${newJob.id} \n error : ${err}`,
      );
    }
  } else {
    try {
      await redis.lpush("forge:queue:normal", jsonJob);
      return newJob.id;
    } catch (err) {
      throw new Error(
        `Error While queueing Job:${newJob.id} \n error : ${err}`,
      );
    }
  }
}
