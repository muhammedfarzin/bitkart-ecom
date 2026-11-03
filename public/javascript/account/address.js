document.addEventListener("DOMContentLoaded", function () {
  const errMessage = $("#err-message");
  $("#addressFrm").submit((e) => {
    e.preventDefault();
    errMessage.text("");
    formData = $("#addressFrm").serializeArray();
    let formObject = {};
    $.each(formData, function () {
      const value = this.value.trim();
      if (!value) {
        $("#" + this.name).addClass("err");
        const currentMessage = errMessage.text();
        errMessage.text(
          currentMessage +
            (currentMessage ? ", " : "Please enter ") +
            this.name,
        );
      } else $("#" + this.name).removeClass("err");
      formObject[this.name] = value;
    });
    if (!errMessage.text()) {
      const mobile = $("#mobile");
      if (!mobilePattern.test(mobile.val())) {
        errMessage.text("Please enter a valid mobile number");
        mobile.addClass("err");
      } else {
        mobile.removeClass("err");
        $("#addressFrm")[0].submit();
      }
    }
  });
});

function removeAddress(addressId) {
  $.ajax({
    url: "/account/address/remove/" + addressId,
    type: "DELETE",
    success: function (data) {
      document.getElementById("closeModalBtn")?.click();
      $("#address" + addressId).remove();
    },
    error: function (err) {
      showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
    },
  });
}
