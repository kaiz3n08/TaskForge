import { type FastifyInstance } from "fastify";
import { QueueingJobs } from "./queue";

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
    const { data } = req.body as data;
    QueueingJobs({data});
    res.send("job pst")
  })
  fastify.get("/job/:id", async (req, res) => { res.send("jobs sear") })
  fastify.delete("/job/:id", async (req, res) => { res.send("job s") })
}
