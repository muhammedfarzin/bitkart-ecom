import express from "express";
import dotenv from "dotenv";
import hbsConfig from "./config/handlebars-config.js";
import adminRouter from "./routes/admin.js";
import userRouter from "./routes/user.js";
import dbConnect from "./config/db.js";

dotenv.config();
dbConnect();

const PORT = process.env.PORT || 3000;
const app = express();

app.engine('hbs', hbsConfig.engine)

app.set('view engine', 'hbs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/admin', adminRouter);
app.use('/', userRouter);

// 404 page
app.all('*', (req, res) => {
    res.render('404');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})