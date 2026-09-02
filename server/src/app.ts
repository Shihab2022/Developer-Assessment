import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rootRouter } from "./routes/index";
import { corsAllowOrigin } from "./constant";
import { notFound, testingRoute } from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandllers";
const app = express();

app.use(cors(corsAllowOrigin));
app.use(express.json());
app.use(cookieParser());

app.get("/", testingRoute);
app.use("/api", rootRouter);
app.use(globalErrorHandler);

app.use(notFound);
export default app;
