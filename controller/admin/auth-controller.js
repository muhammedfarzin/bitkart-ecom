import { checkLogin } from "../../middleware/auth-middleware.js";
import { dashboardRoute, loginRoute } from "../../helpers/admin-helpers.js";

export const showLoginForm = (req, res) => {
  if (checkLogin(req.session)) {
    res.redirect(303, dashboardRoute);
  } else {
    res.render("admin/login", { title: "Admin Login" });
  }
};

export const login = (req, res) => {
  if (checkLogin(req.session)) {
    return res.redirect(303, dashboardRoute);
  }
  const { email, password } = req.body;
  if (
    email == process.env.ADMIN_EMAIL &&
    password == process.env.ADMIN_PASSWORD
  ) {
    req.session.admin = email;
    req.session.save();
    res.redirect(303, dashboardRoute);
  } else {
    res
      .status(401)
      .render("admin/login", { errMessage: "Invalid username or password" });
  }
};

export const logout = (req, res) => {
  req.session.destroy();
  res.redirect(303, loginRoute);
};
