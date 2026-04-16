const Program = require("../models/Program");
const Student = require("../models/Student");
const HttpError = require("../utils/httpError");

async function buildProgramRecommendations(studentId) {
  const student = await Student.findById(studentId).lean();

  if (!student) {
    throw new HttpError(404, "Student not found.");
  }

  // Create a regex pattern for field matching, e.g., "(Computer|Data)"
  let fieldRegexPattern = null;
  if (student.interestedFields && student.interestedFields.length > 0) {
    fieldRegexPattern = student.interestedFields
      .map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
  }

  const pipeline = [
    {
      $addFields: {
        matchScore: {
          $add: [
            // 1. Preferred country match: 35 points
            {
              $cond: [
                {
                  $in: [
                    "$country",
                    student.targetCountries && student.targetCountries.length > 0
                      ? student.targetCountries
                      : [],
                  ],
                },
                35,
                0,
              ],
            },
            // 2. Field alignment match: 30 points
            fieldRegexPattern
              ? {
                  $cond: [
                    {
                      $regexMatch: {
                        input: "$field",
                        regex: fieldRegexPattern,
                        options: "i",
                      },
                    },
                    30,
                    0,
                  ],
                }
              : 0,
            // 3. Within budget match: 20 points
            {
              $cond: [
                {
                  $lte: [
                    "$tuitionFeeUsd",
                    student.maxBudgetUsd || 9999999,
                  ],
                },
                20,
                0,
              ],
            },
            // 4. Preferred intake match: 10 points
            {
              $cond: [
                {
                  $and: [
                    { $ne: [student.preferredIntake || null, null] },
                    {
                      $in: [
                        student.preferredIntake || "",
                        { $ifNull: ["$intakes", []] },
                      ],
                    },
                  ],
                },
                10,
                0,
              ],
            },
            // 5. English test score meets requirement: 5 points
            {
              $cond: [
                {
                  $lte: [
                    "$minimumIelts",
                    student.englishTest?.score || 0,
                  ],
                },
                5,
                0,
              ],
            },
          ],
        },
      },
    },
    // Filter out programs with a low match score (optional, we'll return top anyways)
    {
      $match: {
        matchScore: { $gt: 0 },
      },
    },
    // Sort by matchScore descending
    {
      $sort: { matchScore: -1, tuitionFeeUsd: 1 },
    },
    // Limit to top 5 recommendations
    {
      $limit: 5,
    },
  ];

  const recommendations = await Program.aggregate(pipeline);

  return {
    data: {
      student: {
        id: student._id,
        fullName: student.fullName,
        targetCountries: student.targetCountries,
        interestedFields: student.interestedFields,
      },
      recommendations,
    },
    meta: {
      implementationStatus: "completed-using-mongodb-aggregation",
    },
  };
}

module.exports = {
  buildProgramRecommendations,
};
