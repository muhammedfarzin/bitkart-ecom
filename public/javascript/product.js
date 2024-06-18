const primaryColor = '#6F43BF';

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

    $('#sortByPriceFrm').submit(e => {
        e.preventDefault();
        let formData = $('#sortByPriceFrm').serializeArray();
        const url = new URL(location.href);

        $.each(formData, function () {
            if (this.value) url.searchParams.set(this.name, this.value);
            else url.searchParams.delete(this.name);
        });
        location.replace(url);
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

const debouncedUpdateCart = debounce(function (productId, quantityElem, redirect) {
    let quantity = quantityElem.val();
    $.ajax({
        url: '/cart/update',
        type: 'POST',
        data: { productId, quantity },
        dataType: 'json',
        success: function (data) {
            if (redirect) return location.href = redirect;
            if (data.cartCount <= 0) {
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


function addToCart(productId, redirect) {
    let quantity = $('#quantity' + productId);
    if (quantity.val() >= 10) return alert('Sorry, you can only purchase up to 10 units of the same product at a time');
    quantity.val(parseInt(quantity.val()) + 1);
    debouncedUpdateCart(productId, quantity, redirect);
}

function removeFromCart(productId) {
    let quantity = $('#quantity' + productId);
    if (quantity.val() <= 1 && !confirm('Are really want remove this product from your cart?')) return;;
    quantity.val(parseInt(quantity.val()) - 1);
    debouncedUpdateCart(productId, quantity);
}

function buyNow(productId) {
    addToCart(productId, '/checkout');
}

function addToWishlist(productId) {
    const wishlistIcon = $('#wishlistIcon' + productId);
    const wishlistBtn = $('#wishlistBtn' + productId);
    wishlistIcon.css('fill', primaryColor + 80);
    $.ajax({
        url: '/wishlist/add',
        type: 'POST',
        data: { productId },
        dataType: 'json',
        success: function (data) {
            wishlistIcon.css('fill', primaryColor);
            wishlistBtn.attr('onclick', `removeFromWishlist('${productId}'); return false`);
        },
        error: function (err) {
            wishlistIcon.css('fill', 'none');
        }
    });
}

function removeFromWishlist(productId) {
    const wishlistIcon = $('#wishlistIcon' + productId);
    const wishlistBtn = $('#wishlistBtn' + productId);
    wishlistIcon.css('fill', primaryColor + 80);
    $.ajax({
        url: '/wishlist/remove',
        type: 'DELETE',
        data: { productId },
        dataType: 'json',
        success: function (data) {
            wishlistIcon.css('fill', 'none');
            wishlistBtn.attr('onclick', `addToWishlist('${productId}'); return false`);
        },
        error: function (err) {
            wishlistIcon.css('fill', primaryColor);
        }
    });
}

const selectSort = document.getElementById('selectSort');
selectSort.onclick = () => {
    const value = selectSort.value;
    const url = new URL(location.href);
    url.searchParams.set('sort', value);
    if (location.href != url.toString()) location.href = url.toString();
}