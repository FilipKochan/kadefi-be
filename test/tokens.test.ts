import { PrismaClient } from "@prisma/client";
import express from "express";
import { Server } from "http";
const request = require("supertest");
let app: express.Express;
let server: Server;
let insertedId: number;

beforeAll(() => {
  app = require("../index").app;
  server = require("../index").server;
});

afterAll(async () => {
  server.close();
  const prisma = new PrismaClient();
  await prisma.price_records.delete({
    where: { id: insertedId },
  });
  await prisma.$disconnect();
});

describe("tokens", () => {
  describe("GET /tokens", () => {
    it("should return all tokens", async () => {
      const res = await request(app).get("/api/tokens");
      // console.log(res.body);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(4);
      expect(res.body[2].name).toBe("free.babena");
    });
  });

  describe("GET /tokens/prices", () => {
    it("should return all prices", async () => {
      const res = await request(app).get("/api/tokens/prices");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(295);

      for (let i = 1; i < res.body.length; i++) {
        const ts1 = res.body[i].timestamp;
        const ts2 = res.body[i - 1].timestamp;
        expect(ts1 >= ts2).toBe(true);
      }
    });
  });

  describe("GET /tokens/prices with query", () => {
    it("should return prices for kdlaunch.token", async () => {
      const res = await request(app).get("/api/tokens/prices?token_id=1");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(87);
      res.body.forEach((row: any) => {
        expect(row.tokens.name).toBe("kdlaunch.token");
      });
    });

    it("should return nothing", async () => {
      const res = await request(app).get("/api/tokens/prices?platform_id=5");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return all tokens from anedak", async () => {
      const res = await request(app).get("/api/tokens/prices?platform_id=1");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(295);
    });

    it("should be an error (token_id=abc)", async () => {
      const res = await request(app).get("/api/tokens/prices?token_id=abc");
      expect(res.status).toBe(400);
      expect(res.text).not.toBe("");
      expect(res.body).toEqual({});
    });

    it("should be an error (platform_id=xxx)", async () => {
      const res = await request(app).get("/api/tokens/prices?platform_id=xxx");
      expect(res.status).toBe(400);
      expect(res.text).not.toBe("");
      expect(res.body).toEqual({});
    });

    it("should be an error (platform_id=5 & past_days=twenty)", async () => {
      const res = await request(app).get(
        "/api/tokens/prices?platform_id=5&past_days=twenty"
      );
      expect(res.status).toBe(400);
      expect(res.text).not.toBe("");
      expect(res.body).toEqual({});
    });

    it("should return prices not older than 03/05/2022", async () => {
      const now = new Date();
      const date2 = new Date("03/06/2022");
      const diffTime = Math.abs((date2 as any) - (now as any));
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const res = await request(app).get(
        `/api/tokens/prices?past_days=${days}`
      );

      expect(res.status).toBe(200);
      res.body.forEach((row: any) => {
        expect(new Date(row.timestamp) >= new Date("03/05/2022")).toBe(true);
      });
    });
  });

  describe("POST tokens/prices", () => {
    it("should reject invalid token_id", (done) => {
      request(app)
        .post("/api/tokens/prices")
        .send({
          token_id: "abc",
        })
        .expect(400)
        .end(done);
    });

    it("should reject non-existent token_id", (done) => {
      request(app)
        .post("/api/tokens/prices")
        .send({
          token_id: 17,
        })
        .expect(400)
        .end(done);
    });

    it("should reject invalid platform_id", (done) => {
      request(app)
        .post("/api/tokens/prices")
        .send({
          token_id: 3,
          platform_id: "012",
          price: 10,
        })
        .expect(400)
        .end(done);
    });

    it("should reject non-existent platform_id", (done) => {
      request(app)
        .post("/api/tokens/prices")
        .send({
          token_id: 3,
          platform_id: 5,
          price: 2,
        })
        .expect(400)
        .end(done);
    });

    it("should reject invalid price", (done) => {
      request(app)
        .post("/api/tokens/prices")
        .send({
          token_id: 3,
          platform_id: 1,
          price: "abc",
        })
        .expect(400)
        .end(done);
    });

    it("should update price", async () => {
      const res = await request(app)
        .post("/api/tokens/prices")
        .send({ token_id: 4, platform_id: 1, price: 0.551 });

      const resObj = JSON.parse(res.text);
      if (typeof resObj.id === "number") {
        insertedId = resObj.id;
      } else {
        insertedId = parseInt(resObj.id as string, 10);
      }
      expect(res.status).toBe(200);
      expect(resObj).toHaveProperty("id");
      expect(resObj).toHaveProperty("platform");
      expect(resObj).toHaveProperty("price_in_kda");
      expect(resObj).toHaveProperty("token");
      expect(resObj).toHaveProperty("timestamp");
    });

    it("should not update price again", (done) => {
      request(app)
        .post("/api/tokens/prices")
        .send({ token_id: 4, platform_id: 1, price: 0.551 })
        .expect(200)
        .end(done);
    });
  });
});
