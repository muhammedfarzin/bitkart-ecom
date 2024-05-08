import { Router } from "express";
import session from "express-session";

const router = Router();

router.use(session({
    key: 'USER_SESSION',
    secret: 'user_secret',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 3600000  // 1 Hour
    }
}));

router.get('/login', (req, res) => {
    res.render('user/login');
})

router.post('/login', (req, res) => {
    req.session.user = req.body;
    res.redirect('/');
})

router.get('/signup', (req, res) => {
    res.render('user/signup');
})

router.get('/', (req, res) => {
    res.render('user/index');
})

router.get('/view/:id', (req, res) => {
    res.render('user/products/products');
})


export default router;