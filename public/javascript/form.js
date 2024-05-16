const mobilePattern = /^\d{10}$/
const otpPattern = /^\d{6}$/

document.addEventListener('DOMContentLoaded', function () {
    const imagesInput = document.getElementById('image-input');
    const imageGallery = document.getElementById('image-gallery');

    if (imagesInput) {
        imagesInput.addEventListener('change', handleImagesSelection);
        document.getElementById('image-picker').addEventListener('click', () => imagesInput.click());
    }

    function handleImagesSelection(event) {
        imageGallery.innerHTML = null;
        const selectedImages = event.target.files;
        if (selectedImages.length > 5) {
            alert('Maximum 5 images are allowed to upload.');
            return
        }

        for (const image of selectedImages) {
            const imageUrl = URL.createObjectURL(image);
            const newImage = document.createElement('img');
            newImage.src = imageUrl;
            newImage.alt = 'Selected Image';
            newImage.classList.add('outlined-card', 'm-2', 'center-box-v-17', 'object-fit-contain', 'bg-light');
            imageGallery.appendChild(newImage);
        }

    }

    $('#login-frm').submit((e) => {
        e.preventDefault();
        let email = $('#email');
        let password = $('#password');
        let errMessage = $('#err-message');

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
        let errMessage = $('#err-message');

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
        } else if (password.val().length < 8) {
            errMessage.text('Password must be atleast 8 characters');
            password.addClass('err');
        } else if (password.val() != confPassword.val()) {
            errMessage.text('Your password and confirm password entries do not match');
            confPassword.addClass('err');
        } else {
            $('#signup-frm')[0].submit();
        }
    });

    $('#otp-frm').submit((e) => {
        e.preventDefault();
        let otp = $('#otp');
        let errMessage = $('#err-message');

        otp.removeClass('err');

        if (!otp.val()) {
            errMessage.text('Please enter OTP');
            otp.addClass('err');
        } else if (!otpPattern.test(otp.val())) {
            errMessage.text('Plesae enter a valid OTP');
        } else {
            $('#otp-frm')[0].submit();
        }
    });
});

const imageInput = document.getElementById('image-input-re');
const imagePicker = document.getElementById('image-picker-re')
imagePicker?.addEventListener('click', () => imageInput.click());

function imageChanged(element) {
    const image = element.files[0];
    const imageUrl = URL.createObjectURL(image);
    const newImage = document.createElement('img');
    newImage.src = imageUrl;
    newImage.alt = 'Selected Image';
    newImage.classList.add('object-fit-contain', 'bg-light', 'w-100', 'h-100', 'rounded-4');
    imagePicker.classList.add('bg-light');
    imagePicker.innerHTML = null;
    imagePicker.appendChild(newImage);
}