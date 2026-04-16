const request = require("supertest");
const app = require("../src/app");
const Student = require("../src/models/Student");
const jwt = require("jsonwebtoken");

// Mocking the database and jwt
jest.mock("../src/models/Student");
jest.mock("jsonwebtoken");

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should successfully register a new user and return a token", async () => {
      // Mock finding no existing user
      Student.findOne.mockResolvedValue(null);

      // Mock user creation
      const mockStudent = {
        _id: "mock_id_123",
        fullName: "Test User",
        email: "test@example.com",
        role: "student",
      };
      
      Student.create.mockResolvedValue(mockStudent);
      jwt.sign.mockReturnValue("mock_jwt_token");

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          fullName: "Test User",
          email: "test@example.com",
          password: "password123",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBeUndefined(); // It actually returns { status: "success", data: ... }
      expect(response.body.status).toBe("success");
      expect(response.body.data.token).toBe("mock_jwt_token");
      expect(response.body.data.user.email).toBe("test@example.com");
    });

    it("should return 400 if user already exists", async () => {
      Student.findOne.mockResolvedValue({ email: "test@example.com" });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          fullName: "Test User",
          email: "test@example.com",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User already exists with this email.");
    });
  });
});
