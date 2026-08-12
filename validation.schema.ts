import * as Joi from 'joi';
import { ApiKeyAuthGuard } from './auth.guard';

export const validationSchema = Joi.object({
  APP_MODE: Joi.string().valid('development', 'production').default('development'),
  POSTGRES_URL: Joi.string().uri().required(),
  POSTGRES_ADMIN_URL: Joi.string().uri().required(),
  MONGO_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
  ANTHROPIC_API_KEY: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  // API_KEY: Joi.string().required(), // No longer needed for JWT auth
  SWAGGER_USER: Joi.string().when('APP_MODE', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SWAGGER_PASSWORD: Joi.string().when('APP_MODE', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});