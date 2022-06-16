import { Router } from "express";
import { prisma } from "./db";

const router = Router();

router.get("/", async (req, res) => {
  const platforms = await prisma.platforms.findMany();
  res.json(platforms);
});

export default router;
