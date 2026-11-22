import UserModel from "../models/user-model.js";

export async function setUserLocals(req, res, next) {
  res.locals.isLoggedIn = !!req.session.user;
  res.locals.cartCount = 0;
  res.locals.wishlistCount = 0;
  try {
    if (req.method === "GET" && req.session.user) {
      const user = await UserModel.findById(req.session.user.userId)
        .select("cart wishlist").lean();
      res.locals.cartCount = (user?.cart || []).reduce(
        (count, item) => count + item.quantity, 0,
      );
      res.locals.wishlistCount = user?.wishlist?.length || 0;
    }
    next();
  } catch (err) {
    next(err);
  }
}
