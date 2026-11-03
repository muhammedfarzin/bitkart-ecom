const debounce = (mainFunction, delay) => {
  let timer;

  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      mainFunction(...args);
    }, delay);
  };
};

const debouncedUpdateCart = debounce(function (
  productId,
  quantityElem,
  redirect,
) {
  let quantity = quantityElem.val();
  const targetPath = "/cart/update";
  $.ajax({
    url: targetPath,
    type: "POST",
    data: { productId, quantity },
    dataType: "json",
    success: function (data) {
      if (redirect) return (location.href = redirect);
      if (data.cartCount <= 0) {
        $("#cartView").addClass("d-none");
        $("#emptyCart").removeClass("d-none");
      }
      if (data.updatedQuantity <= 0) $("#listItem" + productId)?.remove();
      const deliveryCharge = $("#deliveryCharge");
      $("#totalPrice")?.text(
        "₹" + data.priceDetails.totalPrice.toLocaleString("en-IN"),
      );
      $("#totalAmount")?.text(
        "₹" +
          (
            data.priceDetails.deliveryCharge + data.priceDetails.totalPrice
          ).toLocaleString("en-IN"),
      );
      if (data.priceDetails.deliveryCharge != 0) {
        deliveryCharge?.text(
          "₹" + data.priceDetails.deliveryCharge.toLocaleString("en-IN"),
        );
        deliveryCharge?.removeClass("text-primary");
      } else {
        deliveryCharge?.text("Free");
        deliveryCharge?.addClass("text-primary");
      }

      if (!location.pathname.startsWith("/cart"))
        showAlertBox("Cart updated successfully", true);
    },
    xhr: function () {
      var xhr = new window.XMLHttpRequest();

      xhr.open("POST", targetPath, true);
      xhr.onreadystatechange = function () {
        const redirectPath = new URL(xhr.responseURL).pathname;
        if (
          redirectPath !== targetPath &&
          location.toString() !== redirectPath
        ) {
          window.location.href = redirectPath;
        }
      };
      return xhr;
    },
    error: function (err) {
      const currentQuantity = err.responseJSON?.currentQuantity;
      showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
      if (currentQuantity) $("#quantity" + productId).val(currentQuantity);
      else setTimeout(() => location.reload(), 2500);
    },
  });
}, 500);

function addToCart(productId, redirect) {
  let quantity = $("#quantity" + productId);
  if (quantity.val() >= 10)
    return showAlertBox(
      "Sorry, you can only purchase up to 10 units of the same product at a time",
    );
  quantity.val(parseInt(quantity.val()) + 1);
  debouncedUpdateCart(productId, quantity, redirect);
}

function removeFromCart(productId) {
  let quantity = $("#quantity" + productId);
  if (quantity.val() <= 1) {
    showConfirmBox(
      "Do you really want remove this product from your cart?",
      removeFromCartConfirmed,
    );
  } else removeFromCartConfirmed();

  function removeFromCartConfirmed() {
    quantity.val(parseInt(quantity.val()) - 1);
    debouncedUpdateCart(productId, quantity);
  }
}

function buyNow(productId) {
  addToCart(productId, "/checkout");
}
