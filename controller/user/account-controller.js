import * as userService from "../../services/user-service.js";

export const showPersonalDetailsForm = async (req, res) => {
  const user = await userService.findUserById(req.session.user.userId);
  res.render("user/account/account", {
    user,
    errMessage: req.query.errMessage,
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
