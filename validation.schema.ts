import * as Joi from 'joi';

export const validationSchema = Joi.object({
  POSTGRES_URL: Joi.string().uri().required(),
  MONGO_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
});