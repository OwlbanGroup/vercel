import * as Joi from 'joi';

export const validationSchema = Joi.object({
  APP_MODE: Joi.string().valid('development', 'production').default('development'),
  POSTGRES_URL: Joi.string().uri().required(),
  POSTGRES_ADMIN_URL: Joi.string().uri().required(),
  MONGO_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
});