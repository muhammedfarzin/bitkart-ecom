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
                url: location.href,
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
});