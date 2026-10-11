import { rediss } from "./redis";
import { prisma } from "../prisma/lib/prismaClient";
import { Status } from "../generated/prisma/enums";

export async function worker() {
  while (true) {
    try {
      const RemovedJob = await rediss.brpop(
        "forge:queue:priority",
        "forge:queue:normal",
        0,
      );
      const JsonJob = JSON.parse(RemovedJob?.[1] as string);
      try {
        await new Promise((resolve) => setTimeout(resolve, 15000));
        await prisma.jobs.update({
          where: {
            id: JsonJob.id,
            status: "QUEUED",
          },
          data: {
            status: "ACTIVE",
          },
        });
        await rediss.publish(`job-update:${JsonJob.id}`, "ACTIVE");

        await new Promise((resolve) => setTimeout(resolve, 15000));
        await prisma.jobs.update({
          where: {
            id: JsonJob.id,
          },
          data: {
            status: "COMPLETED",
          },
        });
        await rediss.publish(`job-update:${JsonJob.id}`, "COMPLETED");
      } catch (err) {
        await prisma.jobs.update({
          where: {
            id: JsonJob.id,
          },
          data: {
            status: "FAILED",
            error: String(err),
          },
        });
        await rediss.publish(`job-update:${JsonJob.id}`, "FAILED");
      }
    } catch (err) {
      console.error(`worker error : ${err}`);
    }
  }
}
