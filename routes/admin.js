import { Router } from "express";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import { mongoUri } from "../config/db.js";
import userController from "../controller/user-controller.js";

const router = Router();
const MongoStore = MongoDBStore(session);

const sessionStore = new MongoStore({
    uri: mongoUri,
    collection: 'sessions',
});

sessionStore.on('error', (error) => {
    console.error('Session store error:', error);
});

router.use(session({
    key: 'ADMIN_SESSION',
    secret: 'admin_user_secret',
    saveUninitialized: false,
    resave: false,
    store: sessionStore,
    cookie: {
        maxAge: 3600000  // 1 Hour
    }
}));

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
        return {
            title,
            path: dashboardRoute + sideMenuPath[title],
            active: sideMenuPath[title] == pathName
        };
    })
}

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

router.get(sideMenuPath.dashboard, (req, res) => {
    const sideMenus = getSideMenus(sideMenuPath.dashboard);
    res.render('admin/index', { sideMenus });
});

router.get(sideMenuPath.users, async (req, res) => {
    const sideMenus = getSideMenus(sideMenuPath.users);
    let users = await userController.getUsersBasicData();
    users = users.map(user => user.toObject());
    res.render('admin/users/users', { users: users, sideMenus });
})

router.get(sideMenuPath.orders, (req, res) => {
    const sideMenus = getSideMenus(sideMenuPath.orders);
    res.render('admin/orders/orders', { sideMenus });
})

router.get(sideMenuPath.products, (req, res) => {
    const sideMenus = getSideMenus(sideMenuPath.products);
    res.render('admin/products/products', ({ sideMenus }));
})

router.get('/products/add', (req, res) => {
    const sideMenus = getSideMenus();
    res.render('admin/products/add-products', ({ sideMenus }));
})

router.get(sideMenuPath.categories, (req, res) => {
    const sideMenus = getSideMenus(sideMenuPath.categories);
    res.render('admin/categories/categories', ({ sideMenus }));
})

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect(loginRoute);
});


export default router;