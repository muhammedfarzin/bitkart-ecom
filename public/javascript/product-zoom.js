document.addEventListener('DOMContentLoaded', function () {
    const closePopupBtn = $('#closePopupBtn');
    const popup = $('#popup-image')
    const imageView = $('#product-images');
    imageView.on('click', (e) => {
        popup.css('visibility', 'visible');
        popup.css('opacity', 1);
    });

    closePopupBtn.on('click', (e) => {
        popup.css('visibility', 'hidden');
        popup.css('opacity', 0);
    })

    var $image = $('#popup-image-view');
    var $container = $('#popupCarousel');

    $container.on('mousemove', function (e) {
        var containerWidth = $container.width();
        var containerHeight = $container.height();
        var imageWidth = $image.width();
        var imageHeight = $image.height();

        var x = e.pageX - $container.offset().left;
        var y = e.pageY - $container.offset().top;

        var xPercentage = (x / containerWidth) * 100;
        var yPercentage = (y / containerHeight) * 100;

        var scaleAmount = 2; // Adjust the zoom level as needed

        $image.css({
            transformOrigin: xPercentage + '% ' + yPercentage + '%',
            transform: 'scale(' + scaleAmount + ')'
        });
    });

    $container.on('mouseleave', function () {
        $image.css({
            transformOrigin: 'center center',
            transform: 'scale(1)'
        });
    });

});