import * as userService from "../../services/user-service.js";
import * as orderService from "../../services/order-service.js";

export const showWalletDatas = async (req, res) => {
  const wallet = await userService.getWalletDatas(req.session.user.userId);
  res.render("user/account/wallet", { wallet });
};

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
