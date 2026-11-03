document.addEventListener("DOMContentLoaded", function () {
  const errMessage = $("#err-message");
  $("#bannerForm").submit((e) => {
    e.preventDefault();
    errMessage.text("");
    const bannerImage = $("#banner-image-input");
    formData = $("#bannerForm").serializeArray();
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
    $("#banner-image-input").removeClass("err");
    if (!bannerImage.val() && !existBannerImage) {
      $("#banner-image-input").addClass("err");
      const currentMessage = errMessage.text();
      errMessage.text(
        currentMessage +
          (currentMessage ? ", " : "Please upload ") +
          "banner image",
      );
    } else if (!errMessage.text()) {
      $("#bannerForm")[0].submit();
    }
  });
});
