import { Router } from "express";
import tokens from "./tokens";
import platforms from "./platforms";
import middleware from "./middleware";
import rates from "./rates";

const router = Router();

router.get("/", (_, res) => {
  res.send("APIv1 for kadefi.app");
});

router.use(middleware);

router.use("/tokens", tokens);

router.use("/platforms", platforms);

router.use("/kda-usd-rates", rates);

export default router;
