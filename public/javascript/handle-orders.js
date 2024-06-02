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
        console.log(formObject);
        if (!formObject.addressId) return alert('Please select an address');
        if (formObject.paymentMethod == 'online') {
            alert('Online payment will coming soon');
        } else if (formObject.paymentMethod == 'cod') {
            $.ajax({
                url: '/placeOrder',
                type: 'POST',
                data: formObject,
                dataType: 'json',
                success: function (data) {
                    location.href = data.redirect ?? '/';
                },
                error: function (err) {
                    console.log(err);
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
        console.log(formObject);
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
        console.log(formObject)
        if(false) {
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