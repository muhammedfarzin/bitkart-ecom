import * as userService from "../../services/user-service.js";

export const showAddressList = async (req, res) => {
  const address = await userService.getAddresses(req.session.user.userId);
  res.render("user/account/address-manage", {
    address,
    currentPath: req.url,
  });
};

export const showAddAddressForm = (req, res) => {
  res.render("user/account/address-form", {
    errMessage: req.query.errMessage,
  });
};

export const addAddress = async (req, res) => {
  try {
    await userService.addNewAddress(req);
    res.redirect(303, req.query.redirect ?? "/account/address");
  } catch (err) {
    const url = new URL(
      req.originalUrl,
      req.protocol + "://" + req.get("host")
    );
    url.pathname = "/account/address/add";
    url.searchParams.set("errMessage", err.message);
    res.status(400).redirect(303, url);
  }
};

export const editAddressForm = async (req, res) => {
  const addressId = req.params.id;
  try {
    const address = await userService.getAddressById(
      req.session.user.userId,
      addressId
    );
    res.render("user/account/address-form", {
      address,
      errMessage: req.query.errMessage,
    });
  } catch (err) {
    res
      .status(400)
      .redirect(303,
        `/account/address/add?errMessage=${err.message}&redirect=${req.query.redirect}`
      );
  }
};

export const editAddress = async (req, res) => {
  try {
    await userService.updateAddress(req);
    res.redirect(303, req.query.redirect ?? "/account");
  } catch (err) {
    res.status(400).redirect(303, `/account/address/edit/${req.params.id}?${new URLSearchParams({ ...req.query, errMessage: err.message })}`);
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const response = await userService.removeAddress(
      req.session.user.userId,
      req.params.id
    );
    res.json(response);
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};
