import * as orderService from "../../services/order-service.js";
import { sideMenuPath, statusOptions, filterOptions, getSideMenus } from "../../helpers/admin-helpers.js";

export const showOrdersList = async (req, res) => {
  const status = [
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
    "return",
  ].includes(req.query.status)
    ? req.query.status
    : "all";
  const orders = await orderService.getOrders(status);
  const sideMenus = getSideMenus(sideMenuPath.orders);
  res.render("admin/orders/orders", {
    orders,
    sideMenus,
    selectedStatus: status,
    statusOptions: filterOptions("orders"),
  });
};

export const showOrderDetails = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    const sideMenus = getSideMenus(sideMenuPath.orders);
    res.render("admin/orders/view-order", {
      order,
      sideMenus,
      currentPath: req.urls,
    });
  } catch (err) {
    res.render("admin/error", { errMessage: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const response = await orderService.updateStatus(orderId, req.body.status);
    res.json(response);
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};
