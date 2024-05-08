import { Router } from "express";
import session from "express-session";
import userController from "../controller/user-controller.js";

const router = Router();

router.use(session({
    key: 'USER_SESSION',
    secret: 'user_secret',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 3600000 * 24 * 30  // 30 days
    }
}));

router.use((req, res, next) => {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    next();
  });
  

// Routes

function checkForLogin(req, res, next) {
    if (req.session.user) {
        res.redirect('/');
    } else {
        next();
    }
}

router.get('/login', checkForLogin, (req, res) => {
    res.render('user/login');
})

router.post('/login', checkForLogin, (req, res) => {
    const { email, password } = req.body;
    userController.getUser(email, password)
        .then(userData => {
            req.session.user = userData;
            res.redirect('/');
        })
        .catch(err => {
            res.render('user/login', { errMessage: err.message });
        })
})

router.get('/signup', checkForLogin, (req, res) => {
    res.render('user/signup');
})

router.post('/signup', checkForLogin, (req, res) => {
    userController.createUser(req.body)
        .then(data => {
            req.session.user = data;
            res.redirect('/');
        })
        .catch(err => {
            res.render('user/signup', { errMessage: err.message });
        })
})

// Check Login
router.use((req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login')
    }
})

// Routes needs authorization

router.get('/', (req, res) => {
    res.render('user/index');
})

router.get('/view/:id', (req, res) => {
    res.render('user/products/products');
})

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    res.redirect('/login');
})


export default router;