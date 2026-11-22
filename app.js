import express from "express";
import dotenv from "dotenv";
import hbsConfig from "./config/handlebars-config.js";
import rootRouter from "./routes/index.js";
import dbConnect from "./config/db.js";

dotenv.config();
dbConnect();

const PORT = process.env.PORT || 3000;
const app = express();

app.engine("hbs", hbsConfig.engine);

app.set("view engine", "hbs");

app.use(rootRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
