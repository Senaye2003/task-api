import { body } from "express-validator";
import { checkValidationResults } from "./handleValidationErrors.js";

export const validateTaskUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be at least 3 and at most 100 characters"),

  body("completed")
    .optional()
    .isBoolean()
    .withMessage("completed must be true or false")
    .toBoolean(),

  // Require at least one field on PATCH
  (req, res, next) => {
    const hasTitle = Object.prototype.hasOwnProperty.call(req.body, "title");
    const hasCompleted = Object.prototype.hasOwnProperty.call(req.body, "completed");
    if (!hasTitle && !hasCompleted) {
      return res.status(400).json({
        error: "Validation failed",
        details: ["Provide at least one of: title, completed"],
      });
    }
    next();
  },

  checkValidationResults,
];