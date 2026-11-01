import express from "express";
import webhookRouter from "./webhook.js";

const app = express();
const port = Number(process.env.PORT || 8080);

app.use(
  express.json({
    verify: (req, _res, buffer) => {
      req.rawBody = buffer;
    },
  }),
);
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.use(webhookRouter);

app.listen(port, "0.0.0.0", () => {
  process.stdout.write(`Manfaz WhatsApp service listening on ${port}\n`);
});