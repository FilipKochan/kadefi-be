import { Router } from "express";
import { price_records } from "@prisma/client";
import { prisma } from "./db";

const router = Router();

interface TokenPricesOptions {
  tokenId?: number;
  platformId?: number;
  pastDays?: number;
}

interface PostTokenPriceBody {
  tokenId: number;
  platformId: number;
  price: number;
}

const getPrices = async (
  options: TokenPricesOptions
): Promise<price_records[]> => {
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

router.post("/", async (req, res) => {
  const { token_id, platform_id, price } = req.body;
  if (token_id === undefined) {
    res.status(400).send("token_id missing");
    return;
  }
  if (platform_id === undefined) {
    res.status(400).send("platform_id missing");
    return;
  }
  if (price === undefined) {
    res.status(400).send("price missing");
    return;
  }

  if (typeof token_id !== "number") {
    res.status(400).send("token_id must be a number");
    return;
  }

  if (typeof platform_id !== "number") {
    res.status(400).send("platform_id must be a number");
    return;
  }

  if (typeof price !== "number") {
    res.status(400).send("price must be a number");
    return;
  }

  const exists_token =
    (await prisma.tokens.count({
      where: { id: { equals: token_id } },
    })) === 1;

  if (!exists_token) {
    res.status(400).send("token does not exist");
    return;
  }

  const exists_platform =
    (await prisma.platforms.count({
      where: { id: { equals: platform_id } },
    })) > 0;

  if (!exists_platform) {
    res.status(400).send("platform does not exist");
    return;
  }

  const latest = await prisma.price_records.findFirst({
    where: {
      AND: {
        tokens: {
          id: {
            equals: token_id,
          },
        },
        platforms: {
          id: {
            equals: platform_id,
          },
        },
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  if (
    latest === null ||
    latest.price_in_kda.toFixed(15) !== price.toFixed(15)
  ) {
    // prices are different or previous dont exist, should update

    const resInsert = await prisma.price_records.create({
      data: {
        token: token_id,
        price_in_kda: price,
        platform: platform_id,
      },
    });

    res.status(200).json(resInsert);
    return;
  }
  // else - dont update
  res.sendStatus(200);
});

export default router;
