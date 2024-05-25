import { Schema } from "mongoose";

const orderPriceSchema = new Schema(
    {
        price: {
            type: Number,
            required: true
        },
        deliveryCharge: {
            type: Number,
            required: true,
        },
        promocodeDiscount: {
            type: Number,
        },
        totalPrice: {
            type: Number
        }
    }
);

orderPriceSchema.pre('save', function (next) {
    this.totalPrice = this.price + this.deliveryCharge - (this.promocodeDiscount || 0);
    next();
});


export default orderPriceSchema;