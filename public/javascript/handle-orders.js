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
});

function changeOrderStatus(status, elem) {
    $.ajax({
        url: location.href + '/updateStatus',
        type: 'POST',
        data: { status },
        dataType: 'json',
        success: function (data) {
            alert(data.message);
            elem?.classList.replace('btn-outline-primary', 'btn-primary');
        },
        error: function (err) {
            alert(err.responseJSON?.errMessage ?? 'Something went wrong');
        }
    });
}