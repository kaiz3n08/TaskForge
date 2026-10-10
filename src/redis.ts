import { RedisClient } from "bun";

const redisUrl = process.env.REDIS_URL
const rediss = new RedisClient(redisUrl);
const subscriberRedis = new RedisClient(redisUrl)

export { rediss, subscriberRedis };
