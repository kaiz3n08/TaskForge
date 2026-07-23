import redis from "./redis";

export async function worker() {
  while (true) {
    const RemovedJob = await redis.brpop(
      "forge:queue:priority",
      "forge:queue:normal",
      0,
    );
    const JsonJob = JSON.parse(RemovedJob?.[1] as string);
    console.log(`JobId : ${JsonJob.id} is completed! `);
  }
}
