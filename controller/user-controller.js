import * as userService from "../services/user-service.js";
import * as productService from "../services/product-service.js";
import * as categoryService from "../services/category-service.js";
import * as otpService from "../services/otp-service.js";
import * as orderService from "../services/order-service.js";
import { orderStatus } from "../models/order-model.js";
import * as couponService from "../services/coupon-service.js";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import UserModel from "../models/user-model.js";
import * as bannerService from "../services/banner-service.js";

dotenv.config();
const googleAuthClient = new OAuth2Client();

// Authentications
export const login = (req, res) => {
  const { email, password } = req.body;
  userService
    .verifyUser(email, password)
    .then((userData) => {
      req.session.user = userData;
      req.session.save();
      res.redirect(303, "/");
    })
    .catch((err) => {
      res.redirect(303, "/login?errMessage=" + err.message);
    });
};
export const signInUsingGoogle = async (req, res) => {
  try {
    const ticket = await googleAuthClient.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_AUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userExist = await UserModel.findOne({ email: payload.email });
    if (userExist) {
      req.session.user = { userId: userExist._id };
    } else {
      const user = {
        name: payload.name,
        email: payload.email,
        password: payload.sub,
      };
      const response = await userService.createUser(user);
      req.session.user = response;
    }

    req.session.save();
    res.json({ redirectUrl: "/" });
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};
export const signup = async (req, res) => {
  const { mobile, email, name, password } = req.body;
  try {
    if (!name || !mobile || !email || !password)
      throw new Error("All Fields are required");
    const user = await userService.checkMobileAndEmail(mobile, email);
    if (user) throw new Error(user.message);
    await otpService.sendOTP(email);
    req.session.tempUserData = { name, mobile, email, password };
    req.session.cookie.maxAge = 5 * 60000;
    req.session.save();
    res.redirect(303, "/verifyEmail");
  } catch (err) {
    res.redirect(303, "/signup?errMessage=" + err.message);
  }
};
export const showVerifyEmailPage = (req, res) => {
  if (!req.session.tempUserData)
    return res.redirect(303, "/login?errMessage=Time is over, please try again");
  res.render("user/verify-email", { errMessage: req.query.errMessage });
};
export const verfifyEmail = async (req, res) => {
  try {
    const userData = req.session.tempUserData;
    if (!userData) throw new Error("OTP EXPIRED");
    if (await otpService.verifyOTP(userData.email, req.body.otp)) {
      if (req.session.tempUserData.redirectUrl) {
        req.session.tempUserData.isOTPVerified = true;
        res.json({
          path: req.session.tempUserData.redirectUrl,
          message: "Email verified",
        });
      } else {
        const response = await userService.createUser(userData);
        req.session.user = response;
        delete req.session.tempUserData;
        res.json({ path: "/", message: "Signup successful" });
      }
    } else {
      throw new Error("Invalid OTP, please try again");
    }
  } catch (err) {
    if (err.message == "OTP EXPIRED") {
      req.session.destroy();
      res
        .status(440)
        .json({ errMessage: "Your OTP has expired, Please try again" });
    } else res.status(400).json({ errMessage: err.message });
  }
};
export const resendOtp = async (req, res) => {
  try {
    if (!req.session.tempUserData)
      return res.redirect(303, "/login?errMessage=Time is over, please try again");
    req.session.cookie.maxAge = 5 * 60000;
    await otpService.sendOTP(req.session.tempUserData.email);
    res.json({ message: "Resent OTP successfully. Kindly check your email" });
  } catch (err) {
    res
      .status(400)
      .json({ errMessage: "Something went wrong. Please try again later" });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error("Please enter email address");
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error("User not found");

    await otpService.sendOTP(email);
    req.session.tempUserData = {
      email,
      userId: user._id,
      redirectUrl: "/login/setNewPassword",
    };
    req.session.cookie.maxAge = 5 * 60000;

    res.redirect(303, "/verifyEmail");
  } catch (err) {
    res.redirect(303, "/login/forgotPassword?errMessage=" + err.message);
  }
};
export const setNewPassword = async (req, res) => {
  try {
    if (!req.session.tempUserData) return res.redirect(303, "/");
    if (!req.session.tempUserData?.isOTPVerified)
      return res
        .status(400)
        .redirect(303, "/login?errMessage=Email address is not verified");

    const { userId } = req.session.tempUserData;
    await userService.updatePassword(userId, req.body.password);
    req.session.user = { userId };
    delete req.session.tempUserData;
    res.redirect(303, "/");
  } catch (err) {
    res.redirect(303, "/login/setNewPassword?errMessage=" + err.message);
  }
};
export const logout = (req, res) => {
  req.session.destroy();
  res.redirect(303, "/login");
};

// Products
export const showHome = async (req, res) => {
  const banners = await bannerService.getBanners({ status: "active" });
  const products = await productService.getProducts({ status: "active" });
  const categories = await categoryService.getCategories();
  res.render("user/index", { products, categories, banners });
};
export const productOverview = async (req, res) => {
  try {
    const product = await productService.getProductOverview(req.params.id);
    const relatedProducts = await productService.getRelatedProducts(
      product
    );
    if (req.session.user?.wishlist?.includes(product._id))
      product.isWishlisted = true;
    res.render("user/products/products", { product, relatedProducts });
  } catch (err) {
    res.render("error", { errMessage: err.message });
  }
};
export const searchProducts = async (req, res) => {
  if (req.query.categories) {
    const categoryData = decodeURIComponent(req.query.categories);
    try {
      req.query.categories = JSON.parse(categoryData);
    } catch (err) {
      req.query.categories = [categoryData];
    }
  }
  const {
    products: searchResults,
    totalPages,
    currentPage,
  } = await productService.searchUserProducts(req.query);
  const categories = await categoryService.getAllCategoryTitles();
  const currentUrl = new URL(
    req.originalUrl,
    req.protocol + "://" + req.get("host")
  );
  const context = {
    searchResults,
    categories,
    totalPages,
    currentPage,
    selectedCategories: req.query.categories || [],
    userWishlist: req.session.user?.wishlist || [],
    searchQuery: req.query.search,
    minAmount: req.query.minAmount,
    maxAmount: req.query.maxAmount,
    sort: req.query.sort,
    currentUrl,
  };
  res.render("user/search/search-view", context);
};

// Accounts
export const showPersonalDetailsForm = async (req, res) => {
  const user = await userService.findUserById(req.session.user.userId);
  res.render("user/account/account", {
    user,
    errMessage: req.query.errMessage,
  });
};
export const showAddressList = async (req, res) => {
  const address = await userService.getAddresses(req.session.user.userId);
  res.render("user/account/address-manage", {
    address,
    currentPath: req.url,
  });
};
export const updateUser = async (req, res) => {
  try {
    const newData = await userService.updateUser(
      req.session.user.userId,
      req.body
    );
    req.session.user = { ...req.session.user, ...newData };
    res.redirect(303, "/account");
  } catch (err) {
    res.redirect(303, "/account?errMessage=" + err.message);
  }
};
export const updateCart = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  try {
    const datas = await orderService.updateCart(
      req.session.user.userId,
      productId,
      quantity
    );
    const cartCount = datas.cart.reduce((count, data) => {
      return count + data.quantity;
    }, 0);
    const priceDetails = await orderService.getPriceSummary(
      req.session.user.userId
    );
    res.json({
      message: "Added to cart",
      cartCount,
      updatedQuantity: quantity,
      priceDetails,
    });
  } catch (err) {
    const currentQuantity = req.session.user.cart.find(
      (cartProduct) => cartProduct.productId == productId
    ).quantity;
    res.status(400).json({ errMessage: err.message, currentQuantity });
  }
};
export const showWalletDatas = async (req, res) => {
  const wallet = await userService.getWalletDatas(req.session.user.userId);
  res.render("user/account/wallet", { wallet });
};

