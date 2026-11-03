document.addEventListener("DOMContentLoaded", function () {
  const errMessage = $("#err-message");
  $("#personalDetailsFrm").submit((e) => {
    e.preventDefault();
    const formData = $("#personalDetailsFrm")
      .serializeArray()
      .reduce((obj, item) => {
        obj[item.name] = item.value;
        return obj;
      }, {});

    errMessage.text("");
    $("#name").removeClass("err");
    $("#mobile").removeClass("err");
    $("#email").removeClass("err");
    $("#password").removeClass("err");
    $("#newPassword").removeClass("err");

    if (!formData.name) {
      errMessage.text("Please enter name");
      $("#name").addClass("err");
    } else if (!mobilePattern.test(formData.mobile)) {
      errMessage.text("Please enter a valid 10-digit mobile numberssssss");
      $("#mobile").addClass("err");
    } else if (!formData.email) {
      errMessage.text("Please enter email address");
      $("#email").addClass("err");
    } else if (!formData.password) {
      errMessage.text("Please enter password");
      $("#password").addClass("err");
    } else if (
      formData.newPassword &&
      !passwordRegex.test(formData.newPassword)
    ) {
      errMessage.text(
        "Please enter a valid strong password (password must contain atleast 8 character)",
      );
      $("#newPassword").addClass("err");
    } else {
      $("#personalDetailsFrm")[0].submit();
    }
  });
});
