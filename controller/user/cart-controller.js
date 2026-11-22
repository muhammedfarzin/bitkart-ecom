import * as orderService from "../../services/order-service.js";

export const showCart = async (req, res) => {
  const cart = await orderService.getCartProducts(req.session.user.userId);
  const priceDetails = await orderService.getPriceSummary(
    req.session.user.userId,
    cart
  );
  res.render("user/purchase/cart", { cart, priceDetails });
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
