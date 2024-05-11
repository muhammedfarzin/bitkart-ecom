import { Router } from "express";
import session from "express-session";
import path from "path";
import MongoDBStore from "connect-mongodb-session";
import multer from "multer";
import { mongoUri } from "../config/db.js";
import userController from "../controller/user-controller.js";
import categoryController from "../controller/category-controller.js";
import productController from "../controller/product-controller.js";

const router = Router();
const MongoStore = MongoDBStore(session);

const multerStorage = multer.diskStorage({
    destination: './public/images/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: multerStorage });

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
};

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
});

router.get(sideMenuPath.orders, (req, res) => {
    const sideMenus = getSideMenus(sideMenuPath.orders);
    res.render('admin/orders/orders', { sideMenus });
});

// Products routes
router.get(sideMenuPath.products, async (req, res) => {
    const products = await productController.getProducts();
    const sideMenus = getSideMenus(sideMenuPath.products);
    res.render('admin/products/products', ({ products, sideMenus }));
});

router.get(`${sideMenuPath.products}/add`, async (req, res) => {
    const categories = await categoryController.getAllCategoryTitles();
    const sideMenus = getSideMenus();
    res.render('admin/products/add-products', ({ categories, sideMenus }));
});

router.post(`${sideMenuPath.products}/add`, upload.array('images', 5), async (req, res) => {
    try {
        await productController.addProduct(req);
        res.redirect(dashboardRoute + sideMenuPath.products);
    } catch (err) {
        const categories = await categoryController.getAllCategoryTitles();
        const sideMenus = getSideMenus();
        res.render('admin/products/add-products', ({ categories, sideMenus, errMessage: err.message }));
    }
});

// Category routes
router.get(sideMenuPath.categories, async (req, res) => {
    let categories = await categoryController.getCategories();
    categories = categories.map(category => category.toObject());
    const sideMenus = getSideMenus(sideMenuPath.categories);
    res.render('admin/categories/categories', ({ categories, sideMenus }));
});

router.get(`${sideMenuPath.categories}/create`, (req, res) => {
    const sideMenus = getSideMenus();
    res.render('admin/categories/category-form', ({ sideMenus }));
});

router.post(`${sideMenuPath.categories}/create`, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('Please upload category image');
        }
        await categoryController.createCategory(req);
        res.redirect(dashboardRoute + sideMenuPath.categories);
    } catch (err) {
        const sideMenus = getSideMenus();
        return res.render('admin/categories/category-form', ({ sideMenus, errMessage: err.message }));
    }
});

router.get(`${sideMenuPath.categories}/edit/:id`, async (req, res) => {
    try {
        const category = await categoryController.getCategoryById(req.params.id);
        const products = await productController.getProductsByCategory(req.params.id);
        const sideMenus = getSideMenus();
        res.render('admin/categories/category-form', ({ category, products, sideMenus, viewProducts: true, errMessage: req.query.errMessage }));
    } catch (err) {
        res.render('admin/404', { errMessage: err.message });
    }
});

router.post(`${sideMenuPath.categories}/edit/:id`, upload.single('image'), async (req, res) => {
    try {
        await categoryController.updateCategory(req.params.id, req);
        res.redirect(dashboardRoute + sideMenuPath.categories);
    } catch (err) {
        res.redirect(`${dashboardRoute}${req.path}?errMessage=${err.message}`);
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect(loginRoute);
});


export default router;