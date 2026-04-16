const Application = require("../models/Application");
const Program = require("../models/Program");
const { validStatusTransitions } = require("../config/constants");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const listApplications = asyncHandler(async (req, res) => {
  const { studentId, status } = req.query;
  const filters = {};

  if (studentId) {
    filters.student = studentId;
  }

  if (status) {
    filters.status = status;
  }

  const applications = await Application.find(filters)
    .populate("student", "fullName email role")
    .populate("program", "title degreeLevel tuitionFeeUsd")
    .populate("university", "name country city")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: applications,
  });
});

const createApplication = asyncHandler(async (req, res) => {
  const { studentId, programId, intake } = req.body;

  if (!studentId || !programId || !intake) {
    throw new HttpError(400, "studentId, programId, and intake are required.");
  }

  const program = await Program.findById(programId);
  if (!program) {
    throw new HttpError(404, "Program not found.");
  }

  const existingApplication = await Application.findOne({
    student: studentId,
    program: programId,
    intake,
  });

  if (existingApplication) {
    throw new HttpError(400, "You have already applied to this program for the selected intake.");
  }

  const application = await Application.create({
    student: studentId,
    program: programId,
    university: program.university,
    destinationCountry: program.country,
    intake,
    status: "draft",
    timeline: [{ status: "draft", note: "Application created." }],
  });

  res.status(201).json({
    success: true,
    data: application,
  });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status) {
    throw new HttpError(400, "Status is required.");
  }

  const application = await Application.findById(id);
  if (!application) {
    throw new HttpError(404, "Application not found.");
  }

  const allowedTransitions = validStatusTransitions[application.status] || [];
  if (!allowedTransitions.includes(status)) {
    throw new HttpError(
      400,
      `Invalid status transition from '${application.status}' to '${status}'.`
    );
  }

  application.status = status;
  application.timeline.push({
    status,
    note: note || `Status updated to ${status}.`,
  });

  await application.save();

  res.status(200).json({
    success: true,
    data: application,
  });
});

module.exports = {
  createApplication,
  listApplications,
  updateApplicationStatus,
};
