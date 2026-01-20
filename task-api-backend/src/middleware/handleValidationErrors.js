import { validationResult } from 'express-validator';

export function checkValidationResults(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({
        error: 'Validation failed',
        details: errors.array().map((err) => err.msg),
      });
  }
  next();
}
