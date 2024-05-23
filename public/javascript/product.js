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

const debounce = (mainFunction, delay) => {
    let timer;

    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            mainFunction(...args);
        }, delay);
    };
};

const debouncedUpdateCart = debounce(function (productId, quantityElem) {
    let quantity = quantityElem.val();
    $.ajax({
        url: '/cart/update',
        type: 'POST',
        data: { productId, quantity },
        dataType: 'json',
        success: function (data) {
            console.log(data);
            if(data.cartCount <= 0) {
                $('#cartView').addClass('d-none');
                $('#emptyCart').removeClass('d-none');
            }
            if (data.updatedQuantity <= 0) $('#listItem' + productId)?.remove();
            const deliveryCharge = $('#deliveryCharge');
            $('#totalPrice')?.text('₹' + data.priceDetails.totalPrice.toLocaleString('en-IN'));
            $('#totalAmount')?.text('₹' + (data.priceDetails.deliveryCharge + data.priceDetails.totalPrice).toLocaleString('en-IN'));
            if (data.priceDetails.deliveryCharge != 0) {
                deliveryCharge?.text('₹' + data.priceDetails.deliveryCharge.toLocaleString('en-IN'));
                deliveryCharge?.removeClass('text-primary');
            } else {
                deliveryCharge?.text('Free');
                deliveryCharge?.addClass('text-primary');
            }
        },
        error: function (err) {
            alert(err.responseJSON?.errMessage ?? 'Something went wrong');
            location.reload();
        }
    });
}, 500);


function addToCart(productId) {
    let quantity = $('#quantity' + productId);
    if (quantity.val() >= 10) return alert('Sorry, you can only purchase up to 10 units of the same product at a time');
    quantity.val(parseInt(quantity.val()) + 1);
    debouncedUpdateCart(productId, quantity);
}

function removeFromCart(productId) {
    let quantity = $('#quantity' + productId);
    if (quantity.val() <= 1 && !confirm('Are really want remove this product from your cart?')) return;;
    quantity.val(parseInt(quantity.val()) - 1);
    debouncedUpdateCart(productId, quantity);
}