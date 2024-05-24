import { Schema, Types, model } from "mongoose";
import addressSchema from "./schemas/address-schema.js";
import orderPriceSchema from "./schemas/order-price-schema.js";
import ProductModel from "./product-model.js";

export const orderStatus = {
    pending: 'pending',
    confirmed: 'confirmed',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled'
}

const orderSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        required: true
    },
    productId: {
        type: Types.ObjectId,
        required: true,
    },
    quantity: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return /^(online|cod)$/.test(value);
            },
            message: 'Payment method must be either "online" or "cod"'
        }
    },
    price: {
        type: orderPriceSchema,
        required: true
    },
    address: {
        type: addressSchema,
        required: true
    },
    status: {
        type: [
            {
                status: {
                    type: String,
                    required: true,
                },
                date: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        required: true,
    },
    review: {
        type: Types.ObjectId
    },
    promocode: {
        type: String
    },
    orderedAt: {
        type: Date,
        default: Date.now
    }
});

orderSchema.pre('save', async function (next) {
    const product = await ProductModel.findById(this.productId);
    if (product.quantity < this.quantity) throw new Error(`Only ${product.quantity} quantity left for this product`);
    else next();
});

orderSchema.post('save', async function (data, next) {
    await ProductModel.findOneAndUpdate({ _id: data.productId }, { $inc: { quantity: -data.quantity } });
    next();
});

const OrderModel = model('order', orderSchema, 'orders');


export default OrderModel;