document.addEventListener('DOMContentLoaded', function () {
    const errMessage = $('#err-message');
    const placeOrderForm = $('#placeOrderFrm');

    const promocodeInput = $('#promocode');
    const promocodeBtn = $('#promocodeBtn');

    $('#placeOrderBtn').on('click', () => placeOrderForm.submit());

    placeOrderForm?.submit((e) => {
        e.preventDefault();
        let formData = placeOrderForm.serializeArray();
        let formObject = {};
        $.each(formData, function () {
            formObject[this.name] = this.value;
        });
        if (!formObject.addressId) return showAlertBox('Please select an address');

        if (/^(cod|online|wallet)$/.test(formObject.paymentMethod)) {
            if (promocodeBtn.text() == 'applied') {
                formObject.promocode = promocodeInput.val();
            }
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
                    showAlertBox(err.responseJSON?.errMessage ?? 'Something went wrong');
                }
            });
        } else {
            showAlertBox('Please select a valid payment method');
        }
    });

    $('#cancelOrderBtn').on('click', (e) => {
        $.ajax({
            url: location.href,
            type: 'DELETE',
            success: function (data) {
                showAlertBox(data.message ?? 'Order cancelled', true);
                location.reload();
            },
            error: function (err) {
                showAlertBox(err.responseJSON?.errMessage ?? 'Something went wrong');
            }
        });
    });

    $('#completePendingPaymentBtn').on('click', (e) => {
        const url = new URL(location.href);
        url.pathname += '/completePayment';
        $.ajax({
            url: url.toString(),
            type: 'POST',
            success: function (data) {
                razorpayPayment(data);
            },
            error: function (err) {
                showAlertBox(err.responseJSON?.errMessage ?? 'Something went wrong');
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
                showAlertBox(err.responseJSON?.errMessage ?? 'Something went wrong');
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
            showAlertBox('Please select valid starRating');
        } else {
            $.ajax({
                url: location.href + '/addReview',
                type: 'POST',
                data: formObject,
                dataType: 'json',
                success: function (data) {
                    showAlertBox(data.message || 'Review submitted', true);
                },
                error: function (err) {
                    showAlertBox(err.responseJSON?.errMessage ?? 'Something went wrong');
                }
            });
        }
    });

    promocodeInput.on('input', (e) => {
        const value = promocodeInput.val().replace(/\s/, '');
        if (value) {
            promocodeBtn.prop('disabled', false);
            promocodeInput.val(value);
        } else {
            promocodeBtn.prop('disabled', true);
            promocodeInput.val('');
        }
    });

    $('#promocodeForm').submit((e) => {
        e.preventDefault();
        const promocode = promocodeInput.val().replace(/\s/, '');
        errMessage.text('');
        if (promocode) {
            promocodeBtn.prop('disabled', true);
            $.ajax({
                url: '/checkout/verifyPromocode',
                type: 'POST',
                data: { promocode },
                dataType: 'json',
                success: function (data) {
                    const totalAmountElem = $('#totalAmount');
                    const totalAmount = parseFloat(totalAmountElem.text().replace('₹', '').replace(/,/g, ''));
                    $('#promocodeSummary').removeClass('d-none').addClass('d-flex');
                    $('#promocodeValue').text('-₹' + data.promocodeDiscount);
                    totalAmountElem.text('₹' + (totalAmount - data.promocodeDiscount).toLocaleString('en-IN'))

                    promocodeInput.prop('readonly', true);
                    promocodeInput.css('cursor', 'not-allowed');
                    promocodeBtn.text('applied');
                    promocodeBtn.removeClass('btn-primary').addClass('btn-success');
                },
                error: function (err) {
                    promocodeBtn.prop('disabled', false);
                    errMessage.text(err.responseJSON?.errMessage ?? 'Something went wrong');
                }
            });
        }
    });
});

function changeOrderStatus(status, elem) {
    $.ajax({
        url: location.href + '/updateStatus',
        type: 'POST',
        data: { status },
        dataType: 'json',
        success: function (data) {
            showAlertBox(data.message, true);
            location.reload();
        },
        error: function (err) {
            showAlertBox(err.responseJSON?.errMessage ?? 'Something went wrong');
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
        showAlertBox("This step of Payment Failed");
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
                showAlertBox(data.message, true);
            }
        },
        error: function (err) {
            showAlertBox(err.responseJSON?.errMessage ?? 'Something went wrong');
        }
    });
}