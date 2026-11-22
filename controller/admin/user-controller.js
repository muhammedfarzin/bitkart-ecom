import * as userService from "../../services/user-service.js";
import { sideMenuPath, statusOptions, filterOptions, getSideMenus } from "../../helpers/admin-helpers.js";

export const showUsersList = async (req, res) => {
  let users,
    searchQuery = req.query.search;
  const status = ["active", "blocked"].includes(req.query.status)
    ? req.query.status
    : "all";
  const filter = status === "all" ? {} : { status };
  if (searchQuery) {
    users = await userService.findUsersByQuery(searchQuery, filter);
  } else {
    users = await userService.getUsersBasicData(filter);
  }
  const sideMenus = getSideMenus(sideMenuPath.users);
  res.render("admin/users/users", {
    users,
    sideMenus,
    searchQuery,
    selectedStatus: status,
    statusOptions: filterOptions("users"),
  });
};

export const toggleUserStatus = async (req, res) => {
  try {
    const response = await userService.toggleUserStatus(req.params.id);
    res.json(response);
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};
