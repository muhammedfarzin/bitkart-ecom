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
    },
    {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
);

orderPriceSchema.virtual('totalAmount').get(function () {
    return this.price + this.deliveryCharge - (this.promocodeDiscount || 0);
});


export default orderPriceSchema;