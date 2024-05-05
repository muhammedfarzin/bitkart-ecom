import { Router } from "express";
import session from "express-session";

const router = Router();

const dashboardRoute = '/admin';
const loginRoute = '/admin/login';

const sideMenuPath = {
    dashboard: '/',
    users: '/users',
    orders: '/orders',
    products: '/products',
    categories: '/categories',
    coupons: '/coupons',
    banner: '/banner'
};

function getSideMenus(pathName) {
    return Object.keys(sideMenuPath).map(title => {
        return { title, path: sideMenuPath[title], active: title == pathName };
    })
}

router.use(session({
    secret: 'admin_user_secret',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 3600000  // 1 Hour
    }
}));

function checkLogin(session, isLogin) {
    if (session.admin && session.admin == process.env.ADMIN_EMAIL) {
        return true;
    } else {
        return false;
    }
};

// Routes
router.get('/login', (req, res) => {
    if (checkLogin(req.session)) {
        res.redirect(dashboardRoute);
    }
    res.render('admin/login', { title: "Admin Login" });
});

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
});

// Check login
router.use((req, res, next) => {
    if (checkLogin(req.session)) {
        next();
    } else {
        req.session.destroy();
        res.redirect(loginRoute);
    }
});

// Routes needs authorization

router.get('/', (req, res) => {
    const sideMenus = getSideMenus('dashboard');
    res.render('admin/index', { sideMenus });
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect(loginRoute);
});


export default router;