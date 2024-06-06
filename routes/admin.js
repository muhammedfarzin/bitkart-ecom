import { Router } from "express";
import session from "express-session";
import path from "path";
import MongoDBStore from "connect-mongodb-session";
import multer from "multer";
import { mongoUri } from "../config/db.js";
import userController from "../controller/user-controller.js";
import categoryController from "../controller/category-controller.js";
import productController from "../controller/product-controller.js";
import orderController from "../controller/order-controller.js";

const router = Router();
const MongoStore = MongoDBStore(session);

const multerStorage = multer.diskStorage({
    destination: './public/images/uploads/',
    filename: (req, file, cb) => {
        const randomNumber = Math.floor(Math.random() * 90000) + 10000;
        cb(null, file.fieldname + Date.now() + randomNumber + path.extname(file.originalname));
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

function checkLogin(session) {
    if (session.admin && session.admin == process.env.ADMIN_EMAIL) {
        return true;
    } else {
        return false;
    }
};

function checkLoginStatus(req, res, next) {
    if (checkLogin(req.session)) {
        next();
    } else {
        req.session.destroy();
        res.redirect(loginRoute);
    }
}

// Routes
router.get('/login', (req, res) => {
    if (checkLogin(req.session)) {
        res.redirect(dashboardRoute);
    }
    res.render('admin/login', { title: "Admin Login" });
});

router.post('/login', (req, res) => {
    if (checkLogin(req.session)) {
        return res.redirect(dashboardRoute);
    }
    const { email, password } = req.body;
    if (email == process.env.ADMIN_EMAIL && password == process.env.ADMIN_PASSWORD) {
        req.session.admin = email
        req.session.save();
        res.redirect(dashboardRoute);
    } else {
        res.status(401).render('admin/login', { errMessage: 'Invalid username or password' });
    }
});

// Routes needs authorization

router.get(sideMenuPath.dashboard, checkLoginStatus, (req, res) => {
    const sideMenus = getSideMenus(sideMenuPath.dashboard);
    res.render('admin/index', { sideMenus });
});

router.get(sideMenuPath.users, checkLoginStatus, async (req, res) => {
    let users, searchQuery = req.query.search;
    if (searchQuery) {
        users = await userController.findUsersByQuery(searchQuery);
    } else {
        users = await userController.getUsersBasicData();
    }
    const sideMenus = getSideMenus(sideMenuPath.users);
    res.render('admin/users/users', { users, sideMenus, searchQuery });
});

router.patch(`${sideMenuPath.users}/toggleStatus`, checkLoginStatus, async (req, res) => {
    try {
        const response = await userController.toggleUserStatus(req.body.userId);
        res.json(response);
    } catch (err) {
        res.status(400).json({ errMessage: err.message });
    }
});

// Orders routes
router.get(sideMenuPath.orders, checkLoginStatus, async (req, res) => {
    const orders = await orderController.getOrders();
    const sideMenus = getSideMenus(sideMenuPath.orders);
    res.render('admin/orders/orders', { orders, sideMenus });
});

router.get(`${sideMenuPath.orders}/:id`, checkLoginStatus, async (req, res) => {
    try {
        const order = await orderController.getOrderById(req.params.id);
        const sideMenus = getSideMenus(sideMenuPath.orders);
        res.render('admin/orders/view-order', { order, sideMenus, currentPath: req.urls });
    } catch (err) {
        res.render('admin/error', { errMessage: err.message });
    }
});

router.post(`${sideMenuPath.orders}/:id/updateStatus`, checkLoginStatus, async (req, res) => {
    try {
        const orderId = req.params.id;
        const response = await orderController.updateStatus(orderId, req.body.status);
        res.json(response);
    } catch (err) {
        res.status(400).json({ errMessage: err.message });
    }
});

// Products routes
router.get(sideMenuPath.products, checkLoginStatus, async (req, res) => {
    let products;
    if (req.query.search) {
        products = await productController.searchProducts(req.query.search);
    } else {
        products = await productController.getProducts();
    }
    const sideMenus = getSideMenus(sideMenuPath.products);
    res.render('admin/products/products', ({ products, sideMenus, searchQuery: req.query.search }));
});

router.get(`${sideMenuPath.products}/add`, checkLoginStatus, async (req, res) => {
    const categories = await categoryController.getAllCategoryTitles();
    const sideMenus = getSideMenus();
    res.render('admin/products/products-form', ({ categories, sideMenus, errMessage: req.query.errMessage }));
});

router.post(`${sideMenuPath.products}/add`, checkLoginStatus, upload.array('images', 5), async (req, res) => {
    try {
        await productController.addProduct(req);
        res.redirect(dashboardRoute + sideMenuPath.products);
    } catch (err) {
        res.redirect(`${dashboardRoute}${req.path}?errMessage=${err.message}`);
    }
});

router.get(`${sideMenuPath.products}/edit/:id`, checkLoginStatus, async (req, res) => {
    try {
        const product = await productController.getProductById(req.params.id);
        const categories = await categoryController.getAllCategoryTitles();
        const sideMenus = getSideMenus();
        res.render('admin/products/products-form', { product, categories, sideMenus, errMessage: req.query.errMessage });
    } catch (err) {
        res.render('admin/error', { errMessage: err.message })
    }
})

router.post(`${sideMenuPath.products}/edit/:id`, checkLoginStatus, upload.array('images', 5), async (req, res) => {
    try {
        await productController.updateProduct(req.params.id, req);
        res.redirect(dashboardRoute + sideMenuPath.products);
    } catch (err) {
        res.redirect(`${dashboardRoute + req.path}?errMessage=${err.message}`);
    }
})

// Category routes
router.get(sideMenuPath.categories, checkLoginStatus, async (req, res) => {
    let categories;
    if (req.query.search) {
        categories = await categoryController.searchCategories(req.query.search);
    } else {
        categories = await categoryController.getCategories();
    }
    const sideMenus = getSideMenus(sideMenuPath.categories);
    res.render('admin/categories/categories', ({ categories, sideMenus, searchQuery: req.query.search }));
});

router.get(`${sideMenuPath.categories}/create`, checkLoginStatus, (req, res) => {
    const sideMenus = getSideMenus();
    res.render('admin/categories/category-form', ({ sideMenus }));
});

router.post(`${sideMenuPath.categories}/create`, checkLoginStatus, upload.single('image'), async (req, res) => {
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

router.get(`${sideMenuPath.categories}/edit/:id`, checkLoginStatus, async (req, res) => {
    try {
        const category = await categoryController.getCategoryById(req.params.id);
        const products = await productController.getProductsByCategory(req.params.id);
        const sideMenus = getSideMenus();
        res.render('admin/categories/category-form', ({ category, products, sideMenus, errMessage: req.query.errMessage }));
    } catch (err) {
        res.render('admin/error', { errMessage: err.message });
    }
});

router.post(`${sideMenuPath.categories}/edit/:id`, checkLoginStatus, upload.single('image'), async (req, res) => {
    try {
        await categoryController.updateCategory(req.params.id, req);
        res.redirect(dashboardRoute + sideMenuPath.categories);
    } catch (err) {
        console.log(err)
        res.redirect(`${dashboardRoute}${req.path}?errMessage=${err.message}`);
    }
});

router.delete(`${sideMenuPath.categories}/delete`, checkLoginStatus, async (req, res) => {
    try {
        const response = await categoryController.deleteCategory(req.body.categoryId);
        res.json(response);
    } catch (err) {
        res.status(400).json({ errMessage: 'Invalid category' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect(loginRoute);
});

router.all('*', (req, res) => {
    return res.render('admin/404');
})


export default router;