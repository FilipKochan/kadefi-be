import { Router } from "express";
import { prisma } from "./db";
const router = Router();

router.get("/", async (req, res) => {
  const { past_days } = req.query;
  const now = new Date();
  if (past_days !== undefined) {
    if (isNaN(past_days as any) || past_days === "") {
      res.status(400).send("past_days must be a number");
      return;
    }

    now.setDate(now.getDate() - parseInt(past_days as string));
  }

  const rates = await prisma.kda_to_usd_rates.findMany({
    where: {
      timestamp: {
        gte: past_days === undefined ? undefined : now,
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });

  res.json(rates);
});

router.post("/", async (req, res) => {
  const { price } = req.body;
  if (price === undefined || isNaN(price)) {
    res.status(400).send("price is required and must be a number");
    return;
  }

  const latest = await prisma.kda_to_usd_rates.findFirst({
    orderBy: {
      timestamp: "desc",
    },
  });

  if (latest === null || latest.kda_to_usd !== price) {
    const resInsert = await prisma.kda_to_usd_rates.create({
      data: {
        kda_to_usd: price,
      },
    });

    res.json(resInsert);
    return;
  }

  res.sendStatus(200);
});

export default router;
