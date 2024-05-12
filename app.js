import express from "express";
import dotenv from "dotenv";
import exphbs from 'express-handlebars'
import adminRouter from "./routes/admin.js";
import userRouter from "./routes/user.js";
import dbConnect from "./config/db.js";

dotenv.config();
dbConnect();

const PORT = process.env.PORT || 3000;
const app = express();

const hbs = exphbs.create({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: 'views/layouts',
    partialsDir: [
        'views/admin/partials',
        'views/user/partials'
    ],

    helpers: {
        firstImagePath: function (imagePaths) {
            return imagePaths[0];
        },
        isEqual: function (value1, value2, output) {
            if (value1 == value2) return output;
        },
        isEqualElse: function (value1, value2, output, elseOutput) {
            if (value1 == value2) return output;
            else return elseOutput;
        }
    }
});

app.engine('hbs', hbs.engine)

app.set('view engine', 'hbs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/admin', adminRouter);
app.use('/', userRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})