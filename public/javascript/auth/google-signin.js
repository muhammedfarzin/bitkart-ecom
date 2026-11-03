function onSignIn(response) {
  $.ajax({
    url: "/login/google",
    type: "POST",
    data: response,
    success: function (data) {
      location.replace(data.redirectUrl || "/");
    },
    error: function (err) {
      showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
    },
  });
}

const gSigninBtn = document.getElementById("g-signin-btn");
if (gSigninBtn) {
  const gSigninBtnWidth = gSigninBtn.offsetWidth;
  window.onload = function () {
    const loginURI = new URL(location.href);
    loginURI.pathname = "/login/google";
    google.accounts.id.initialize({
      client_id:
        "455718385134-rdocfgtjr9u9hnicnmkgiu9d781rm36l.apps.googleusercontent.com",
      callback: onSignIn,
    });
    google.accounts.id.renderButton(gSigninBtn, {
      type: "standard",
      use_fedcm_for_prompt: true,
      shape: "circle",
      logo_alignment: "center",
      theme: "outline",
      size: "large",
      width: gSigninBtnWidth,
    });
  };
}
