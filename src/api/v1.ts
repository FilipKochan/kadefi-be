import { Router } from "express";
import tokens from "./tokens";
import platforms from "./platforms";
import middleware from "./middleware";

const router = Router();

router.get("/", (_, res) => {
  res.send("APIv1 for kadefi.app");
});

router.use(middleware);

router.use("/tokens", tokens);

router.use("/platforms", platforms);

export default router;
