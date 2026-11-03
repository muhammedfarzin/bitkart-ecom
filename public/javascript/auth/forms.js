document.addEventListener("DOMContentLoaded", function () {
  const errMessage = $("#err-message");
  $("#login-frm").submit((e) => {
    e.preventDefault();
    let email = $("#email");
    let password = $("#password");

    email.removeClass("err");
    password.removeClass("err");

    if (!email.val()) {
      errMessage.text("Please enter email");
      email.addClass("err");
    } else if (!password.val()) {
      errMessage.text("Please enter password");
      password.addClass("err");
    } else {
      $("#login-frm")[0].submit();
    }
  });

  $("#signup-frm").submit((e) => {
    e.preventDefault();
    let email = $("#email");
    let password = $("#password");
    let confPassword = $("#conf-password");
    let name = $("#name");
    let mobile = $("#mobile");

    errMessage.text("");
    email.removeClass("err");
    password.removeClass("err");
    confPassword.removeClass("err");
    name.removeClass("err");
    mobile.removeClass("err");

    if (!name.val()) {
      errMessage.text("Please enter name");
      name.addClass("err");
    } else if (!email.val()) {
      errMessage.text("Please enter email");
      email.addClass("err");
    } else if (!password.val()) {
      errMessage.text("Please enter password");
      password.addClass("err");
    } else if (!mobile.val()) {
      errMessage.text("Please enter mobile number");
      mobile.addClass("err");
    } else if (!mobilePattern.test(mobile.val())) {
      errMessage.text("Please enter a valid 10-digit mobile number");
      mobile.addClass("err");
    } else if (!passwordRegex.test(password.val())) {
      errMessage.text("Please enter a valid password");
      password.addClass("err");
    } else if (password.val() != confPassword.val()) {
      errMessage.text(
        "Your password and confirm password entries do not match",
      );
      confPassword.addClass("err");
    } else {
      $("#signup-frm")[0].submit();
    }
  });
});
