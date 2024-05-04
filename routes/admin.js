import { Router } from "express";
import session from "express-session";

const router = Router();

const dashboardRoute = '/admin';
const loginRoute = '/admin/login';

router.use(session({
    secret: 'admin_user_secret',
    saveUninitialized: false,
    resave: false
}))

function checkLogin(session, isLogin) {
    if (session.admin && session.admin == process.env.ADMIN_EMAIL) {
        return true;
    } else {
        return false;
    }
}

// Routes
router.get('/login', (req, res) => {
    if (checkLogin(req.session)) {
        res.redirect(dashboardRoute);
    }
    res.render('admin/login', { title: "Admin Login" });
})

router.post('/login', (req, res) => {
    if (checkLogin(req.session)) {
        res.redirect(dashboardRoute);
    }
    const { email, password } = req.body;
    if (email == process.env.ADMIN_EMAIL && password == process.env.ADMIN_PASSWORD) {
        req.session.admin = email
        res.redirect(dashboardRoute);
    } else {
        res.status(401).render('admin/login', { errMessage: 'Invalid username or password' });
    }
})

router.use((req, res, next) => {
    if (checkLogin(req.session)) {
        next();
    } else {
        req.session.destroy();
        res.redirect(loginRoute);
    }
})

router.get('/', (req, res) => {
    res.render('admin/index');
})

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect(loginRoute);
})


export default router;