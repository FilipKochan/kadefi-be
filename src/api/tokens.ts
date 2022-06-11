import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import prices from "./prices";

const router = Router();

router.get("/", async (req, res) => {
  const prisma = new PrismaClient();
  const tokens = await prisma.tokens.findMany();
  res.json(tokens);
});

router.use("/prices", prices);

export default router;
