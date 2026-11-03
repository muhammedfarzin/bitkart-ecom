document.addEventListener("DOMContentLoaded", function () {
  const errMessage = $("#err-message");
  document
    .getElementById("addMoneyBtn")
    ?.addEventListener("click", () => $("#addMoneyForm").submit());

  $("#addMoneyForm").submit((e) => {
    e.preventDefault();
    errMessage.text("");
    formData = $("#addMoneyForm").serializeArray();
    let formObject = {};
    $.each(formData, function () {
      const value = this.value.trim();
      if (!value || value < 1) {
        $("#" + this.name).addClass("err");
        errMessage.text("Please enter a valid " + this.name);
      } else $("#" + this.name).removeClass("err");
      formObject[this.name] = value;
    });

    if (!errMessage.text()) {
      $.ajax({
        url: "/account/wallet/addMoney",
        type: "POST",
        data: formObject,
        dataType: "json",
        success: function (data) {
          razorpayPayment(data, verifyWalletPayment);
        },
        error: function (err) {
          showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
        },
      });
    }
  });
});

function razorpayPayment(order, callback) {
  let options = {
    key: "rzp_test_yKUJBZ1MBQQioC",
    amount: order.amount,
    currency: "INR",
    name: "Bitkart",
    image: "/images/bitkart.svg",
    order_id: order.id,
    handler: function (response) {
      callback(response, order);
    },
    theme: {
      color: "#6F43BF",
    },
  };

  let razorpayObject = new Razorpay(options);
  razorpayObject.open();
  razorpayObject.on("payment.failed", function (response) {
    showAlertBox("This step of Payment Failed");
  });
}

function verifyWalletPayment(payment, order) {
  $.ajax({
    url: "/account/wallet/verifyPayment",
    type: "POST",
    data: {
      payment,
      order,
    },
    dataType: "json",
    success: function (data) {
      document.getElementById("walletBalance").innerText =
        data.transaction.balance.toLocaleString("en-IN");
      // create table row
      const newRow = document.createElement("tr");
      const dateCell = document.createElement("td");
      const descriptionCell = document.createElement("td");
      const amountCell = document.createElement("td");
      const balanceCell = document.createElement("td");

      dateCell.textContent = data.transaction.date;
      descriptionCell.textContent = data.transaction.description;
      amountCell.textContent =
        "₹" + data.transaction.amount.toLocaleString("en-IN");
      amountCell.classList.add("text-success", "fw-bold");
      balanceCell.textContent =
        "₹" + data.transaction.balance.toLocaleString("en-IN");
      balanceCell.classList.add("text-primary", "fw-bold");

      // Add data to the table
      const tableBody = document.getElementsByTagName("tbody")[0];
      newRow.append(dateCell, descriptionCell, amountCell, balanceCell);
      tableBody.insertBefore(newRow, tableBody.firstChild);
    },
    error: function (err) {
      showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
    },
  });
}
