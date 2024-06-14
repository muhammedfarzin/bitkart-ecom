const mobilePattern = /^[6-9]\d{9}$/i;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[a-zA-Z0-9]{3,})(?!.*(.)\1\1).{8,}$/;

function isImage(file) {
    return file && file['type'].split('/')[0] === 'image';
}

document.addEventListener('DOMContentLoaded', function () {
    const errMessage = $('#err-message');
    const imagesInput = document.getElementById('image-input');
    const imageGallery = document.getElementById('image-gallery');
    const popupWindow = document.getElementById('popup-image');
    const cropImageGallery = document.getElementById('crop-image-gallery');
    let imageCropperList = [];

    if (imagesInput) {
        imagesInput.addEventListener('change', handleImagesSelection);
        document.getElementById('image-picker').addEventListener('click', () => imagesInput.click());
    }

    function handleImagesSelection(event) {
        imageGallery.innerHTML = null;
        const selectedImages = event.target.files;
        if (selectedImages.length > 5) {
            return alert('Maximum 5 images are allowed to upload.');
        }

        for (const image of selectedImages) {
            if (!isImage(image)) return alert('Please select an image');
            const imageUrl = URL.createObjectURL(image);
            let containerDiv = document.createElement('div');
            containerDiv.classList.add('outlined-card', 'm-2', 'center-box-v-24', 'object-fit-contain', 'bg-light', 'rounded-0', 'p-0');
            let newImage = document.createElement('img');
            newImage.src = imageUrl;
            containerDiv.append(newImage);
            cropImageGallery.append(containerDiv);
            const cropper = new Cropper(newImage, { aspectRatio: 1, viewMode: 1 });
            imageCropperList.push(cropper);
        }
        popupWindow.style.visibility = 'visible';
        popupWindow.style.opacity = 1;
    }

    $('#cropDone').on('click', (e) => {
        popupWindow.style.opacity = 0;
        popupWindow.style.visibility = 'hidden';
        for (const cropper of imageCropperList) {
            const imageUrl = cropper.getCroppedCanvas().toDataURL('image/jpg');
            const croppedImage = document.createElement('img');
            croppedImage.src = imageUrl;
            croppedImage.classList.add('outlined-card', 'm-2', 'center-box-v-17', 'object-fit-contain', 'bg-light');
            imageGallery.append(croppedImage);
        }
        imageCropperList = [];
        cropImageGallery.innerHTML = null;
    });

    $('#login-frm').submit((e) => {
        e.preventDefault();
        let email = $('#email');
        let password = $('#password');

        email.removeClass('err');
        password.removeClass('err');

        if (!email.val()) {
            errMessage.text('Please enter email');
            email.addClass('err');
        } else if (!password.val()) {
            errMessage.text('Please enter password');
            password.addClass('err');
        } else {
            $('#login-frm')[0].submit();
        }
    });

    $('#signup-frm').submit((e) => {
        e.preventDefault();
        let email = $('#email');
        let password = $('#password');
        let confPassword = $('#conf-password');
        let name = $('#name');
        let mobile = $('#mobile');

        errMessage.text('');
        email.removeClass('err');
        password.removeClass('err');
        confPassword.removeClass('err');
        name.removeClass('err');
        mobile.removeClass('err');

        if (!name.val()) {
            errMessage.text('Please enter name');
            name.addClass('err');
        } else if (!email.val()) {
            errMessage.text('Please enter email');
            email.addClass('err');
        } else if (!password.val()) {
            errMessage.text('Please enter password');
            password.addClass('err');
        } else if (!mobile.val()) {
            errMessage.text('Please enter mobile number');
            mobile.addClass('err');
        } else if (!mobilePattern.test(mobile.val())) {
            errMessage.text('Please enter a valid 10-digit mobile number')
            mobile.addClass('err');
        } else if (!passwordRegex.test(password.val())) {
            errMessage.text('Please enter a valid password');
            password.addClass('err');
        } else if (password.val() != confPassword.val()) {
            errMessage.text('Your password and confirm password entries do not match');
            confPassword.addClass('err');
        } else {
            $('#signup-frm')[0].submit();
        }
    });

    $('#personalDetailsFrm').submit((e) => {
        e.preventDefault();
        const formData = $('#personalDetailsFrm').serializeArray().reduce((obj, item) => {
            obj[item.name] = item.value;
            return obj;
        }, {});

        errMessage.text('');
        $('#name').removeClass('err');
        $('#mobile').removeClass('err');
        $('#email').removeClass('err');
        $('#password').removeClass('err');
        $('#newPassword').removeClass('err');

        if (!formData.name) {
            errMessage.text('Please enter name');
            $('#name').addClass('err');
        } else if (!mobilePattern.test(formData.mobile)) {
            errMessage.text('Please enter a valid 10-digit mobile numberssssss');
            $('#mobile').addClass('err');
        } else if (!formData.email) {
            errMessage.text('Please enter email address');
            $('#email').addClass('err');
        } else if (!formData.password) {
            errMessage.text('Please enter password');
            $('#password').addClass('err');
        } else if (formData.newPassword && !passwordRegex.test(formData.newPassword)) {
            errMessage.text('Please enter a valid strong password (password must contain atleast 8 character)');
            $('#newPassword').addClass('err');
        } else {
            $('#personalDetailsFrm')[0].submit();
        }
    });

    $('#addressFrm').submit((e) => {
        e.preventDefault();
        errMessage.text('');
        formData = $('#addressFrm').serializeArray();
        let formObject = {};
        $.each(formData, function () {
            const value = this.value.trim();
            if (!value) {
                $('#' + this.name).addClass('err');
                const currentMessage = errMessage.text();
                errMessage.text(currentMessage + (currentMessage ? ', ' : 'Please enter ') + this.name);
            } else $('#' + this.name).removeClass('err');
            formObject[this.name] = value;
        });
        if (!errMessage.text()) {
            const mobile = $('#mobile');
            if (!mobilePattern.test(mobile.val())) {
                errMessage.text('Please enter a valid mobile number');
                mobile.addClass('err');
            } else {
                mobile.removeClass('err');
                $('#addressFrm')[0].submit();
            }
        }
    });

    document.getElementById('addMoneyBtn')
        .addEventListener('click', () => $('#addMoneyForm').submit());

    $('#addMoneyForm').submit(e => {
        e.preventDefault();
        errMessage.text('');
        formData = $('#addMoneyForm').serializeArray();
        let formObject = {};
        $.each(formData, function () {
            const value = this.value.trim();
            if (!value || value < 1) {
                $('#' + this.name).addClass('err');
                errMessage.text('Please enter a valid ' + this.name);
            } else $('#' + this.name).removeClass('err');
            formObject[this.name] = value;
        });


        if (!errMessage.text()) {
            $.ajax({
                url: '/account/wallet/addMoney',
                type: 'POST',
                data: formObject,
                dataType: 'json',
                success: function (data) {
                    razorpayPayment(data, verifyWalletPayment)
                },
                error: function (err) {
                    alert(err.responseJSON?.errMessage ?? 'Something went wrong');
                }
            });
        }
    })



    const imageInput = document.getElementById('image-input-re');
    const imagePicker = document.getElementById('image-picker-re');
    let cropper;
    imageInput?.addEventListener('change', imageChanged);
    imagePicker?.addEventListener('click', () => imageInput.click());


    function imageChanged(element) {
        const image = element?.target?.files[0];
        if (!isImage(image)) return alert('Please select an image');
        const imageUrl = URL.createObjectURL(image);
        let containerDiv = document.createElement('div');
        containerDiv.classList.add('outlined-card', 'm-2', 'center-box-v-24', 'object-fit-contain', 'bg-light', 'rounded-0', 'p-0');
        const newImage = document.createElement('img');
        newImage.src = imageUrl;
        containerDiv.append(newImage);
        cropImageGallery.innerHTML = null;
        cropImageGallery.append(containerDiv);
        cropper = new Cropper(newImage, { aspectRatio: 1, viewMode: 1 });
        popupWindow.style.visibility = 'visible';
        popupWindow.style.opacity = 1;
        // newImage.classList.add('object-fit-contain', 'bg-light', 'w-100', 'h-100', 'rounded-4');
    }

    $('#cCropDone').on('click', (e) => {
        popupWindow.style.opacity = 0;
        popupWindow.style.visibility = 'hidden';
        const imageUrl = cropper.getCroppedCanvas().toDataURL('image/jpg');
        const croppedImage = document.createElement('img');
        croppedImage.src = imageUrl;
        croppedImage.classList.add('object-fit-contain', 'bg-light', 'w-100', 'h-100', 'rounded-4');
        imagePicker.classList.add('bg-light');
        imagePicker.innerHTML = null;
        imagePicker.appendChild(croppedImage);
        cropper = null;
    })
});

