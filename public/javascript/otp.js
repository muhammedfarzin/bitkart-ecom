document.addEventListener("DOMContentLoaded", () => {
  const resendLink = $("#resend-otp");
  const errorText = $("#err-message");
  const resendDelay = 180;
  let seconds = resendDelay;
  let timerId;

  function renderTimer() {
    const waiting = seconds > 0;
    const minutes = Math.floor(seconds / 60);
    const remainder = String(seconds % 60).padStart(2, "0");
    resendLink.text(waiting ? `Resend OTP (${minutes}:${remainder})` : "Resend OTP");
    resendLink.toggleClass("text-secondary", waiting).toggleClass("text-primary", !waiting);
  }

  function startTimer() {
    clearInterval(timerId);
    seconds = resendDelay;
    renderTimer();
    timerId = setInterval(() => {
      seconds--;
      renderTimer();
      if (seconds <= 0) clearInterval(timerId);
    }, 1000);
  }

  startTimer();
  resendLink.on("click", () => {
    if (seconds > 0) return;
    seconds = resendDelay;
    renderTimer();
    App.request({
      url: "/resendOtp",
      type: "GET",
      dataType: "json",
      success: data => {
        startTimer();
        showAlertBox(data.message ?? "Resent OTP successfully", true);
      },
      error: error => {
        seconds = 0;
        renderTimer();
        App.showRequestError(error);
      },
    });
  });

  $("#otp-frm").submit(event => {
    if (!App.validateSubmit(event)) return;
    event.preventDefault();
    errorText.text("");
    App.request({
      url: "/verifyEmail",
      type: "POST",
      data: App.formData(event.currentTarget),
      dataType: "json",
      success: data => { location.href = data.path ?? "/done"; },
      error: error => {
        const message = App.errorMessage(error);
        if (error.status === 440) location.href = "/login?errMessage=" + encodeURIComponent(message);
        else errorText.text(message);
      },
    });
  });
});
