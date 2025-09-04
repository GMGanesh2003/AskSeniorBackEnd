const { StatusCodes } = require('http-status-codes');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,   // Return all validation errors, not just the first
    stripUnknown: true   // Remove properties not defined in the schema
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: 'Validation error',
      errors
    });
  }

  req.body = value; // Replace request body with the validated data
  next();
};

module.exports = { validate };
