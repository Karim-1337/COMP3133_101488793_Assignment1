const User = require('../models/User');
const Employee = require('../models/Employee');
const { signToken, getContextUser } = require('../utils/auth');
const {
  signupRules,
  loginRules,
  employeeRules,
  employeeUpdateRules,
  runRulesWithBody,
} = require('../utils/validation');
const { uploadToCloudinary } = require('../config/cloudinary');

const parseBase64Image = (dataUrl) => {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;
  return Buffer.from(matches[2], 'base64');
};

const resolvers = {
  Date: {
    __serialize: (value) => (value ? new Date(value).toISOString() : null),
  },
  Query: {
    login: async (_, { input }, context) => {
      const validation = await runRulesWithBody(loginRules, {
        usernameOrEmail: input.usernameOrEmail,
        password: input.password,
      });
      if (!validation.valid) {
        return {
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          token: null,
          user: null,
        };
      }
      const user = await User.findOne({
        $or: [{ username: input.usernameOrEmail }, { email: input.usernameOrEmail }],
      });
      if (!user) {
        return { success: false, message: 'Invalid username/email or password', token: null, user: null };
      }
      const match = await user.comparePassword(input.password);
      if (!match) {
        return { success: false, message: 'Invalid username/email or password', token: null, user: null };
      }
      const token = signToken(user._id, user.username);
      const userObj = {
        _id: user._id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
      return { success: true, message: 'Login successful', token, user: userObj };
    },

    getAllEmployees: async (_, __, context) => {
      try {
        const employees = await Employee.find().sort({ created_at: -1 });
        return {
          success: true,
          message: 'Employees retrieved successfully',
          employees,
          count: employees.length,
        };
      } catch (err) {
        return {
          success: false,
          message: err.message || 'Failed to fetch employees',
          employees: [],
          count: 0,
        };
      }
    },

    getEmployeeByEid: async (_, { eid }, context) => {
      try {
        const employee = await Employee.findById(eid);
        if (!employee) {
          return { success: false, message: 'Employee not found', employee: null };
        }
        return { success: true, message: 'Employee found', employee };
      } catch (err) {
        return { success: false, message: err.message || 'Invalid employee ID', employee: null };
      }
    },

    getEmployeesByDesignationOrDepartment: async (_, { designation, department }, context) => {
      if (!designation && !department) {
        return {
          success: false,
          message: 'Provide at least designation or department',
          employees: [],
          count: 0,
        };
      }
      const filter = {};
      if (designation) filter.designation = new RegExp(designation, 'i');
      if (department) filter.department = new RegExp(department, 'i');
      try {
        const employees = await Employee.find(filter).sort({ created_at: -1 });
        return {
          success: true,
          message: 'Employees retrieved successfully',
          employees,
          count: employees.length,
        };
      } catch (err) {
        return {
          success: false,
          message: err.message || 'Failed to fetch employees',
          employees: [],
          count: 0,
        };
      }
    },
  },

  Mutation: {
    signup: async (_, { input }, context) => {
      const validation = await runRulesWithBody(signupRules, input);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          token: null,
          user: null,
        };
      }
      const existing = await User.findOne({
        $or: [{ username: input.username }, { email: input.email }],
      });
      if (existing) {
        return {
          success: false,
          message: 'Username or email already in use',
          token: null,
          user: null,
        };
      }
      try {
        const user = await User.create(input);
        const token = signToken(user._id, user.username);
        const userObj = {
          _id: user._id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
        };
        return { success: true, message: 'Account created successfully', token, user: userObj };
      } catch (err) {
        return {
          success: false,
          message: err.message || 'Signup failed',
          token: null,
          user: null,
        };
      }
    },

    addEmployee: async (_, { input }, context) => {
      const body = {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        gender: input.gender,
        designation: input.designation,
        salary: input.salary,
        date_of_joining: input.date_of_joining,
        department: input.department,
      };
      const validation = await runRulesWithBody(employeeRules, body);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          employee: null,
        };
      }
      const existing = await Employee.findOne({ email: input.email });
      if (existing) {
        return { success: false, message: 'Employee with this email already exists', employee: null };
      }
      let photoUrl = null;
      if (input.employee_photo_base64 && process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          const buffer = parseBase64Image(input.employee_photo_base64);
          if (buffer) photoUrl = await uploadToCloudinary(buffer);
        } catch (e) {
          return {
            success: false,
            message: 'Failed to upload photo: ' + (e.message || 'Unknown error'),
            employee: null,
          };
        }
      }
      try {
        const employee = await Employee.create({
          ...body,
          date_of_joining: new Date(input.date_of_joining),
          employee_photo: photoUrl,
        });
        return { success: true, message: 'Employee added successfully', employee };
      } catch (err) {
        return {
          success: false,
          message: err.message || 'Failed to add employee',
          employee: null,
        };
      }
    },

    updateEmployeeByEid: async (_, { eid, input }, context) => {
      const employee = await Employee.findById(eid);
      if (!employee) {
        return { success: false, message: 'Employee not found', employee: null };
      }
      const body = {
        first_name: input.first_name ?? employee.first_name,
        last_name: input.last_name ?? employee.last_name,
        email: input.email ?? employee.email,
        gender: input.gender ?? employee.gender,
        designation: input.designation ?? employee.designation,
        salary: input.salary ?? employee.salary,
        date_of_joining: input.date_of_joining ? new Date(input.date_of_joining) : employee.date_of_joining,
        department: input.department ?? employee.department,
      };
      const validation = await runRulesWithBody(employeeUpdateRules, {
        ...body,
        date_of_joining: body.date_of_joining instanceof Date ? body.date_of_joining.toISOString() : body.date_of_joining,
      });
      if (!validation.valid) {
        return {
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          employee: null,
        };
      }
      if (input.email && input.email !== employee.email) {
        const existing = await Employee.findOne({ email: input.email });
        if (existing) {
          return { success: false, message: 'Another employee with this email exists', employee: null };
        }
      }
      let photoUrl = employee.employee_photo;
      if (input.employee_photo_base64 && process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          const buffer = parseBase64Image(input.employee_photo_base64);
          if (buffer) photoUrl = await uploadToCloudinary(buffer);
        } catch (e) {
          return {
            success: false,
            message: 'Failed to upload photo: ' + (e.message || 'Unknown error'),
            employee: null,
          };
        }
      }
      try {
        const updated = await Employee.findByIdAndUpdate(
          eid,
          { ...body, employee_photo: photoUrl, updated_at: new Date() },
          { new: true }
        );
        return { success: true, message: 'Employee updated successfully', employee: updated };
      } catch (err) {
        return {
          success: false,
          message: err.message || 'Failed to update employee',
          employee: null,
        };
      }
    },

    deleteEmployeeByEid: async (_, { eid }, context) => {
      try {
        const result = await Employee.findByIdAndDelete(eid);
        if (!result) {
          return { success: false, message: 'Employee not found' };
        }
        return { success: true, message: 'Employee deleted successfully' };
      } catch (err) {
        return { success: false, message: err.message || 'Failed to delete employee' };
      }
    },
  },
};

module.exports = resolvers;
