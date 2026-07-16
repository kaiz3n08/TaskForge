import {type FastifyInstance } from "fastify";

export function jobRoutes(fastify: FastifyInstance) {
  fastify.get("/jobs", async () => { })
  fastify.post("/job", async () => { })
  fastify.get("/job/:id", async () => { })
  fastify.delete("/job/:id",async()=>{ })
}
