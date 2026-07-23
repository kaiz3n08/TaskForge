import { RedisClient } from "bun";

const redisUrl = process.env.REDIS_URL
const redis = new RedisClient(redisUrl);

export default redis;
