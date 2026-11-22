import * as orderService from "../../services/order-service.js";
import { orderStatus } from "../../models/order-model.js";

export const showOrdersList = async (req, res) => {
  const orders = await orderService.getUserOrders(req.session.user.userId);
  res.render("user/account/orders", { orders, currentPath: req.url });
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
