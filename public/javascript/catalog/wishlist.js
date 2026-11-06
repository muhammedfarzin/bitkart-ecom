const primaryColor = "#6F43BF";

function updateWishlist(productId, adding) {
  const icon = $("#wishlist-icon-" + productId);
  const button = $("#wishlist-btn-" + productId);
  icon.css("fill", primaryColor + "80");
  App.request({
    url: "/wishlist/items/" + encodeURIComponent(productId),
    type: adding ? "PUT" : "DELETE",
    followRedirects: adding,
    dataType: "json",
    success: () => {
      icon.css("fill", adding ? primaryColor : "none");
      const nextAction = adding ? "removeFromWishlist" : "addToWishlist";
      button.attr("onclick", `${nextAction}('${productId}'); return false`);
    },
    error: (error) => {
      icon.css("fill", adding ? "none" : primaryColor);
      App.showRequestError(error);
    },
  });
}

function addToWishlist(productId) {
  updateWishlist(productId, true);
}

function removeFromWishlist(productId) {
  updateWishlist(productId, false);
}