// Wallet
export const addMoneyToWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const response = await orderService.generateRazorpay(amount);
    res.json(response);
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};
export const verifyWalletPayment = (req, res) => {
  const userId = req.session.user.userId;
  userService
    .addMoneyToWallet(userId, req.body)
    .then((response) => res.json(response))
    .catch((err) => res.status(400).json({ errMessage: err.message }));
};

// Wishlist
export const showWishlist = async (req, res) => {
  const products = await productService.getProductByIds(
    req.session.user.wishlist
  );
  res.render("user/products/wishlist", { products });
};
export const addToWishlist = (req, res) => {
  const { productId } = req.params;
  const { userId } = req.session.user;
  userService
    .addToWishlist(userId, productId)
    .then((response) => res.json(response))
    .catch((err) => res.status(400).json({ errMessage: err.message }));
};
export const removeFromWishlist = (req, res) => {
  const { productId } = req.params;
  const { userId } = req.session.user;
  userService
    .removeFromWishlist(userId, productId)
    .then((response) => res.json(response))
    .catch((err) => res.status(400).json({ errMessage: err.message }));
};

// Address
export const showAddAddressForm = (req, res) => {
  res.render("user/account/address-form", {
    errMessage: req.query.errMessage,
  });
};
export const addAddress = async (req, res) => {
  try {
    await userService.addNewAddress(req);
    res.redirect(303, req.query.redirect ?? "/account/address");
  } catch (err) {
    const url = new URL(
      req.originalUrl,
      req.protocol + "://" + req.get("host")
    );
    url.pathname = "/account/address/add";
    url.searchParams.set("errMessage", err.message);
    res.status(400).redirect(303, url);
  }
};
export const editAddressForm = async (req, res) => {
  const addressId = req.params.id;
  try {
    const address = await userService.getAddressById(
      req.session.user.userId,
      addressId
    );
    res.render("user/account/address-form", {
      address,
      errMessage: req.query.errMessage,
    });
  } catch (err) {
    res
      .status(400)
      .redirect(303,
        `/account/address/add?errMessage=${err.message}&redirect=${req.query.redirect}`
      );
  }
};
export const editAddress = async (req, res) => {
  try {
    await userService.updateAddress(req);
    res.redirect(303, req.query.redirect ?? "/account");
  } catch (err) {
    res.status(400).redirect(303, `/account/address/edit/${req.params.id}?${new URLSearchParams({ ...req.query, errMessage: err.message })}`);
  }
};
export const deleteAddress = async (req, res) => {
  try {
    const response = await userService.removeAddress(
      req.session.user.userId,
      req.params.id
    );
    res.json(response);
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};

// Orders
export const showOrdersList = async (req, res) => {
  const orders = await orderService.getUserOrders(req.session.user.userId);
  res.render("user/account/orders", { orders, currentPath: req.url });
};
export const showCart = async (req, res) => {
  const cart = await orderService.getCartProducts(req.session.user.userId);
  const priceDetails = await orderService.getPriceSummary(
    req.session.user.userId,
    cart
  );
  res.render("user/purchase/cart", { cart, priceDetails });
};
export const showCheckout = async (req, res) => {
  const userId = req.session.user.userId;
  const addresses = await userService.getAddresses(userId);
  const priceDetails = await orderService.getPriceSummary(userId);
  if (!priceDetails.totalPrice) return res.redirect(303, "/");

  const context = {
    priceDetails,
    addresses,
    currentPath: req.url,
    walletBalance: req.session.user.walletBalance,
  };
  res.render("user/purchase/checkout", context);
};
export const verifyPromocode = async (req, res) => {
  try {
    const userId = req.session.user.userId;
    const promocode = req.body.promocode;
    const cart = await orderService.getCartProducts(userId);
    const couponDiscount = await couponService.verifyCoupon(promocode, cart);
    const priceSummary = await orderService.getPriceSummary(userId, cart);
    res.json({ ...priceSummary, promocodeDiscount: couponDiscount.totalDiscount });
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};
export const placeOrder = async (req, res) => {
  try {
    const paymentMethod = req.body.paymentMethod;
    if (/^(cod|online|wallet)$/.test(paymentMethod)) {
      const response = await orderService.placeOrder(req);
      if (!response) await orderService.clearCart(req.session.user.userId);
      req.session.orderDone = true;
      res.json(
        response ?? {
          message: "Order placed successfully",
          orderPlaced: true,
          redirect: "/orderSuccess",
        }
      );
    } else {
      throw new Error("Please enter payment method");
    }
  } catch (err) {
    res.status(400).json({ errMessage: err?.message });
  }
};
export const showOrderDetails = async (req, res) => {
  try {
    const userId = req.session.user.userId;
    const orderId = req.params.id;
    const orderDetails = await orderService.getUserOrderDetails(
      userId,
      orderId
    );
    res.render("user/account/order-details", {
      orderDetails,
      currentPath: req.url,
    });
  } catch (err) {
    res.render("error", { errMessage: err.message });
  }
};
export const cancelOrder = async (req, res) => {
  try {
    await orderService.updateStatus(req.params.id, orderStatus.cancelled);
    res.json({ message: "Order cancelled" });
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};
export const returnOrder = async (req, res) => {
  const userId = req.session.user.userId;
  try {
    await orderService.returnOrder(userId, req.params.id, req.body);
    res.json({ message: "Your return request status has been updated" });
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};
export const verifyOrderPayment = (req, res) => {
  orderService
    .verifyOrderPayment(req.body)
    .then(async (response) => {
      await orderService.clearCart(req.session.user.userId);
      res.json(response);
    })
    .catch((err) => res.status(400).json({ errMessage: err.message }));
};
export const completePendingPayment = (req, res) => {
  orderService
    .completeOrderPayment(req.params.id)
    .then((response) => {
      req.session.orderDone = true;
      res.json(response);
    })
    .catch((err) =>
      res.status(err.statusCode || 400).json({ errMessage: err.message })
    );
};
export const addReview = async (req, res) => {
  try {
    const userId = req.session.user.userId;
    const orderId = req.params.id;
    const response = await orderService.addReview(
      userId,
      orderId,
      req.body
    );
    res.json(response);
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};
export const orderSuccess = (req, res) => {
  if (req.session.orderDone) {
    delete req.session.orderDone;
    res.render("user/purchase/order-success");
  } else {
    res.redirect(303, "/");
  }
};
export const getOrderInvoicePDF = (req, res) => {
  const { userId } = req.session.user;
  const orderId = req.params.id;
  orderService
    .generateOrderInvoicePDF(userId, orderId)
    .then((invoicePdfBuffer) => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${orderId}.pdf"`
      );
      res.send(invoicePdfBuffer);
    });
};
