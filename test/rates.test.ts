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
  await new Promise<void>((resolve) => server.close(() => resolve()));
  const prisma = new PrismaClient();
  await prisma.kda_to_usd_rates.delete({
    where: { id: insertedId },
  });
  await prisma.$disconnect();
});

describe("kda/usd rates", () => {
  describe("GET /kda-usd-rates", () => {
    it("should get rates after 06/10/2022 ", async () => {
      const now = new Date();
      const date2 = new Date("06/11/2022");
      const diffTime = Math.abs((date2 as any) - (now as any));
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const res = await request(app).get(
        `/api/kda-usd-rates?past_days=${days}`
      );

      expect(res.status).toBe(200);
      expect(res.body.length).not.toBe(0);
      res.body.forEach((row: any) => {
        expect(new Date(row.timestamp) >= new Date("06/10/2022")).toBe(true);
      });
    });

    it("should get all rates", async () => {
      const res = await request(app).get("/api/kda-usd-rates");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(28588);
    });

    it("should reject invalid date", (done) => {
      request(app)
        .get("/api/kda-usd-rates?past_days=0xag2")
        .expect(400)
        .end(done);
    });
  });

  describe("POST /kda-usd-rates", () => {
    it("should reject request without price", (done) => {
      request(app).post("/api/kda-usd-rates").expect(400).end(done);
    });

    it("should reject invalid price", (done) => {
      request(app)
        .post("/api/kda-usd-rates")
        .send({ price: "123abc" })
        .expect(400)
        .end(done);
    });

    it("should update the price", () => {
      return request(app)
        .post("/api/kda-usd-rates")
        .send({ price: 0.5 })
        .expect(200)
        .then((res: any) => {
          expect(res.body).toHaveProperty("kda_to_usd");
          expect(res.body["kda_to_usd"]).toBe(0.5);
          expect(res.body).toHaveProperty("id");
          insertedId = parseInt(res.body.id);
          expect(res.body).toHaveProperty("timestamp");
          expect(
            (new Date(res.body["timestamp"]) as any) > new Date().setMinutes(-1)
          ).toBe(true);
        });
    });

    it("should not update same price again", () => {
      return request(app)
        .post("/api/kda-usd-rates")
        .send({ price: 0.5 })
        .expect(200)
        .then((res: any) => {
          expect(res.body).not.toHaveProperty("id");
          expect(res.body).not.toHaveProperty("kda_to_usd");
          expect(res.body).not.toHaveProperty("timestamp");
        });
    });
  });
});
