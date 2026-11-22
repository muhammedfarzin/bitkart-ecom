import * as userService from "../../services/user-service.js";
import * as orderService from "../../services/order-service.js";
import * as couponService from "../../services/coupon-service.js";

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

export const orderSuccess = (req, res) => {
  if (req.session.orderDone) {
    delete req.session.orderDone;
    res.render("user/purchase/order-success");
  } else {
    res.redirect(303, "/");
  }
};
