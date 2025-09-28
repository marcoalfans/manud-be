import Joi from 'joi';

export const resendVerification = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};