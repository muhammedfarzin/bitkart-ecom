const otpPattern = /^\d{6}$/;

document.addEventListener('DOMContentLoaded', function () {
    const resendOtpText = $('#resendOtp');

    // OTP timer
    let duration = 180; // 3 minute
    let seconds = duration;
    startTimer();

    resendOtpText.on('click', (e) => {
        if (seconds > 0) return;
        seconds = duration;
        resendOtpText.addClass('text-secondary');
        resendOtpText.removeClass('text-primary');
        $.ajax({
            url: '/resendOtp',
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                startTimer();
                showAlertBox(data.responseJSON?.message ?? 'Resent OTP successfully', true);
            },
            error: function (err) {
                seconds = 0;
                resendOtpText.addClass('text-primary');
                resendOtpText.removeClass('text-secondary');
                showAlertBox(err.responseJSON?.errMessage ?? 'Something went wrong');
            }
        });
    });

    $('#otp-frm').submit((e) => {
        e.preventDefault();
        let otp = $('#otp');
        let errMessageText = $('#err-message');

        errMessageText.text('');
        otp.removeClass('err');

        if (!otp.val()) {
            errMessageText.text('Please enter OTP');
            otp.addClass('err');
        } else if (!otpPattern.test(otp.val())) {
            errMessageText.text('Plesae enter a valid OTP');
        } else {
            $.ajax({
                url: '/verifyEmail',
                type: 'POST',
                data: { otp: otp.val() },
                dataType: 'json',
                success: function (data) {
                    location.href = data.path ?? '/done';
                },
                error: function (err) {
                    const errMessage = err.responseJSON?.errMessage ?? 'Something went wrong';
                    if (err.status == 440) location.href = '/login?errMessage=' + errMessage;
                    else errMessageText.text(errMessage);
                }
            });
        }
    });


    function startTimer() {
        timerId = setInterval(() => {
            let minutes = Math.floor(seconds / 60);
            let remainingSeconds = seconds % 60;

            if (seconds <= 0) {
                clearInterval(timerId);
                resendOtpText.text('Resend OTP');
                resendOtpText.addClass('text-primary');
                resendOtpText.removeClass('text-secondary');
            } else {
                let displaySeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;
                resendOtpText.text(`Resend OTP (${minutes}:${displaySeconds})`);
                resendOtpText.addClass('text-secondary');
                resendOtpText.removeClass('text-primary');
                seconds--;
            }
        }, 1000);
    }
});