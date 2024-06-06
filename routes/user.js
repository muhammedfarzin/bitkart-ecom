import { Router } from "express";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import userController from "../controller/user-controller.js";
import { mongoUri } from "../config/db.js";
import productController from "../controller/product-controller.js";
import categoryController from "../controller/category-controller.js";
import otpController from "../controller/otp-controller.js";
import orderController from "../controller/order-controller.js";
import { orderStatus } from "../models/order-model.js";

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
            req.session.save();
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
            req.session.save();
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
    try {
        const product = await productController.getProductOverview(req.params.id);
        const relatedProducts = await productController.getProductsByCategory(product.categoryId);
        res.render('user/products/products', { product, relatedProducts });
    } catch (err) {
        res.render('error', { errMessage: err.message });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Search
router.get('/search', checkUserLoginStatus, async (req, res) => {
    const searchResults = req.query.search && await productController.searchUserProducts(req.query);
    const context = {
        searchResults,
        searchQuery: req.query.search,
        minAmount: req.query.minAmount,
        maxAmount: req.query.maxAmount
    }
    res.render('user/search/search-view', context);
});

// Account
router.get('/account', checkUserLoginStatus, async (req, res) => {
    const user = await userController.findUserById(req.session.user.userId);
    res.render('user/account/account', { user, errMessage: req.query.errMessage });
});

router.get('/account/address', checkUserLoginStatus, async (req, res) => {
    const address = await userController.getAddresses(req.session.user.userId);
    res.render('user/account/address-manage', { address, currentPath: req.url });
});;

router.get('/account/orders', checkUserLoginStatus, async (req, res) => {
    const orders = await orderController.getUserOrders(req.session.user.userId);
    res.render('user/account/orders', { orders, currentPath: req.url });
});;

router.post('/updateUser', checkUserLoginStatus, async (req, res) => {
    try {
        const newData = await userController.updateUser(req.session.user.userId, req.body);
        req.session.user = { ...req.session.user, ...newData };
        res.redirect('/account');
    } catch (err) {
        res.redirect('/account?errMessage=' + err.message);
    }
});

// Mange Address
router.get('/account/address/add', checkUserLoginStatus, (req, res) => {
    res.render('user/account/address-form', { errMessage: req.query.errMessage });
});

router.post('/account/address/add', checkUserLoginStatus, async (req, res) => {
    try {
        await userController.addNewAddress(req);
        res.redirect(req.query.redirect ?? '/account/address');
    } catch (err) {
        const url = new URL(req.originalUrl, req.protocol + '://' + req.get('host'));
        url.searchParams.set('errMessage', err.message);
        res.status(400).redirect(url);
    }
});

router.get('/account/address/edit/:id', checkUserLoginStatus, async (req, res) => {
    const addressId = req.params.id;
    try {
        const address = await userController.getAddressById(req.session.user.userId, addressId);
        res.render('user/account/address-form', { address, errMessage: req.query.errMessage });
    } catch (err) {
        res.status(400).redirect(`/account/address/add?errMessage=${err.message}&redirect=${req.query.redirect}`);
    }
});

router.post('/account/address/edit/:id', checkUserLoginStatus, async (req, res) => {
    try {
        await userController.updateAddress(req);
        res.redirect(req.query.redirect ?? '/account');
    } catch (err) {
        res.status(400).redirect(`${req.url}?&errMessage=${err.message}`);
    }
});

// Cart
router.get('/cart', checkUserLoginStatus, async (req, res) => {
    const cart = await orderController.getCartProducts(req.session.user.userId);
    const priceDetails = await orderController.getPriceSummary(req.session.user.userId, cart);
    res.render('user/purchase/cart', { cart, priceDetails });
});

router.post('/cart/update', checkUserLoginStatus, async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        const datas = await orderController.updateCart(req.session.user.userId, productId, quantity);
        const cartCount = datas.cart.reduce((count, data) => {
            return count + data.quantity;
        }, 0);
        const priceDetails = await orderController.getPriceSummary(req.session.user.userId);
        res.json({ message: 'Added to cart', cartCount, updatedQuantity: quantity, priceDetails });
    } catch (err) {
        res.status(400).json({ errMessage: err.message });
    }
});

router.get('/checkout', checkUserLoginStatus, async (req, res) => {
    const userId = req.session.user.userId;
    const addresses = await userController.getAddresses(userId);
    const priceDetails = await orderController.getPriceSummary(userId);
    if (!priceDetails.totalPrice) res.redirect('/');
    else res.render('user/purchase/checkout', { priceDetails, addresses, currentPath: req.url });
});

// Orders
router.post('/placeOrder', checkUserLoginStatus, async (req, res) => {
    try {
        const paymentMethod = req.body.paymentMethod;
        if (paymentMethod == 'cod' || paymentMethod == 'online') {
            const response = await orderController.placeOrder(req);
            if (!response) await orderController.clearCart(req.session.user.userId);
            req.session.orderDone = true;
            res.json(response ?? { message: 'Order placed successfully', orderPlaced: true, redirect: '/orderSuccess' });
        } else {
            throw new Error('Please enter payment method');
        }
    } catch (err) {
        res.status(400).json({ errMessage: err?.message });
    }
});

router.get('/orders/:id', checkUserLoginStatus, async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const orderId = req.params.id;
        const orderDetails = await orderController.getUserOrderDetails(userId, orderId);
        res.render('user/account/order-details', { orderDetails, currentPath: req.url });
    } catch (err) {
        res.render('error', { errMessage: err.message });
    }
});

router.delete('/orders/:id', checkUserLoginStatus, async (req, res) => {
    try {
        await orderController.updateStatus(req.params.id, orderStatus.cancelled);
        res.json({ message: 'Order cancelled' });
    } catch (err) {
        res.status(400).json({ errMessage: err.message });
    }
});

router.patch('/orders/:id/return', checkUserLoginStatus, async (req, res) => {
    const userId = req.session.user.userId;
    try {
        await orderController.returnOrder(userId, req.params.id, req.body);
        res.json({ message: 'Your return request status has been updated' });
    } catch (err) {
        res.status(400).json({ errMessage: err.message });
    }
});

router.post('/orders/verifyPayment', checkUserLoginStatus, (req, res) => {
    orderController.verifyPayment(req.body)
        .then(response => res.json(response))
        .catch(err => res.status(400).json({ errMessage: err.message }));
});

// Reviews
router.post('/orders/:id/addReview', checkUserLoginStatus, async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const orderId = req.params.id;
        const response = await orderController.addReview(userId, orderId, req.body);
        res.json(response);
    } catch (err) {
        res.status(400).json({ errMessage: err.message });
    }
});

router.get('/orderSuccess', checkUserLoginStatus, (req, res) => {
    if (req.session.orderDone) {
        delete req.session.orderDone;
        res.render('user/purchase/order-success');
    } else {
        res.redirect('/');
    }
});


export default router;