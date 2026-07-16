import Fastify from "fastify";
import { jobRoutes } from "./src/routes";

const fastify = Fastify({});
const port = Number(process.env.PORT);

fastify.register( jobRoutes , {prefix : "v1/"})

fastify.listen({port}, () => {
  console.log(`Listening on ${port}`);
})
