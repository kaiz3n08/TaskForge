import Fastify from "fastify";
import { jobRoutes } from "./src/routes";

const fastify = Fastify({});
const port = 3000;

fastify.register( jobRoutes , {prefix : "v1/"})

try {
  fastify.listen({ port }, (err, add) => {
    if (err) console.error(`err: ${err}`);
    else console.log("running on ", add);
  });
} catch (err) {
  console.error(err);
}
