import { Router } from "express";
import { platforms, PrismaClient } from "@prisma/client";

const router = Router();

router.get("/", async (req, res) => {
  const prisma = new PrismaClient();
  const platforms = await prisma.platforms.findMany();
  res.json(platforms);
});

export default router;
