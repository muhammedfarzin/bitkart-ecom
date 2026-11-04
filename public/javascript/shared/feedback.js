const toastAlertBox = document.getElementById("alert-box");
const alertMessage = document.getElementById("alert-message");

function showAlertBox(message, isPrimary) {
  alertMessage.innerText = message;
  const parentDiv = alertMessage.parentElement;
  if (isPrimary) parentDiv.classList.replace("bg-danger", "bg-primary");
  else parentDiv.classList.replace("bg-primary", "bg-danger");

  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastAlertBox);
  toastBootstrap.show();
}

function showConfirmBox(message, callback) {
  document.getElementById("confirm-modal-label").innerText = message;
  document.getElementById("confirm-btn").onclick = () => {
    callback();
    document.getElementById("close-modal-btn").click();
  };
  document.getElementById("show-confirm-modal-btn").click();
}
