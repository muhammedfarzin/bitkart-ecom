import { Types } from "mongoose";
import OrderModel, { orderStatus } from "../models/order-model.js";
import UserModel from "../models/user-model.js";
import productController from "./product-controller.js";
import userController from "./user-controller.js";

const minForFreeDelivery = 1000;
const orderStatusList = Object.values(orderStatus);

const orderController = {
    updateCart: async (userId, productId, quantity) => {
        if (quantity) {
            quantity = parseInt(quantity);
            if (isNaN(quantity)) throw new Error('Invalid quantity');
            if (quantity > 10) throw new Error('Sorry, you can only purchase up to 10 units of the same product at a time');
            if (quantity <= 0) {
                return await UserModel.findByIdAndUpdate(
                    userId,
                    { $pull: { cart: { productId } } },
                    { new: true }
                );
            }
        }
        const product = await productController.getProductById(productId);
        productId = product._id;
        const user = await UserModel.findById(userId);
        const cartIndex = user.cart.findIndex(data => data.productId == productId);
        if (product.quantity < (quantity ?? (user.cart[cartIndex]?.quantity + 1))) {
            throw new Error(`Only ${product.quantity} quantity left for this product`);
        }

        if (cartIndex != -1) {
            user.cart[cartIndex].quantity = quantity ?? user.cart[cartIndex].quantity + 1;
        } else {
            user.cart.push({ productId, quantity });
        }
        return await user.save();
    },
    getCartProducts: async (userId) => {
        const cartProducts = (await UserModel.aggregate([
            { $match: { _id: userId } },
            { $project: { _id: 0, cart: 1 } },
            { $unwind: '$cart' },
            { $replaceRoot: { newRoot: '$cart' } },
            { $addFields: { productId: { $toObjectId: '$productId' } } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $addFields: { productDetails: { $arrayElemAt: ['$productDetails', 0] } } }
        ]));
        return cartProducts;
    },
    getPriceSummary: async (userId, datas) => {
        if (!datas) {
            datas = await orderController.getCartProducts(userId);
        }
        let totalPrice = 0;
        let deliveryCharge = datas.length * 100;

        datas.forEach(data => {
            const { price, offerPrice } = data.productDetails;
            totalPrice += (offerPrice ?? price) * data.quantity;
        });
        if (totalPrice >= minForFreeDelivery) deliveryCharge = 0;
        return { totalPrice, deliveryCharge };
    },
    calculateDeliveryCharge: (cartItems) => {
        const totalAmount = cartItems.reduce((sum, item) => {
            const { price, offerPrice } = item.productDetails;
            return sum + (offerPrice || price)
        }, 0);
        if (totalAmount >= minForFreeDelivery) return 0;
        else return cartItems.length * 100;
    },
    placeOrder: async (req) => {
        const userId = req.session.user.userId;
        const { addressId, paymentMethod } = req.body;
        const cartProducts = await orderController.getCartProducts(userId);
        const address = await userController.getAddressById(userId, addressId);
        const deliveryCharge = orderController.calculateDeliveryCharge(cartProducts);
        const status = paymentMethod == 'cod' ? orderStatus.confirmed : orderStatus.pending;

        for (const cartItem of cartProducts) {
            const { productId, quantity } = cartItem;
            const price = {
                price: cartItem.quantity * (cartItem.productDetails.offerPrice || cartItem.productDetails.price),
                deliveryCharge
            }
            const newOrder = new OrderModel({
                address,
                paymentMethod,
                userId,
                productId,
                quantity,
                address,
                price,
                paymentMethod,
                status: { status }
            });
            await newOrder.save();
        };
    },
    clearCart: async (userId) => {
        await UserModel.findByIdAndUpdate(userId, { $set: { cart: [] } });
    },
    getOrders: () => {
        return new Promise(async (resolve, reject) => {
            // const orders = await OrderModel.find().limit(20).sort({ orderedAt: -1 });
            const orders = await OrderModel.aggregate([
                { $sort: { orderedAt: -1 } },
                { $limit: 20 },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                { $addFields: { products: { $arrayElemAt: ['$products', 0] } } }
            ]);
            console.log(orders);
            resolve(orders);
        });
    },
    getOrderById: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {
                orderId = Types.ObjectId.createFromHexString(orderId);
                const order = (await OrderModel.aggregate([
                    { $match: { _id: orderId } },
                    {
                        $lookup: {
                            from: 'products',
                            localField: 'productId',
                            foreignField: '_id',
                            as: 'productData'
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'userInfo'
                        }
                    },
                    {
                        $addFields: {
                            productData: { $arrayElemAt: ['$productData', 0] },
                            userInfo: { $arrayElemAt: ['$userInfo', 0] }
                        }
                    }
                ]))[0];

                if (!order) throw new Error('Invalid order');
                console.log(order);
                resolve(order);
            } catch (err) {
                if (err.name === 'BSONError') {
                    reject(new Error('Invalid Order'));
                } else {
                    console.log(err);
                    reject(err);
                }
            }
        });
    },
    getUserOrders: async (userId) => {
        const orders = await OrderModel.aggregate([
            { $match: { userId } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $addFields: { productDetails: { $arrayElemAt: ['$productDetails', 0] } } },
            { $sort: { orderedAt: -1 } }
        ]);
        return orders;
    },
    getUserOrderDetails: (userId, orderId) => {
        return new Promise(async (resolve, reject) => {
            try {
                orderId = Types.ObjectId.createFromHexString(orderId);
                const order = (await OrderModel.aggregate([
                    { $match: { _id: orderId, userId } },
                    {
                        $lookup: {
                            from: 'products',
                            localField: 'productId',
                            foreignField: '_id',
                            as: 'productDetails'
                        }
                    },
                    { $addFields: { productDetails: { $arrayElemAt: ['$productDetails', 0] } } },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'userDetails'
                        }
                    },
                    { $addFields: { userAddresses: { $arrayElemAt: ['$userDetails.address', 0] } } },
                    { $project: { userDetails: 0 } }
                ]))[0];
                if (!order) reject(new Error('Invalid order'));
                console.log(order);

                resolve(order);
            } catch (err) {
                if (err.name === 'BSONError') {
                    reject(new Error('Invalid Order'));
                } else {
                    console.log(err);
                    reject(err);
                }
            }
        });
    },
    updateStatus: (orderId, newStatus) => {
        return new Promise(async (resolve, reject) => {
            try {
                orderId = Types.ObjectId.createFromHexString(orderId);
                const order = await OrderModel.findById(orderId);
                if (!order) throw new Error('Invalid order');
                if (!orderStatusList.includes(newStatus)) throw new Error('Invalid order status');
                const currentStatus = order.status[order.status.length - 1].status;
                const currentStatusIndex = orderStatusList.findIndex((status) => currentStatus == status);
                const newStatusIndex = orderStatusList.findIndex((status) => newStatus == status);
                if (currentStatusIndex > newStatusIndex) {
                    reject(new Error('You can\'t reverse order status'));
                } else if (newStatusIndex - currentStatusIndex != 1) {
                    reject(new Error('You can\'t skip order status'));
                } else {
                    await order.updateOne({ $push: { status: { status: newStatus } } });
                    resolve({ message: 'Order status updated' });
                }
            } catch (err) {
                if (err.name === 'BSONError') {
                    reject(new Error('Invalid Order'));
                } else {
                    reject(err);
                }
            }
        });
    }
}

export default orderController;