const primaryColor = "#6F43BF";
function addToWishlist(productId) {
  const targetPath = "/wishlist/add";
  const wishlistIcon = $("#wishlistIcon" + productId);
  const wishlistBtn = $("#wishlistBtn" + productId);
  wishlistIcon.css("fill", primaryColor + 80);
  $.ajax({
    url: targetPath,
    type: "POST",
    data: { productId },
    dataType: "json",
    success: function (data) {
      wishlistIcon.css("fill", primaryColor);
      wishlistBtn.attr(
        "onclick",
        `removeFromWishlist('${productId}'); return false`,
      );
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
          window.location.href = redirectUrl;
        }
      };
      return xhr;
    },
    error: function (err) {
      wishlistIcon.css("fill", "none");
    },
  });
}

function removeFromWishlist(productId) {
  const wishlistIcon = $("#wishlistIcon" + productId);
  const wishlistBtn = $("#wishlistBtn" + productId);
  wishlistIcon.css("fill", primaryColor + 80);
  $.ajax({
    url: "/wishlist/remove",
    type: "DELETE",
    data: { productId },
    dataType: "json",
    success: function (data) {
      wishlistIcon.css("fill", "none");
      wishlistBtn.attr(
        "onclick",
        `addToWishlist('${productId}'); return false`,
      );
    },
    error: function (err) {
      wishlistIcon.css("fill", primaryColor);
    },
  });
}
