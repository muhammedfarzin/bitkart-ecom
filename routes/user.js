import { Router } from "express";
import { createSession, withMiddleware, renderForm } from "./helpers.js";
import userRouterController from "../controller/router-controller/user-router-controller.js";
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
  .post(userRouterController.login);

guestRoute("/signup")
  .get(renderForm("user/signup"))
  .post(userRouterController.signup);

guestRoute("/login/google").post(userRouterController.signInUsingGoogle);

// OTP Validation
router
  .route("/verifyEmail")
  .get(userRouterController.showVerifyEmailPage)
  .post(userRouterController.verfifyEmail);

router.get("/resendOtp", userRouterController.resendOtp);

guestRoute("/login/forgotPassword")
  .get(renderForm("user/forgot-password"))
  .post(userRouterController.forgotPassword);

guestRoute("/login/setNewPassword")
  .get(renderForm("user/auth/new-password-frm"))
  .post(userRouterController.setNewPassword);

router.get("/", userRouterController.showHome);

// Product overview
router.get("/view/:id", userRouterController.productOverview);

router.get("/logout", userRouterController.logout);

// Search
router.get("/search", userRouterController.searchProducts);

// Account
authenticatedRoute("/account")
  .get(userRouterController.showPersonalDetailsForm)
  .patch(userRouterController.updateUser);

authenticatedRoute("/account/address")
  .get(userRouterController.showAddressList)
  .post(userRouterController.addAddress);

authenticatedRoute("/account/orders").get(userRouterController.showOrdersList);

authenticatedRoute("/account/wallet").get(userRouterController.showWalletDatas);

authenticatedRoute("/account/wallet/payments").post(
  userRouterController.addMoneyToWallet,
);

authenticatedRoute("/account/wallet/payment-verifications").post(
  userRouterController.verifyWalletPayment,
);

// Manage Address
authenticatedRoute("/account/address/add").get(
  userRouterController.showAddAddressForm,
);

authenticatedRoute("/account/address/edit/:id").get(
  userRouterController.editAddressForm,
);

authenticatedRoute("/account/address/:id")
  .patch(userRouterController.editAddress)
  .delete(userRouterController.deleteAddress);

// Wishlist
authenticatedRoute("/wishlist").get(userRouterController.showWishlist);
authenticatedRoute("/wishlist/items/:productId")
  .put(userRouterController.addToWishlist)
  .delete(userRouterController.removeFromWishlist);

// Cart
authenticatedRoute("/cart").get(userRouterController.showCart);

authenticatedRoute("/cart/items/:productId").put(
  userRouterController.updateCart,
);

authenticatedRoute("/checkout").get(userRouterController.showCheckout);

authenticatedRoute("/checkout/promocode-validations").post(
  userRouterController.verifyPromocode,
);

// Orders
authenticatedRoute("/orders").post(userRouterController.placeOrder);

authenticatedRoute("/orders/:id")
  .get(userRouterController.showOrderDetails)
  .delete(userRouterController.cancelOrder);

authenticatedRoute("/orders/:id/returns").post(
  userRouterController.returnOrder,
);

authenticatedRoute("/order-payment-verifications").post(
  userRouterController.verifyOrderPayment,
);

authenticatedRoute("/orders/:id/payments").post(
  userRouterController.completePendingPayment,
);

authenticatedRoute("/orders/:id/invoice").get(
  userRouterController.getOrderInvoicePDF,
);

// Reviews
authenticatedRoute("/orders/:id/reviews").post(userRouterController.addReview);

authenticatedRoute("/orderSuccess").get(userRouterController.orderSuccess);

export default router;
