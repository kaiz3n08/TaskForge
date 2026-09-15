import { rediss } from "./redis";
import { prisma } from "../prisma/lib/prismaClient";

export async function worker() {
  while (true) {
    const RemovedJob = await rediss.brpop(
      "forge:queue:priority",
      "forge:queue:normal",
      0,
    );
    const JsonJob = JSON.parse(RemovedJob?.[1] as string);

    await prisma.jobs.update({
      where: {
        id: JsonJob.id,
      },
      data: {
        status: "ACTIVE",
      },
    });
    console.log(`Job ${JsonJob?.id} is processing`);

    await new Promise((resolve) => setTimeout(resolve, 15000));
    await prisma.jobs.update({
      where: {
        id: JsonJob.id,
      },
      data: {
        status: "COMPLETED",
      },
    });
    console.log(`Job ${JsonJob?.id} is COMPLETED`);
  }
}
