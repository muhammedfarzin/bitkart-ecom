import { Router } from "express";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import userRouterController, { checkForLogin, checkUserLoginStatus } from "../controller/router-controller/user-router-controller.js";

const router = Router();
const MongoStore = MongoDBStore(session);

const sessionStore = new MongoStore({
    uri: process.env.MONGO_URI,
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


// Routes

router.get('/login', checkForLogin, (req, res) => {
    res.render('user/login', { errMessage: req.query.errMessage });
});

router.post('/login', checkForLogin, userRouterController.login);

router.get('/signup', checkForLogin, (req, res) => {
    res.render('user/signup', { errMessage: req.query.errMessage });
});

router.post('/signup', checkForLogin, userRouterController.signup);

// OTP Validation
router.get('/verifyEmail', userRouterController.showVerifyEmailPage);

router.post('/verifyEmail', userRouterController.verfifyEmail);

router.get('/resendOtp', userRouterController.resendOtp);

router.get('/', checkUserLoginStatus, userRouterController.showHome);

// Product overview
router.get('/view/:id', checkUserLoginStatus, userRouterController.productOverview);

router.get('/logout', userRouterController.logout);

// Search
router.get('/search', checkUserLoginStatus, userRouterController.searchProducts);

// Account
router.get('/account', checkUserLoginStatus, userRouterController.showPersonalDetailsForm);

router.get('/account/address', checkUserLoginStatus, userRouterController.showAddressList);

router.get('/account/orders', checkUserLoginStatus, userRouterController.showOrdersList);

router.post('/updateUser', checkUserLoginStatus, userRouterController.updateUser);

router.get('/account/wallet', checkUserLoginStatus, userRouterController.showWalletDatas);

router.post('/account/wallet/addMoney', checkUserLoginStatus, userRouterController.addMoneyToWallet);

router.post('/account/wallet/verifyPayment', checkUserLoginStatus, userRouterController.verifyWalletPayment)

// Mange Address
router.get('/account/address/add', checkUserLoginStatus, userRouterController.showAddAddressForm);

router.post('/account/address/add', checkUserLoginStatus, userRouterController.addAddress);

router.get('/account/address/edit/:id', checkUserLoginStatus, userRouterController.editAddressForm);

router.post('/account/address/edit/:id', checkUserLoginStatus, userRouterController.editAddress);

router.delete('/account/address/remove/:id', checkUserLoginStatus, userRouterController.deleteAddress);

// Wishlist
router.get('/wishlist', checkUserLoginStatus, userRouterController.showWishlist);
router.post('/wishlist/add', checkUserLoginStatus, userRouterController.addToWishlist);
router.delete('/wishlist/remove', checkUserLoginStatus, userRouterController.removeFromWishlist);

// Cart
router.get('/cart', checkUserLoginStatus, userRouterController.showCart);

router.post('/cart/update', checkUserLoginStatus, userRouterController.updateCart);

router.get('/checkout', checkUserLoginStatus, userRouterController.showCheckout);

router.post('/checkout/verifyPromocode', checkUserLoginStatus, userRouterController.verifyPromocode);

// Orders
router.post('/placeOrder', checkUserLoginStatus, userRouterController.placeOrder);

router.get('/orders/:id', checkUserLoginStatus, userRouterController.showOrderDetails);

router.delete('/orders/:id', checkUserLoginStatus, userRouterController.cancelOrder);

router.patch('/orders/:id/return', checkUserLoginStatus, userRouterController.returnOrder);

router.post('/orders/verifyPayment', checkUserLoginStatus, userRouterController.verifyOrderPayment);

router.post('/orders/:id/completePayment', checkUserLoginStatus, userRouterController.completePendingPayment);

router.get('/orders/:id/downloadInvoice', checkUserLoginStatus, userRouterController.getOrderInvoicePDF);

// Reviews
router.post('/orders/:id/addReview', checkUserLoginStatus, userRouterController.addReview);

router.get('/orderSuccess', checkUserLoginStatus, userRouterController.orderSuccess);


export default router;