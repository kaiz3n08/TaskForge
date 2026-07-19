import { RedisClient } from "bun";

const redisUrl = process.env.REDIS_URL
const rawclient = new RedisClient(redisUrl);

type data = {
  data: {
    jobType: string,
    payload: object,
    priority: boolean
  }
}
export async function QueueingJobs(job: data) {
  const priority = job.data.priority ?? false

}
