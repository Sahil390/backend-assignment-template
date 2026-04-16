const jwt = require("jsonwebtoken");
const env = require("../config/env");
const Student = require("../models/Student");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const generateToken = (id) => {
  return jwt.sign({ sub: id }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    throw new HttpError(400, "Please provide fullName, email, and password.");
  }

  const existingStudent = await Student.findOne({ email });
  if (existingStudent) {
    throw new HttpError(400, "User already exists with this email.");
  }

  const newStudent = await Student.create({
    fullName,
    email,
    password,
  });

  const token = generateToken(newStudent._id);

  res.status(201).json({
    status: "success",
    data: {
      token,
      user: {
        _id: newStudent._id,
        fullName: newStudent.fullName,
        email: newStudent.email,
        role: newStudent.role,
      },
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new HttpError(400, "Please provide email and password.");
  }

  const student = await Student.findOne({ email });
  if (!student || !(await student.comparePassword(password))) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const token = generateToken(student._id);

  res.status(200).json({
    status: "success",
    data: {
      token,
      user: {
        _id: student._id,
        fullName: student.fullName,
        email: student.email,
        role: student.role,
      },
    },
  });
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
});

module.exports = {
  register,
  login,
  me,
};
