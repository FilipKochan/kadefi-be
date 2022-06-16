import { Router } from "express";
import prices from "./prices";
import { prisma } from "./db";

const router = Router();

router.get("/", async (req, res) => {
  const tokens = await prisma.tokens.findMany();
  res.json(tokens);
});

router.use("/prices", prices);

export default router;