function removeAddress(addressId) {
    $.ajax({
        url: '/account/address/remove/' + addressId,
        type: 'DELETE',
        success: function (data) {
            $('#address' + addressId).remove();
        },
        error: function (err) {
            alert(err.responseJSON?.errMessage ?? 'Something went wrong');
        }
    })
}
function razorpayPayment(order, callback) {
    let options = {
        "key": 'rzp_test_yKUJBZ1MBQQioC',
        "amount": order.amount,
        "currency": "INR",
        "name": "Bitkart",
        "image": "/images/bitkart.svg",
        "order_id": order.id,
        "handler": function (response) {
            callback(response, order);
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

function verifyWalletPayment(payment, order) {
    $.ajax({
        url: '/account/wallet/verifyPayment',
        type: 'POST',
        data: {
            payment,
            order
        },
        dataType: 'json',
        success: function (data) {
            document.getElementById('walletBalance').innerText = data.transaction.balance.toLocaleString('en-IN');
            // create table row
            const newRow = document.createElement('tr');
            const dateCell = document.createElement('td');
            const descriptionCell = document.createElement('td');
            const amountCell = document.createElement('td');
            const balanceCell = document.createElement('td');

            dateCell.textContent = data.transaction.date;
            descriptionCell.textContent = data.transaction.description;
            amountCell.textContent = '₹' + data.transaction.amount.toLocaleString('en-IN');
            amountCell.classList.add('text-success', 'fw-bold');
            balanceCell.textContent = '₹' + data.transaction.balance.toLocaleString('en-IN');
            balanceCell.classList.add('text-primary', 'fw-bold');

            // Add data to the table
            const tableBody = document.getElementsByTagName('tbody')[0];
            newRow.append(dateCell, descriptionCell, amountCell, balanceCell)
            tableBody.insertBefore(newRow, tableBody.firstChild);
        },
        error: function (err) {
            alert(err.responseJSON?.errMessage ?? 'Something went wrong');
        }
    });
}