document.addEventListener("DOMContentLoaded", function () {
  const closePopupBtn = $("#close-popup-btn");
  const popup = $("#popup-image");
  const imageView = $("#product-images");
  imageView.on("click", (e) => {
    popup.css("visibility", "visible");
    popup.css("opacity", 1);
  });

  closePopupBtn.on("click", (e) => {
    popup.css("visibility", "hidden");
    popup.css("opacity", 0);
  });

  const $image = $("#popup-image-view");
  const $container = $("#popup-carousel");

  $container.on("mousemove", function (e) {
    const containerWidth = $container.width();
    const containerHeight = $container.height();

    const x = e.pageX - $container.offset().left;
    const y = e.pageY - $container.offset().top;

    const xPercentage = (x / containerWidth) * 100;
    const yPercentage = (y / containerHeight) * 100;

    const scaleAmount = 2; // Adjust the zoom level as needed

    $image.css({
      transformOrigin: xPercentage + "% " + yPercentage + "%",
      transform: "scale(" + scaleAmount + ")",
    });
  });

  $container.on("mouseleave", function () {
    $image.css({
      transformOrigin: "center center",
      transform: "scale(1)",
    });
  });
});
