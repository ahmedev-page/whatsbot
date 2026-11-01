import { Router, type IRouter } from "express";
import healthRouter from "./health";
import publicRouter from "./public";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);
router.use(adminRouter);

export default router;
