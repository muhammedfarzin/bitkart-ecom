import { Router } from "express";
import { createSession, withMiddleware, renderForm } from "./helpers.js";
import * as userController from "../controller/user-controller.js";
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
  .post(userController.login);

guestRoute("/signup")
  .get(renderForm("user/signup"))
  .post(userController.signup);

guestRoute("/login/google").post(userController.signInUsingGoogle);

// OTP Validation
router
  .route("/verifyEmail")
  .get(userController.showVerifyEmailPage)
  .post(userController.verfifyEmail);

router.get("/resendOtp", userController.resendOtp);

guestRoute("/login/forgotPassword")
  .get(renderForm("user/forgot-password"))
  .post(userController.forgotPassword);

guestRoute("/login/setNewPassword")
  .get(renderForm("user/auth/new-password-frm"))
  .post(userController.setNewPassword);

router.get("/", userController.showHome);

// Product overview
router.get("/view/:id", userController.productOverview);

router.get("/logout", userController.logout);

// Search
router.get("/search", userController.searchProducts);

// Account
authenticatedRoute("/account")
  .get(userController.showPersonalDetailsForm)
  .patch(userController.updateUser);

authenticatedRoute("/account/address")
  .get(userController.showAddressList)
  .post(userController.addAddress);

authenticatedRoute("/account/orders").get(userController.showOrdersList);

authenticatedRoute("/account/wallet").get(userController.showWalletDatas);

authenticatedRoute("/account/wallet/payments").post(
  userController.addMoneyToWallet,
);

authenticatedRoute("/account/wallet/payment-verifications").post(
  userController.verifyWalletPayment,
);

// Manage Address
authenticatedRoute("/account/address/add").get(
  userController.showAddAddressForm,
);

authenticatedRoute("/account/address/edit/:id").get(
  userController.editAddressForm,
);

authenticatedRoute("/account/address/:id")
  .patch(userController.editAddress)
  .delete(userController.deleteAddress);

// Wishlist
authenticatedRoute("/wishlist").get(userController.showWishlist);
authenticatedRoute("/wishlist/items/:productId")
  .put(userController.addToWishlist)
  .delete(userController.removeFromWishlist);

// Cart
authenticatedRoute("/cart").get(userController.showCart);

authenticatedRoute("/cart/items/:productId").put(
  userController.updateCart,
);

authenticatedRoute("/checkout").get(userController.showCheckout);

authenticatedRoute("/checkout/promocode-validations").post(
  userController.verifyPromocode,
);

// Orders
authenticatedRoute("/orders").post(userController.placeOrder);

authenticatedRoute("/orders/:id")
  .get(userController.showOrderDetails)
  .delete(userController.cancelOrder);

authenticatedRoute("/orders/:id/returns").post(
  userController.returnOrder,
);

authenticatedRoute("/order-payment-verifications").post(
  userController.verifyOrderPayment,
);

authenticatedRoute("/orders/:id/payments").post(
  userController.completePendingPayment,
);

authenticatedRoute("/orders/:id/invoice").get(
  userController.getOrderInvoicePDF,
);

// Reviews
authenticatedRoute("/orders/:id/reviews").post(userController.addReview);

authenticatedRoute("/orderSuccess").get(userController.orderSuccess);

export default router;
