import express from "express";
import dotenv from "dotenv";
import hbs from 'express-handlebars'
import adminRouter from "./routes/admin.js";
import userRouter from "./routes/user.js";
import dbConnect from "./config/db.js";

dotenv.config();
dbConnect();

const PORT = process.env.PORT || 3000;
const app = express();

app.engine('hbs', hbs.engine({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: 'views/layouts',
    partialsDir: [
        'views/admin/partials',
        'views/user/partials'
    ]
}))

app.set('view engine', 'hbs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/admin', adminRouter);
app.use('/', userRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})