import express from "express";
import adminRouter from "./routes/admin.js";
import dotenv from "dotenv";
import hbs from 'express-handlebars'

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.engine('hbs', hbs.engine({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: 'views/layouts',
    partialsDir: ['views/admin/partials']
}))

app.set('view engine', 'hbs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/admin', adminRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})