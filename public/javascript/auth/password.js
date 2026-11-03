document.addEventListener("DOMContentLoaded", function () {
  const errMessage = $("#err-message");
  $("#allField-frm").submit((e) => {
    e.preventDefault();
    errMessage.text("");
    formData = $("#allField-frm").serializeArray();
    let formObject = {};
    $.each(formData, function () {
      const value = this.value.trim();
      if (!value) {
        $("#" + this.name).addClass("err");
        const currentMessage = errMessage.text();
        errMessage.text(
          currentMessage +
            (currentMessage ? ", " : "Please enter ") +
            this.name.replace(/([a-z])([A-Z])/g, "$1 $2"),
        );
      } else $("#" + this.name).removeClass("err");
      formObject[this.name] = value;
    });

    if (!errMessage.text()) {
      $("#allField-frm")[0].submit();
    }
  });

  $("#new-password-frm").submit((e) => {
    e.preventDefault();
    errMessage.text("");
    formData = $("#new-password-frm").serializeArray();
    let formObject = {};
    $.each(formData, function () {
      const value = this.value.trim();
      if (!value) {
        $("#" + this.name).addClass("err");
        const currentMessage = errMessage.text();
        errMessage.text(
          currentMessage +
            (currentMessage ? ", " : "Please enter ") +
            this.name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase(),
        );
      } else $("#" + this.name).removeClass("err");
      formObject[this.name] = value;
    });

    if (!errMessage.text()) {
      if (!passwordRegex.test(formObject.password)) {
        $("#password").addClass("err");
        errMessage.text("Please enter a valid password");
      } else if (formObject.password != formObject.confirmPassword) {
        $("#confirmPassword").addClass("err");
        errMessage.text("Password is not matching. Please try again");
      } else {
        $("#new-password-frm")[0].submit();
      }
    }
  });
});
