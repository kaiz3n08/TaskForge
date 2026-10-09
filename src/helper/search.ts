import { prisma } from "../../prisma/lib/prismaClient";
export async function searchId(userid: string, id?: string) {
  const job = await prisma.jobs.findFirst({
    where: {
      id,
      userID: userid,
    },
  });
  return job;
}
