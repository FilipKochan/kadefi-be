import { Router } from "express";
import { PrismaClient, price_records } from "@prisma/client";

const router = Router();

interface TokenPricesOptions {
  tokenId?: number;
  platformId?: number;
  pastDays?: number;
}

const getPrices = async (
  options: TokenPricesOptions
): Promise<price_records[]> => {
  const prisma = new PrismaClient();
  const now = new Date();
  if (options.pastDays !== undefined) {
    now.setDate(now.getDate() - options.pastDays);
  }

  return prisma.price_records.findMany({
    orderBy: {
      timestamp: "asc",
    },
    where: {
      AND: {
        token: {
          equals: options.tokenId,
        },
        platform: {
          equals: options.platformId,
        },
        timestamp: {
          gte: options.pastDays !== undefined ? now : undefined,
        },
      },
    },
    include: {
      platforms: true,
      tokens: true,
    },
  });
};

router.get("/", async (req, res) => {
  const options: TokenPricesOptions = {};
  const { token_id, platform_id, past_days } = req.query;

  try {
    if (token_id !== undefined) {
      const tokenId = parseInt(token_id as string);
      if (isNaN(tokenId)) {
        res.status(400).send("token_id must be an integer");
        return;
      }
      options.tokenId = tokenId;
    }

    if (platform_id !== undefined) {
      const platformId = parseInt(platform_id as string);
      if (isNaN(platformId)) {
        res.status(400).send("platform_id must be an integer");
        return;
      }
      options.platformId = platformId;
    }

    if (past_days !== undefined) {
      const pastDays = parseInt(past_days as string);
      if (isNaN(pastDays)) {
        res.status(400).send("past_days must be an integer");
        return;
      }
      options.pastDays = pastDays;
    }

    const prices = await getPrices(options);
    res.json(prices);
  } catch (e) {
    res.status(500).send(e);
  }
});

export default router;
