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
  const targetPath = "/cart/items/" + encodeURIComponent(productId);
  App.request({
    url: targetPath,
    type: "PUT",
    data: { quantity },
    dataType: "json",
    success: function (data) {
      if (redirect) return (location.href = redirect);
      if (data.cartCount <= 0) {
        $("#cart-view").addClass("d-none");
        $("#empty-cart").removeClass("d-none");
      }
      if (data.updatedQuantity <= 0) $("#list-item-" + productId)?.remove();
      const deliveryCharge = $("#delivery-charge");
      const { totalPrice, deliveryCharge: deliveryCost } = data.priceDetails;
      $("#total-price").text(App.formatCurrency(totalPrice));
      $("#total-amount").text(App.formatCurrency(totalPrice + deliveryCost));
      deliveryCharge.text(
        deliveryCost === 0 ? "Free" : App.formatCurrency(deliveryCost),
      );
      deliveryCharge.toggleClass("text-primary", deliveryCost === 0);

      if (!location.pathname.startsWith("/cart"))
        showAlertBox("Cart updated successfully", true);
    },
    followRedirects: true,
    error: function (err) {
      const currentQuantity = err.responseJSON?.currentQuantity;
      showAlertBox(App.errorMessage(err));
      if (currentQuantity) $("#quantity-" + productId).val(currentQuantity);
      else setTimeout(() => location.reload(), 2500);
    },
  });
}, 500);

function addToCart(productId, redirect) {
  let quantity = $("#quantity-" + productId);
  if (quantity.val() >= 10)
    return showAlertBox(
      "Sorry, you can only purchase up to 10 units of the same product at a time",
    );
  quantity.val(parseInt(quantity.val()) + 1);
  debouncedUpdateCart(productId, quantity, redirect);
}

function removeFromCart(productId) {
  let quantity = $("#quantity-" + productId);
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
