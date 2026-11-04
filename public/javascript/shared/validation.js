const mobilePattern = /^[6-9]\d{9}$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[a-zA-Z0-9]{3,})(?!.*(.)\1\1).{8,}$/;
window.FormValidation = (() => {
  const required = {
    "login-frm": "email password",
    "signup-frm": "name email password mobile",
    "forgot-password-frm": "email",
    "new-password-frm": "password confirmPassword",
    "otp-frm": "otp",
    "personal-details-frm": "name mobile email password",
    "address-frm": "name mobile address pincode locality landmark state",
    "add-money-frm": "amount",
    "product-frm": "title description price category quantity",
    "category-frm": "title description",
    "banner-frm": "title validity status",
    "coupon-frm":
      "title code description validUpto discountValue discountType minPurchaseAmount maxDiscountAmount",
    "custom-date-frm": "dateFrom dateTo",
    "promocode-frm": "promocode",
    "review-frm": "starRating",
    "return-order-frm": "returnQuantity addressId",
    "place-order-frm": "addressId paymentMethod",
  };

  const fieldLabels = {
    email: "email address",
    mobile: "mobile number",
    pincode: "PIN code",
    otp: "6-digit OTP",
    addressId: "address",
    confirmPassword: "password confirmation",
    "confirm-password": "password confirmation",
    starRating: "star rating",
    validUpto: "expiry date",
    validity: "expiry date",
  };
  const label = (name) =>
    fieldLabels[name] ||
    name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[-_]/g, " ")
      .toLowerCase();
  const selectionFields = new Set(["addressId", "paymentMethod", "starRating"]);

  function requiredMessage(el, name = el?.name || el?.id || "value") {
    const select =
      el?.tagName === "SELECT" ||
      [
        "checkbox",
        "radio",
        "date",
        "time",
        "datetime-local",
        "month",
        "week",
        "file",
      ].includes(el?.type) ||
      selectionFields.has(name);
    return `Please ${select ? "select" : "enter"} ${label(name)}.`;
  }

  function validate(form) {
    const fields = Array.from(form.elements).filter(
      (el) => /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !el.disabled,
    );
    const field = (name) =>
      fields.find((el) => el.name === name || el.id === name);
    const value = (name) => field(name)?.value ?? "";
    const errors = [];
    const fail = (name, message) =>
      errors.push({
        el: typeof name === "string" ? field(name) : name,
        message,
      });

    fields.forEach((el) => {
      el.classList.remove("err");
      el.removeAttribute("aria-invalid");
      // Preserve passwords exactly, including leading and trailing spaces.
      if (!["password", "file", "radio", "checkbox"].includes(el.type))
        el.value = el.value.trim();
    });

    const requiredFieldNames = (required[form.id] || "")
      .split(" ")
      .filter(Boolean);

    for (const name of requiredFieldNames) {
      const el = field(name);
      const present = ["radio", "checkbox"].includes(el?.type)
        ? fields.some((input) => input.name === name && input.checked)
        : value(name).trim();
      if (!present) fail(el, requiredMessage(el, name));
    }

    for (const el of fields) {
      if (el.willValidate && !el.checkValidity())
        fail(
          el,
          el.validity?.valueMissing
            ? requiredMessage(el)
            : el.validationMessage,
        );
      if (el.maxLength >= 0 && el.value.length > el.maxLength)
        fail(el, `Use at most ${el.maxLength} characters.`);
      if (
        el.type === "email" &&
        el.value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)
      )
        fail(el, "Enter a valid email address.");
      if (el.type === "file") {
        const files = Array.from(el.files);
        if (
          files.some(
            (file) => !file.type.startsWith("image/") || file.size === 0,
          )
        )
          fail(el, "Choose a non-empty image file.");
        if (el.multiple && files.length > 0 && files.length < 3)
          fail(el, "Choose at least three product images.");
        if (files.length > (el.multiple ? 5 : 1))
          fail(
            el,
            "Choose at most five product images or one category/banner image.",
          );
        if (!files.length && el.dataset.existingImage !== "true")
          fail(el, "Please upload an image.");
      }
    }
    const patterns = [
      ["mobile", mobilePattern, "Enter a valid 10-digit mobile number starting with 6-9."],
      ["pincode", /^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code."],
      ["otp", /^\d{6}$/, "Enter the 6-digit OTP."],
    ];
    for (const [name, pattern, message] of patterns) {
      if (value(name) && !pattern.test(value(name))) fail(name, message);
    }
    const password =
      form.id === "personal-details-frm"
        ? "newPassword"
        : ["signup-frm", "new-password-frm"].includes(form.id)
          ? "password"
          : null;
    if (password && value(password) && !passwordRegex.test(value(password)))
      fail(
        password,
        "Use at least 8 characters including letters, three consecutive letters/digits, and no character repeated three times in a row.",
      );
    const confirmation = field("confirmPassword") || field("confirm-password");
    if (confirmation && !confirmation.value)
      fail(confirmation, requiredMessage(confirmation));
    else if (confirmation && confirmation.value !== value("password"))
      fail(confirmation, "Passwords must match.");
    const number = (
      name,
      min,
      max = Number.MAX_SAFE_INTEGER,
      integer = false,
    ) => {
      if (!value(name)) return;
      const n = Number(value(name));
      if (
        !Number.isFinite(n) ||
        n < min ||
        n > max ||
        (integer && !Number.isSafeInteger(n))
      )
        fail(
          name,
          `Enter a valid ${label(name)}${integer ? " (whole number)" : ""} from ${min} to ${max}.`,
        );
    };
    number("amount", 1, Number.MAX_SAFE_INTEGER / 100);
    number("price", 10);
    number("offerPrice", 10);
    number("quantity", 0, 500, true);
    number(
      "discountValue",
      1,
      value("discountType") === "percentage" ? 100 : Number.MAX_SAFE_INTEGER,
    );
    number("minPurchaseAmount", 10);
    number("maxDiscountAmount", 1);
    number("starRating", 1, 5, true);
    number("returnQuantity", 1, Number.MAX_SAFE_INTEGER, true);
    number("minAmount", 0, Number.MAX_SAFE_INTEGER, true);
    number("maxAmount", 0, Number.MAX_SAFE_INTEGER, true);
    if (
      value("offerPrice") &&
      Number(value("offerPrice")) >= Number(value("price"))
    )
      fail("offerPrice", "Offer price must be less than the regular price.");
    if (
      value("maxAmount") &&
      Number(value("maxAmount")) < Number(value("minAmount") || 0) + 500
    )
      fail(
        "maxAmount",
        "Maximum price must be at least Rs 500 above minimum price.",
      );
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    for (const name of ["validUpto", "validity"])
      if (value(name) && value(name) < today)
        fail(name, "Choose today or a future date.");
    for (const name of ["dateFrom", "dateTo"])
      if (value(name) > today)
        fail(name, "Report dates cannot be in the future.");
    if (
      value("dateFrom") &&
      value("dateTo") &&
      value("dateFrom") >= value("dateTo")
    )
      fail("dateTo", "End date must be after the start date.");
    for (const el of fields.filter(
      (el) => el.tagName === "SELECT" && el.value,
    )) {
      if (
        !Array.from(el.options).some(
          (option) => !option.disabled && option.value === el.value,
        )
      )
        fail(el, "Select a valid option.");
    }
    renderErrors(form, errors);
    return errors.length === 0;
  }

  function renderErrors(form, errors) {
    let summary = form.querySelector(".validation-errors");
    if (!summary) {
      summary = document.createElement("div");
      summary.className = "validation-errors text-danger my-2";
      summary.setAttribute("role", "alert");
      summary.tabIndex = -1;
      form.prepend(summary);
    }
    summary.textContent = [
      ...new Set(errors.map((error) => error.message)),
    ].join(" ");
    summary.hidden = !errors.length;
    errors.forEach(({ el }) => {
      el?.classList.add("err");
      el?.setAttribute("aria-invalid", "true");
    });
    if (errors.length) {
      const first = errors[0].el;
      (first && !first.hidden && first.type !== "hidden"
        ? first
        : summary
      ).focus();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Use one accessible error summary for browser constraints and custom rules.
    document.querySelectorAll("form").forEach((form) => {
      form.noValidate = true;
    });
    document.addEventListener(
      "submit",
      (event) => {
        if (!validate(event.target)) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  });
  return { validate };
})();
