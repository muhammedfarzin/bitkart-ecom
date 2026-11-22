import { Router } from "express";
import { createSession, withMiddleware, renderForm } from "../helpers/route-helpers.js";
import * as authController from "../controller/user/auth-controller.js";
import * as catalogController from "../controller/user/catalog-controller.js";
import * as accountController from "../controller/user/account-controller.js";
import * as addressController from "../controller/user/address-controller.js";
import * as walletController from "../controller/user/wallet-controller.js";
import * as wishlistController from "../controller/user/wishlist-controller.js";
import * as cartController from "../controller/user/cart-controller.js";
import * as checkoutController from "../controller/user/checkout-controller.js";
import * as orderController from "../controller/user/order-controller.js";
import {
  checkUserLoginStatus,
  checkForUserLogin,
} from "../middleware/auth-middleware.js";

const router = Router();
const authenticatedRoute = withMiddleware(router, checkUserLoginStatus);
const guestRoute = withMiddleware(router, checkForUserLogin);

router.use(
  createSession({
    key: "USER_SESSION",
    secret: "user_secret",
    maxAge: 3600000 * 24 * 30,
  }),
);

router.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.session.user;
  next();
});

// Routes

guestRoute("/login")
  .get(renderForm("user/login"))
  .post(authController.login);

guestRoute("/signup")
  .get(renderForm("user/signup"))
  .post(authController.signup);

guestRoute("/login/google").post(authController.signInUsingGoogle);

// OTP Validation
router
  .route("/verifyEmail")
  .get(authController.showVerifyEmailPage)
  .post(authController.verfifyEmail);

router.get("/resendOtp", authController.resendOtp);

guestRoute("/login/forgotPassword")
  .get(renderForm("user/forgot-password"))
  .post(authController.forgotPassword);

guestRoute("/login/setNewPassword")
  .get(renderForm("user/auth/new-password-frm"))
  .post(authController.setNewPassword);

router.get("/", catalogController.showHome);

// Product overview
router.get("/view/:id", catalogController.productOverview);

router.get("/logout", authController.logout);

// Search
router.get("/search", catalogController.searchProducts);

// Account
authenticatedRoute("/account")
  .get(accountController.showPersonalDetailsForm)
  .patch(accountController.updateUser);

authenticatedRoute("/account/address")
  .get(addressController.showAddressList)
  .post(addressController.addAddress);

authenticatedRoute("/account/orders").get(orderController.showOrdersList);

authenticatedRoute("/account/wallet").get(walletController.showWalletDatas);

authenticatedRoute("/account/wallet/payments").post(
  walletController.addMoneyToWallet,
);

authenticatedRoute("/account/wallet/payment-verifications").post(
  walletController.verifyWalletPayment,
);

// Manage Address
authenticatedRoute("/account/address/add").get(
  addressController.showAddAddressForm,
);

authenticatedRoute("/account/address/edit/:id").get(
  addressController.editAddressForm,
);

authenticatedRoute("/account/address/:id")
  .patch(addressController.editAddress)
  .delete(addressController.deleteAddress);

// Wishlist
authenticatedRoute("/wishlist").get(wishlistController.showWishlist);
authenticatedRoute("/wishlist/items/:productId")
  .put(wishlistController.addToWishlist)
  .delete(wishlistController.removeFromWishlist);

// Cart
authenticatedRoute("/cart").get(cartController.showCart);

authenticatedRoute("/cart/items/:productId").put(
  cartController.updateCart,
);

authenticatedRoute("/checkout").get(checkoutController.showCheckout);

authenticatedRoute("/checkout/promocode-validations").post(
  checkoutController.verifyPromocode,
);

// Orders
authenticatedRoute("/orders").post(checkoutController.placeOrder);

authenticatedRoute("/orders/:id")
  .get(orderController.showOrderDetails)
  .delete(orderController.cancelOrder);

authenticatedRoute("/orders/:id/returns").post(
  orderController.returnOrder,
);

authenticatedRoute("/order-payment-verifications").post(
  orderController.verifyOrderPayment,
);

authenticatedRoute("/orders/:id/payments").post(
  orderController.completePendingPayment,
);

authenticatedRoute("/orders/:id/invoice").get(
  orderController.getOrderInvoicePDF,
);

// Reviews
authenticatedRoute("/orders/:id/reviews").post(orderController.addReview);

authenticatedRoute("/orderSuccess").get(checkoutController.orderSuccess);

export default router;
