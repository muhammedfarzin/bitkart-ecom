import userController from "../user-controller.js";
import productController from "../product-controller.js";
import categoryController from "../category-controller.js";
import otpController from "../otp-controller.js";
import orderController from "../order-controller.js";
import { orderStatus } from "../../models/order-model.js";

const userRouterController = {
    // Authentications
    login: (req, res) => {
        const { email, password } = req.body;
        userController.verifyUser(email, password)
            .then(userData => {
                req.session.user = userData;
                req.session.save();
                res.redirect('/');
            })
            .catch(err => {
                res.redirect('/login?errMessage=' + err.message);
            });
    },
    signup: async (req, res) => {
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
    },
    showVerifyEmailPage: (req, res) => {
        if (!req.session.tempUserData) return res.redirect('/login?errMessage=Time is over, please try again');
        res.render('user/verify-email', { errMessage: req.query.errMessage });
    },
    verfifyEmail: async (req, res) => {
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
    },
    resendOtp: async (req, res) => {
        try {
            if (!req.session.tempUserData) return res.redirect('/login?errMessage=Time is over, please try again');
            req.session.cookie.maxAge = 5 * 60000;
            await otpController.sendOTP(req.session.tempUserData.email);
            res.json({ message: 'Resent OTP successfully. Kindly check your email' });
        } catch (err) {
            res.status(400).json({ errMessage: 'Something went wrong. Please try again later' });
        }
    },
    logout: (req, res) => {
        req.session.destroy();
        res.redirect('/login');
    },

    // Products
    showHome: async (req, res) => {
        const products = await productController.getProducts();
        const categories = await categoryController.getCategories();
        res.render('user/index', { products, categories });
    },
    productOverview: async (req, res) => {
        try {
            const product = await productController.getProductOverview(req.params.id);
            const relatedProducts = await productController.getProductsByCategory(product.categoryId);
            if (req.session.user.wishlist.includes(product._id)) product.isWishlisted = true;
            res.render('user/products/products', { product, relatedProducts });
        } catch (err) {
            res.render('error', { errMessage: err.message });
        }
    },
    searchProducts: async (req, res) => {
        const searchResults = req.query.search && await productController.searchUserProducts(req.query);
        const categories = await categoryController.getAllCategoryTitles();
        const context = req.query.search && {
            searchResults,
            categories,
            userWishlist: req.session.user.wishlist,
            searchQuery: req.query.search,
            minAmount: req.query.minAmount,
            maxAmount: req.query.maxAmount,
            sort: req.query.sort,
        }
        res.render('user/search/search-view', context);
    },

    // Accounts
    showPersonalDetailsForm: async (req, res) => {
        const user = await userController.findUserById(req.session.user.userId);
        res.render('user/account/account', { user, errMessage: req.query.errMessage });
    },
    showAddressList: async (req, res) => {
        const address = await userController.getAddresses(req.session.user.userId);
        res.render('user/account/address-manage', { address, currentPath: req.url });
    },
    updateUser: async (req, res) => {
        try {
            const newData = await userController.updateUser(req.session.user.userId, req.body);
            req.session.user = { ...req.session.user, ...newData };
            res.redirect('/account');
        } catch (err) {
            res.redirect('/account?errMessage=' + err.message);
        }
    },
    updateCart: async (req, res) => {
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
    },
    showWalletDatas: async (req, res) => {
        const wallet = await userController.getWalletDatas(req.session.user.userId);
        res.render('user/account/wallet', { wallet });
    },

    addMoneyToWallet: async (req, res) => {
        try {
            const { amount } = req.body;
            const response = await orderController.generateRazorpay(amount);
            res.json(response);
        } catch (err) {
            res.status(400).json({ errMessage: err.message });
        }
    },

    verifyWalletPayment: (req, res) => {
        const userId = req.session.user.userId;
        userController.addMoneyToWallet(userId, req.body)
            .then(response => res.json(response))
            .catch(err => res.status(400).json({ errMessage: err.message }));
    },

    // Wishlist
    showWishlist: async (req, res) => {
        const products = await productController.getProductByIds(req.session.user.wishlist);
        res.render('user/products/wishlist', { products });
    },
    addToWishlist: (req, res) => {
        const { productId } = req.body;
        const { userId } = req.session.user;
        userController.addToWishlist(userId, productId)
            .then(response => res.json(response))
            .catch(err => res.status(400).json({ errMessage: err.message }));
    },
    removeFromWishlist: (req, res) => {
        const { productId } = req.body;
        const { userId } = req.session.user;
        userController.removeFromWishlist(userId, productId)
            .then(response => res.json(response))
            .catch(err => res.status(400).json({ errMessage: err.message }));
    },

    // Address
    showAddAddressForm: (req, res) => {
        res.render('user/account/address-form', { errMessage: req.query.errMessage });
    },
    addAddress: async (req, res) => {
        try {
            await userController.addNewAddress(req);
            res.redirect(req.query.redirect ?? '/account/address');
        } catch (err) {
            const url = new URL(req.originalUrl, req.protocol + '://' + req.get('host'));
            url.searchParams.set('errMessage', err.message);
            res.status(400).redirect(url);
        }
    },
    editAddressForm: async (req, res) => {
        const addressId = req.params.id;
        try {
            const address = await userController.getAddressById(req.session.user.userId, addressId);
            res.render('user/account/address-form', { address, errMessage: req.query.errMessage });
        } catch (err) {
            res.status(400).redirect(`/account/address/add?errMessage=${err.message}&redirect=${req.query.redirect}`);
        }
    },
    editAddress: async (req, res) => {
        try {
            await userController.updateAddress(req);
            res.redirect(req.query.redirect ?? '/account');
        } catch (err) {
            res.status(400).redirect(`${req.url}?&errMessage=${err.message}`);
        }
    },
    deleteAddress: async (req, res) => {
        try {
            const response = await userController.removeAddress(req.session.user.userId, req.params.id);
            res.json(response);
        } catch (err) {
            res.status(400).json({ errMessage: err.message });
        }
    },

    // Orders
    showOrdersList: async (req, res) => {
        const orders = await orderController.getUserOrders(req.session.user.userId);
        res.render('user/account/orders', { orders, currentPath: req.url });
    },
    showCart: async (req, res) => {
        const cart = await orderController.getCartProducts(req.session.user.userId);
        const priceDetails = await orderController.getPriceSummary(req.session.user.userId, cart);
        res.render('user/purchase/cart', { cart, priceDetails });
    },
    showCheckout: async (req, res) => {
        const userId = req.session.user.userId;
        const addresses = await userController.getAddresses(userId);
        const priceDetails = await orderController.getPriceSummary(userId);
        if (!priceDetails.totalPrice) return res.redirect('/');

        const context = {
            priceDetails,
            addresses,
            currentPath: req.url,
            walletBalance: req.session.user.walletBalance
        };
        res.render('user/purchase/checkout', context);
    },
    placeOrder: async (req, res) => {
        try {
            const paymentMethod = req.body.paymentMethod;
            if (/^(cod|online|wallet)$/.test(paymentMethod)) {
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
    },
    showOrderDetails: async (req, res) => {
        try {
            const userId = req.session.user.userId;
            const orderId = req.params.id;
            const orderDetails = await orderController.getUserOrderDetails(userId, orderId);
            res.render('user/account/order-details', { orderDetails, currentPath: req.url });
        } catch (err) {
            res.render('error', { errMessage: err.message });
        }
    },
    cancelOrder: async (req, res) => {
        try {
            await orderController.updateStatus(req.params.id, orderStatus.cancelled);
            res.json({ message: 'Order cancelled' });
        } catch (err) {
            res.status(400).json({ errMessage: err.message });
        }
    },
    returnOrder: async (req, res) => {
        const userId = req.session.user.userId;
        try {
            await orderController.returnOrder(userId, req.params.id, req.body);
            res.json({ message: 'Your return request status has been updated' });
        } catch (err) {
            res.status(400).json({ errMessage: err.message });
        }
    },
    verifyOrderPayment: (req, res) => {
        orderController.verifyOrderPayment(req.body)
            .then(async (response) => {
                await orderController.clearCart(req.session.user.userId);
                res.json(response);
            })
            .catch(err => res.status(400).json({ errMessage: err.message }));
    },
    addReview: async (req, res) => {
        try {
            const userId = req.session.user.userId;
            const orderId = req.params.id;
            const response = await orderController.addReview(userId, orderId, req.body);
            res.json(response);
        } catch (err) {
            res.status(400).json({ errMessage: err.message });
        }
    },
    orderSuccess: (req, res) => {
        if (req.session.orderDone) {
            delete req.session.orderDone;
            res.render('user/purchase/order-success');
        } else {
            res.redirect('/');
        }
    }
}


export async function checkUserLoginStatus(req, res, next) {
    const response = await userController.checkUserStatus(req.session.user);
    if (response) {
        req.session.user = response;
        req.session.save();
        next();
    } else {
        req.session.destroy();
        res.redirect('/login');
    }
}

export function checkForLogin(req, res, next) {
    if (req.session.user) {
        res.redirect('/');
    } else {
        next();
    }
}

export default userRouterController;