import { type FastifyInstance } from "fastify";
import { enqueue } from "./queue";
import { searchId } from "./helper/search";
import { prisma } from "../prisma/lib/prismaClient";
import { rediss, subscriberRedis } from "./redis";

const jobSchema = {
  schema: {
    body: {
      type: 'object',
      required: ["data"],
      properties: {
        data: {
          required: ["jobType", "payload"],
          jobType: { type: "string" },
          payload: { type: "object" },
          priority: { type: "boolean", default: false },
        }
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

  fastify.get("/jobs", async (req, res) => {

    const userid = req.headers["x-userid"] as string;
    if (!userid) {
      return res.status(404).send({
        msg: "No user id found",
      });
    }
    const allJobs = await prisma.jobs.findMany({
      where: {
        userID: userid,
      },
    });
    return res.status(200).send({
      YourJobs: allJobs,
    });
  });


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
    if (!id) {
      return res.status(404).send({
        msg: "Id is not provided in parameters!",
      });
    }
    const job = await searchId(userId, id)

    if (!job) {
      return res.status(404).send({
        error: "job id is wrong!",
      });
    }

    if (job?.userID != userId) {
      return res.status(403).send({
        error: "Wrong user id!",
      });
    }
    return res.status(200).send({
      jobType: job.type,
      jobID: job.id,
      jobStatus: job.status,
      updatedAt: job.UpdatedAt,
    });
  });

  fastify.delete<{ Params: { id: string } }>(
    "/job/cancel/:id",
    async (req, res) => {
      const userId = req.headers["x-userid"] as string;
      const { id } = req.params;
      if (!userId) {
        return res.status(400).send({
          msg: "userid not found , kindly add it!",
        });
      }
      if (!id) {
        return res.status(409).send({
          msg: "Id is not provided in parameters!",
        });
      }
      const job = await searchId(userId, id);

      if (!job) {
        return res.status(400).send({
          msg: "job not found!",
        });
      }

      if (job?.status === "ACTIVE") {
        return res.status(406).send({
          msg: "Job is active can't be deleted",
        });
      }

      if (job?.status === "CANCELLED") {
        return res.status(409).send({
          msg: "Job is CANCELLED already!",
        });
      }

      const updateJobStatus = await prisma.jobs.update({
        where: {
          id: id,
          status: "QUEUED"
        },
        data: {
          status: "CANCELLED",
        },
      });
      await rediss.publish(`job-update:${updateJobStatus.id}`, "JOB CANCELLED")
      return res.status(200).send({
        msg: `CANCELLED job : ${updateJobStatus.id}`,
      });
    },
  )

  const server = Bun.serve({
    routes: {
      "/live/:id": async (req) => {
        const userId = req.headers.get("user-id") as string;
        const jobId: string = req.params.id;
        if (!userId) {
          return Response.json("No userid provided", { status: 400 });
        }
        const userCheck = await searchId(userId, jobId);
        if (!userCheck) {
          return Response.json(
            {
              err: "Invalid credentials",
            },
            { status: 404 },
          );
        }
        const success = server.upgrade(req, {
          data: {
            userId,
            jobId,
            status: userCheck.status,
          },
        });
        if (success) return;

        Response.json(
          {
            msg: "upgrading websocket FAILED",
          },
          { status: 505 },
        )
      },
    },
    port: Number(process.env.WS_PORT),
    fetch() {
      return new Response("Not found!")
    },
    websocket: {
      data: {} as {
        userId: string;
        jobId: string;
        status: string;
      },
      async open(ws) {
        const statusType = ["COMPLETED", "FAILED", "CANCELLED"];
        ws.send(ws.data.status);
        if (statusType.includes(ws.data.status)) {
          ws.close(1000, "job is COMPLETED");
        }
        await subscriberRedis.subscribe(
          `job-update:${ws.data.jobId}`,
          async (msg, channel) => {
            ws.send(`Job status is ${msg}`);
            ws.close(1000)
            if (statusType.includes(msg)) {
              await subscriberRedis.unsubscribe(channel);
              ws.close(1000, msg);
            }
          },
        );
      },
      async message(ws, message) {
        ws.send(`message received : ${message}`)
      },
      async close(ws, code, reason) {
        await subscriberRedis.unsubscribe(`job-update:${ws.data.jobId}`);
      },
    }
  });
}
