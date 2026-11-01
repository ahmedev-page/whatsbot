import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import type { Request } from "express";
import router from "./routes";
import whatsappRouter from "./routes/whatsapp";
import { logger } from "./lib/logger";

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins = (process.env.FRONTEND_URL ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .map((origin) => origin.replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed"));
    },
  }),
);
app.use(
  express.json({
    verify: (req, _res, buffer) => {
      (req as Request & { rawBody?: Buffer }).rawBody = buffer;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use(whatsappRouter);
app.use("/api", router);

export default app;
