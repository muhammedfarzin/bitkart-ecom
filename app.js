import express from "express";
import adminRouter from "./routes/admin.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/admin', adminRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})