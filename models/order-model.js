import { Schema, Types, model } from "mongoose";
import addressSchema from "./schemas/address-schema.js";
import orderPriceSchema from "./schemas/order-price-schema.js";
import ProductModel from "./product-model.js";

export const orderStatus = {
    pending: 'pending',
    confirmed: 'confirmed',
    shipped: 'shipped',
    delivered: 'delivered',
    return: 'return',
    cancelled: 'cancelled'
}

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: 0,
        unique: true
    },
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
                return /^(online|cod|wallet)$/.test(value);
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
    promocode: {
        type: String
    },
    pickupAddress: {
        type: addressSchema
    },
    returnQuantity: {
        type: Number,
        min: 0,
        max: 10
    },
    returnAmount: Number,
    razorpayId: String,
    orderedAt: {
        type: Date,
        default: Date.now
    }
});

orderSchema.pre('save', async function (next) {
    const product = await ProductModel.findById(this.productId);
    if (product.quantity < this.quantity) throw new Error(`Only ${product.quantity} quantity left for this product`);

    const maxOrderId = await OrderModel.countDocuments();
    this.orderId = Date.now().toString() + maxOrderId;
    console.log(this.orderId, Date.now().toString() + maxOrderId + 1)

    next();
});

orderSchema.post('save', async function (data, next) {
    await ProductModel.findOneAndUpdate({ _id: data.productId }, { $inc: { quantity: -data.quantity } });
    next();
});

const OrderModel = model('order', orderSchema, 'orders');


export default OrderModel;