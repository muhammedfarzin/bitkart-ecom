import { Router } from "express";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import userController from "../controller/user-controller.js";
import { mongoUri } from "../config/db.js";
import productController from "../controller/product-controller.js";
import categoryController from "../controller/category-controller.js";

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
    key: 'USER_SESSION',
    secret: 'user_secret',
    saveUninitialized: false,
    resave: false,
    store: sessionStore,
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

router.get('/', async (req, res) => {
    const products = await productController.getProducts();
    const categories = await categoryController.getCategories();
    res.render('user/index', { products, categories });
})


// Product overview
router.get('/view/:id', async (req, res) => {
    const product = await productController.getProductOverview(req.params.id);
    console.log(product);
    const relatedProducts = await productController.getProductsByCategory(product.categoryId);
    res.render('user/products/products', { product, relatedProducts });
})

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    res.redirect('/login');
})


export default router;