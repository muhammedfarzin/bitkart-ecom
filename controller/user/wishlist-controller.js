import * as userService from "../../services/user-service.js";
import * as productService from "../../services/product-service.js";

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
