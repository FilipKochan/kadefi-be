describe("platforms", () => {
  const request = require("supertest");
  const { app, server } = require("../index");

  describe("GET /platforms", () => {
    it("should return all platforms", async () => {
      const res = await request(app).get("/api/platforms");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe("anedak");
    });
  });

  afterAll(() => {
    server.close();
  });
});
