function razorpayPayment(order, callback = verifyPayment) {
  const options = {
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

  const razorpayObject = new Razorpay(options);
  razorpayObject.open();
  razorpayObject.on("payment.failed", function (response) {
    showAlertBox("This step of Payment Failed");
  });
}

function verifyPayment(payment, order) {
  App.request({
    url: "/orders/verifyPayment",
    type: "POST",
    data: {
      payment,
      order,
    },
    dataType: "json",
    success: function (data) {
      if (data.orderPlaced) {
        location.href = data.redirect ?? "/";
      } else {
        showAlertBox(data.message, true);
      }
    },
  });
}
