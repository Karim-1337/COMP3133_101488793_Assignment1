const { body, validationResult } = require('express-validator');

const signupRules = () => [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = () => [
  body('usernameOrEmail').trim().notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const employeeRules = () => [
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('salary').isFloat({ min: 1000 }).withMessage('Salary must be at least 1000'),
  body('date_of_joining').isISO8601().withMessage('Valid date_of_joining is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
];

const employeeUpdateRules = () => [
  body('first_name').optional().trim().notEmpty(),
  body('last_name').optional().trim().notEmpty(),
  body('email').optional().trim().isEmail(),
  body('gender').optional().isIn(['Male', 'Female', 'Other']),
  body('designation').optional().trim().notEmpty(),
  body('salary').optional().isFloat({ min: 1000 }),
  body('date_of_joining').optional().isISO8601(),
  body('department').optional().trim().notEmpty(),
];

const runValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return { valid: false, errors: errors.array().map((e) => ({ field: e.path, message: e.msg })) };
  }
  return { valid: true };
};

const runRulesWithBody = async (rules, body) => {
  const req = { body };
  await Promise.all(rules().map((rule) => rule.run(req)));
  return runValidation(req);
};

module.exports = {
  signupRules,
  loginRules,
  employeeRules,
  employeeUpdateRules,
  runValidation,
  runRulesWithBody,
};
