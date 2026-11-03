document.addEventListener("DOMContentLoaded", function () {
  const errMessage = $("#err-message");
  $("#categoryForm").submit((e) => {
    e.preventDefault();
    errMessage.text("");
    const categoryImage = $("#image-input-re");
    formData = $("#categoryForm").serializeArray();
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
    $("#image-picker-re").removeClass("err");
    if (!categoryImage.val()) {
      $("#image-picker-re").addClass("err");
      const currentMessage = errMessage.text();
      errMessage.text(
        currentMessage +
          (currentMessage ? ", " : "Please upload ") +
          "category image",
      );
    } else if (!errMessage.text()) {
      $("#categoryForm")[0].submit();
    }
  });
});
