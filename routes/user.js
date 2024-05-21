import { Router } from "express";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import userController from "../controller/user-controller.js";
import { mongoUri } from "../config/db.js";
import productController from "../controller/product-controller.js";
import categoryController from "../controller/category-controller.js";
import otpController from "../controller/otp-controller.js";

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

async function checkUserLoginStatus(req, res, next) {
    if (await userController.checkUserStatus(req.session.user)) {
        next();
    } else {
        req.session.destroy();
        res.redirect('/login');
    }
}


// Routes

function checkForLogin(req, res, next) {
    if (req.session.user) {
        res.redirect('/');
    } else {
        next();
    }
}

router.get('/login', checkForLogin, (req, res) => {
    res.render('user/login', { errMessage: req.query.errMessage });
});

router.post('/login', checkForLogin, (req, res) => {
    const { email, password } = req.body;
    userController.verifyUser(email, password)
        .then(userData => {
            req.session.user = userData;
            res.redirect('/');
        })
        .catch(err => {
            res.redirect('/login?errMessage=' + err.message);
        })
});

router.get('/signup', checkForLogin, (req, res) => {
    res.render('user/signup', { errMessage: req.query.errMessage });
});

router.post('/signup', checkForLogin, async (req, res) => {
    const { mobile, email, name, password } = req.body;
    try {
        if (!name || !mobile || !email || !password) throw new Error('All Fields are required');
        const user = await userController.checkMobileAndEmail(mobile, email);
        if (user) throw new Error(user.message);
        await otpController.sendOTP(email);
        req.session.tempUserData = { name, mobile, email, password };
        req.session.cookie.maxAge = 5 * 60000;
        req.session.save();
        res.redirect('/verifyEmail');
    } catch (err) {
        res.redirect('/signup?errMessage=' + err.message);
    }
});

// OTP Validation
router.get('/verifyEmail', (req, res) => {
    if (!req.session.tempUserData) return res.redirect('/login?errMessage=Time is over, please try again');
    res.render('user/verify-email', { errMessage: req.query.errMessage });
});

router.post('/verifyEmail', async (req, res) => {
    try {
        const userData = req.session.tempUserData;
        if (!userData) throw new Error('OTP EXPIRED');
        if (await otpController.verifyOTP(userData.email, req.body.otp)) {
            const response = await userController.createUser(userData)
            req.session.user = response;
            delete req.session.tempUserData;
            res.json({ path: '/', message: 'Signup successful' });
        } else {
            throw new Error('Invalid OTP, please try again');
        }
    } catch (err) {
        if (err.message == 'OTP EXPIRED') {
            req.session.destroy();
            res.status(440).json({ errMessage: 'Your OTP has expired, Please try again' });
        }
        else res.status(400).json({ errMessage: err.message });
    }
});

router.get('/resendOtp', async (req, res) => {
    try {
        if (!req.session.tempUserData) return res.redirect('/login?errMessage=Time is over, please try again');
        req.session.cookie.maxAge = 5 * 60000;
        await otpController.sendOTP(req.session.tempUserData.email);
        res.json({ message: 'Resent OTP successfully. Kindly check your email' });
    } catch (err) {
        res.status(400).json({ errMessage: 'Something went wrong. Please try again later' });
    }
})

router.get('/', checkUserLoginStatus, async (req, res) => {
    const products = await productController.getProducts();
    const categories = await categoryController.getCategories();
    res.render('user/index', { products, categories });
});


// Product overview
router.get('/view/:id', checkUserLoginStatus, async (req, res) => {
    const product = await productController.getProductOverview(req.params.id);
    const relatedProducts = await productController.getProductsByCategory(product.categoryId);
    res.render('user/products/products', { product, relatedProducts });
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Account
router.get('/account', checkUserLoginStatus, (req, res) => {
    res.render('user/account/account');
});

router.get('/cart', checkUserLoginStatus, (req, res) => {
    res.render('user/purchase/cart');
});


export default router;