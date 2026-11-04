document.addEventListener("DOMContentLoaded", () => {
  $("#add-money-btn").on("click", () => $("#add-money-frm").submit());
  $("#add-money-frm").submit(event => {
    if (!App.validateSubmit(event)) return;
    event.preventDefault();
    $("#err-message").text("");
    App.request({
      url: "/account/wallet/addMoney",
      type: "POST",
      data: App.formData(event.currentTarget),
      dataType: "json",
      success: order => razorpayPayment(order, verifyWalletPayment),
    });
  });
});

function verifyWalletPayment(payment, order) {
  App.request({
    url: "/account/wallet/verifyPayment",
    type: "POST",
    data: {
      payment,
      order,
    },
    dataType: "json",
    success: function (data) {
      document.getElementById("wallet-balance").innerText =
        data.transaction.balance.toLocaleString("en-IN");
      const { date, description, amount, balance } = data.transaction;
      const row = document.createElement("tr");
      const cells = [
        [date, ""],
        [description, ""],
        [App.formatCurrency(amount), "text-success fw-bold"],
        [App.formatCurrency(balance), "text-primary fw-bold"],
      ];
      for (const [text, className] of cells) {
        const cell = document.createElement("td");
        cell.textContent = text;
        cell.className = className;
        row.append(cell);
      }
      document.querySelector("tbody").prepend(row);
    },
  });
}
