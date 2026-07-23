import redis from "./redis";

type jobRequest = {
  data: {
    jobType: string,
    payload: object,
    priority: boolean
  }
}
export interface Job{
  id: string,
  userId: string,
  type: string,
  payload: unknown,
  priority: boolean,
  createdAt: number
}
export async function enqueue(job: jobRequest) {
  const priority = job.data.priority ?? false;
  const id = crypto.randomUUID();
  const newJob : Job = {
    id,
    userId: "123",
    type:job.data.jobType,
    payload: job.data.payload,
    priority,
    createdAt : Date.now()
  }
  const jsonJob = JSON.stringify(newJob)
  if (priority) {
    try {
      await redis.lpush('forge:queue:priority', jsonJob);
      return newJob.id;
    } catch (err) {
      throw new Error(`Error While queueing Job:${newJob.id} \n error : ${err}`);
    }
  }
  else {
    try {
          await redis.lpush('forge:queue:normal', jsonJob);
          return newJob.id;
        } catch (err) {
          throw new Error(`Error While queueing Job:${newJob.id} \n error : ${err}`);
        }
  }
}
