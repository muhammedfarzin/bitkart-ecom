document.addEventListener('DOMContentLoaded', function () {
    const placeOrderForm = $('#placeOrderFrm');

    $('#placeOrderBtn').on('click', () => placeOrderForm.submit());

    placeOrderForm?.submit((e) => {
        e.preventDefault();
        let formData = placeOrderForm.serializeArray();
        let formObject = {};
        $.each(formData, function () {
            formObject[this.name] = this.value;
        });
        if (!formObject.addressId) return alert('Please select an address');

        if (formObject.paymentMethod == 'cod' || formObject.paymentMethod == 'online') {
            $.ajax({
                url: '/placeOrder',
                type: 'POST',
                data: formObject,
                dataType: 'json',
                success: function (data) {
                    if (data.orderPlaced) {
                        location.href = data.redirect ?? '/';
                    } else {
                        razorpayPayment(data);
                    }
                },
                error: function (err) {
                    alert(err.responseJSON?.errMessage ?? 'Something went wrong');
                }
            });
        } else {
            alert('Please select payment a payment method');
        }
    });

    $('#cancelOrderBtn').on('click', (e) => {
        $.ajax({
            url: location.href,
            type: 'DELETE',
            success: function (data) {
                alert(data.message ?? 'Order cancelled');
                location.reload();
            },
            error: function (err) {
                alert(err.responseJSON?.errMessage ?? 'Something went wrong');
            }
        });
    });

    $('#returnOrderFrm').submit((e) => {
        e.preventDefault();
        let formData = $('#returnOrderFrm').serializeArray();
        let formObject = {};
        $.each(formData, function () {
            formObject[this.name] = this.value;
        });
        $.ajax({
            url: location.href + '/return',
            type: 'PATCH',
            data: formObject,
            dataType: 'json',
            success: function (data) {
                location.reload();
            },
            error: function (err) {
                alert(err.responseJSON?.errMessage ?? 'Something went wrong');
            }
        });
    });

    $('#reviewForm').submit((e) => {
        e.preventDefault();
        let formData = $('#reviewForm').serializeArray();
        let formObject = {};
        $.each(formData, function () {
            formObject[this.name] = this.value;
        });
        if (formObject.starRating < 1 || formObject.starRating > 5) {
            alert('Please select valid starRating');
        } else {
            $.ajax({
                url: location.href + '/addReview',
                type: 'POST',
                data: formObject,
                dataType: 'json',
                success: function (data) {
                    alert(data.message || 'Review submitted');
                },
                error: function (err) {
                    alert(err.responseJSON?.errMessage ?? 'Something went wrong');
                }
            });
        }
    })
});

function changeOrderStatus(status, elem) {
    $.ajax({
        url: location.href + '/updateStatus',
        type: 'POST',
        data: { status },
        dataType: 'json',
        success: function (data) {
            alert(data.message);
            location.reload();
        },
        error: function (err) {
            alert(err.responseJSON?.errMessage ?? 'Something went wrong');
        }
    });
}

function changeStarRating(value) {
    const starRatingList = $('.starRating');
    starRatingList.each((index, element) => {
        if (index < value) {
            $(element).css('fill', '#6F43BF');
        } else {
            $(element).css('fill', 'none');
        }
    });
    $('#starRating').val(value);
    $('#submitBtn').prop('disabled', false);
}

function razorpayPayment(order) {
    let options = {
        "key": 'rzp_test_yKUJBZ1MBQQioC',
        "amount": order.amount,
        "currency": "INR",
        "name": "Bitkart",
        "image": "/images/bitkart.svg",
        "order_id": order.id,
        "handler": function (response) {
            verifyPayment(response, order);
        },
        "theme": {
            "color": "#6F43BF"
        }
    }

    let razorpayObject = new Razorpay(options);
    razorpayObject.open();
    razorpayObject.on('payment.failed', function (response) {
        alert("This step of Payment Failed");
    });
}

function verifyPayment(payment, order) {
    $.ajax({
        url: '/orders/verifyPayment',
        type: 'POST',
        data: {
            payment,
            order
        },
        dataType: 'json',
        success: function (data) {
            if (data.orderPlaced) {
                location.href = data.redirect ?? '/';
            } else {
                alert(data.message);
            }
        },
        error: function (err) {
            alert(err.responseJSON?.errMessage ?? 'Something went wrong');
        }
    });
}