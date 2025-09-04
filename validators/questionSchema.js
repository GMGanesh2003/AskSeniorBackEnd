const Joi = require('joi');

const questionJoiSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
    whoCanAnswer: Joi.array().items(Joi.string()).required(),
    askAnonymously: Joi.boolean().default(false),
    votes: Joi.number().integer().min(0).default(0),
})
    .required();

module.exports = questionJoiSchema;
