document.addEventListener("DOMContentLoaded", function () {
  const errMessage = $("#err-message");
  $("#productForm").submit((e) => {
    e.preventDefault();
    errMessage.text("");
    const categoryImage = $("#image-input");
    formData = $("#productForm").serializeArray();
    let formObject = {};
    $.each(formData, function () {
      const value = this.value.trim();
      $("#" + this.name).addClass("err");
      if (!value && this.name != "offerPrice") {
        const currentMessage = errMessage.text();
        errMessage.text(
          currentMessage +
            (currentMessage ? ", " : "Please enter ") +
            this.name.replace(/([a-z])([A-Z])/g, "$1 $2"),
        );
      } else $("#" + this.name).removeClass("err");
      formObject[this.name] = value;
    });

    $("#image-picker").removeClass("err");
    if (
      !location.href.includes("/admin/products/edit/") &&
      !categoryImage.val()
    ) {
      $("#image-picker").addClass("err");
      const currentMessage = errMessage.text();
      errMessage.text(
        currentMessage +
          (currentMessage ? ", " : "Please upload ") +
          "products image",
      );
    } else if (!errMessage.text()) {
      $("#productForm")[0].submit();
    }
  });
});
