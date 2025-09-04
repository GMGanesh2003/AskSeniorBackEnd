const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.base': 'Username should be a type of string',
      'string.min': 'Username should have a minimum length of 3',
      'string.max': 'Username should have a maximum length of 30',
      'any.required': 'Username is a required field',
    }),
  
  firstName: Joi.string()
    .required()
    .messages({
      'string.base': 'First name should be a type of string',
      'any.required': 'first name is a required field',
    }),
  
  lastName: Joi.string()
    .required()
    .messages({
      'string.base': 'Last name should be a type of string',
      'any.required': 'last name is a required field',
    }),

  email: Joi.string()
      .email({ tlds: { allow: false } })
      // .pattern(/^[a-zA-Z0-9._%+-]+@(vitapstudent\.ac\.in|vitap\.ac\.in)$/)
      .required()
      .messages({
        'string.email': 'Invalid email format',
        'string.pattern.base': "Email must belong to 'vitapstudent.ac.in' or 'vitap.ac.in' domains only",
        'any.required': 'Email is required',
      }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.base': 'Password should be a type of string',
      'string.min': 'Password should have a minimum length of 8',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
      'any.required': 'Password is a required field',
    }),

  enabled: Joi.boolean().default(false),

  role: Joi.string()
    .valid('STUDENT', 'ALUMNI', 'FACULTY')
    .required()
    .messages({
      'string.base': 'Role should be a type of string',
      'any.only': 'Role must be one of [student, alumin, admin]',
      'any.required': 'Role is a required field',
    }),

  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      'string.base': 'Phone number should be a type of string',
      'string.pattern.base': 'Phone number must be a valid 10-digit number',
    })
    .optional(),

  githubLink: Joi.string().uri().optional(),
  linkedin: Joi.string().uri().optional(),
  portfolio: Joi.string().uri().optional(),
  facebook: Joi.string().uri().optional(),
  instagram: Joi.string().uri().optional(),
  regNo: Joi.string().optional(),
  branchOfStudy: Joi.string().optional(),
  currentYear: Joi.string().optional(),
  graduationYear: Joi.string().optional(),
});

module.exports = registerSchema;
