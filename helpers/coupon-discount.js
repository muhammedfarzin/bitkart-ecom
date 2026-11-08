// Orders are saved per cart item. Reserve one rupee on every eligible order.
export function allocateCouponDiscount(cart, coupon) {
  const lines = cart.map((item) => {
    const amount = Math.round(
      (item.productDetails.offerPrice || item.productDetails.price) *
        item.quantity *
        100,
    );
    if (!Number.isSafeInteger(amount) || amount < 100)
      throw new Error("Order amount must be at least ₹1");
    return { id: item.productId.toString(), amount, capacity: amount - 100 };
  });
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const requested =
    coupon.discountType === "percentage"
      ? Math.round((subtotal * coupon.discountValue) / 10000) * 100
      : Math.round(coupon.discountValue * 100);
  const maximum = Math.floor(coupon.maxDiscountAmount * 100);
  if (
    !Number.isSafeInteger(requested) ||
    !Number.isSafeInteger(maximum) ||
    requested < 0 ||
    maximum < 0
  ) {
    throw new Error("Invalid coupon discount");
  }
  let remaining = Math.min(
    requested,
    maximum,
    lines.reduce((sum, line) => sum + line.capacity, 0),
  );
  const total = remaining / 100;
  const items = {};
  for (const line of lines) {
    const discount = Math.min(remaining, line.capacity);
    items[line.id] = discount / 100;
    remaining -= discount;
  }
  return { total, items };
}
