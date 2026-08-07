import { type FastifyInstance } from "fastify";
import { enqueue } from "./queue";
import { prisma } from "../prisma/lib/prismaClient";
import { Status } from "../generated/prisma/enums";
const jobSchema = {
  schema: {
    body: {
      type: 'object',
      properties: {
        jobType: { type: 'string' },
        payload: { type: 'object' },
        priority : {type: 'boolean' , default : false}
      }
    }
  }
}


type data = {
  data: {
    jobType: string,
    payload: object,
    priority: boolean
  }
}

export function jobRoutes(fastify: FastifyInstance) {
  fastify.get("/jobs", async (req , res) => { res.send("jobs") })
  fastify.post("/job", jobSchema , async (req, res) => {
    try {
      const userId = req.headers["x-userid"] as string;
      if (!userId) {
        return res.status(400).send({
          msg: "userid not found , kindly add it!",
        });
      }
      const { data } = req.body as data;
      const JobId = await enqueue({ data }, userId);
      res.status(201).send(`JobId : ${JobId}, It is Queued`);

    } catch (err) {
      res.status(500).send(`Internal Server Error: ${err}`)
    }
  })
  fastify.get<{ Params: { id: string } }>("/job/:id", async (req, res) => {
    const userId = req.headers["x-userid"] as string;
    if (!userId) {
      return res.status(400).send({
        msg: "userid not found , kindly add it!",
      });
    }
    const { id } = req.params;
    const job = await prisma.jobs.findFirst({
      where: {
        id,
        userID: userId,
      },
    });
    if (job?.userID != userId) {
      return res.status(403).send({
        error: "Wrong user id!",
      });
    }
    if (!job) {
      return res.status(404).send({
        error: "job id is wrong!",
      });
    }
    return res.status(200).send({
      jobType: job.type,
      jobID: job.id,
      jobStatus: job.status,
      updatedAt: job.UpdatedAt,
    });
  });
  fastify.delete("/job/:id", async (req, res) => {
    res.send("job s");
  });
}
