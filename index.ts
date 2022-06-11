import express from "express";
import v1 from "./src/api/v1";

const app: express.Express = express();
const port: number = 3000;
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
app.get("/", (_, res) => {
  res.send("BE for kadefi");
});

app.use("/api", v1);

const server = app.listen(port, () => {
  console.log("Listening on port %s . . .", port);
});

module.exports = { app, server };
