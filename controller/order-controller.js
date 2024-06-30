import { Types } from "mongoose";
import OrderModel, { orderStatus } from "../models/order-model.js";
import UserModel from "../models/user-model.js";
import productController from "./product-controller.js";
import userController from "./user-controller.js";
import Razorpay from "razorpay";
import ReviewModel from "../models/review-model.js";
import crypto from 'crypto'
import ProductModel from "../models/product-model.js";
import PDFDocument from "pdfkit-table";
import xlsx from 'xlsx';
import couponController from "./coupon-controller.js";
import moment from "moment";

const minForFreeDelivery = 1000;
const orderStatusList = Object.values(orderStatus);
const razorpaySecret = 'BtKsp1TjsaxRftECkAfj99pG';

const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_yKUJBZ1MBQQioC',
    key_secret: razorpaySecret
});

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
            totalPrice += (offerPrice || price) * data.quantity;
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
        const promocode = req.body.promocode?.replace(/\s/, '').toUpperCase();
        const cartProducts = await orderController.getCartProducts(userId);
        const address = await userController.getAddressById(userId, addressId);
        const deliveryCharge = orderController.calculateDeliveryCharge(cartProducts);
        const status = /^(|cod|wallet)$/.test(paymentMethod) ? orderStatus.confirmed : orderStatus.pending;
        const priceDetails = promocode
            ? await couponController.verifyCoupon(userId, promocode)
            : await orderController.getPriceSummary(userId);
        const totalAmount = priceDetails.totalPrice + priceDetails.deliveryCharge - (priceDetails.promocodeDiscount || 0);
        const newOrderIds = [];
        let razorpayResponse;

        if (paymentMethod == 'online') {
            razorpayResponse = await orderController.generateRazorpay(totalAmount);
        } else if (totalAmount > 1000) throw new Error('Cash on delivery is not available for order above ₹1000');

        for (const cartItem of cartProducts) {
            const { productId, quantity, productDetails: { categoryId } } = cartItem;
            let promocodeDiscount;
            if (priceDetails.couponCategoryId && priceDetails.couponCategoryId == categoryId) {
                promocodeDiscount = priceDetails.promocodeDiscount;
            } else promocodeDiscount = priceDetails.promocodeDiscount;

            const price = {
                price: cartItem.quantity * (cartItem.productDetails.offerPrice || cartItem.productDetails.price),
                deliveryCharge,
                promocodeDiscount
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
                status: { status },
                razorpayId: razorpayResponse?.id
            });
            if (paymentMethod == 'wallet') {
                const user = await UserModel.findById(userId);
                const product = await ProductModel.findById(productId);
                const debitAmount = price.price + price.deliveryCharge;
                user.wallet.debitAmount(debitAmount, `Used on order of '${product.title}'`);
            }
            await newOrder.save().then(response => newOrderIds.push(response._id));
        };
        return razorpayResponse
    },
    completeOrderPayment: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const order = await OrderModel.findById(orderId);
                if (!order) reject(new Error('Invalid order'));
                if (order.paymentMethod != 'online') reject(new Error('This is not a prepaid order'));
                let razorpayResponse = await razorpayInstance.orders.fetch(order.razorpayId);
                if (razorpayResponse.status == 'paid') reject(new Error('Payment already completed'));

                if (razorpayResponse.amount != (order.price.totalPrice * 100)) {
                    razorpayResponse = await orderController.generateRazorpay(order.price.totalPrice);
                    order.razorpayId = razorpayResponse.id;
                    await order.save();
                }
                resolve(razorpayResponse);
            } catch (err) {
                if (err.name == 'CastError' && err.kind == 'ObjectId') {
                    reject(new Error(`You entered ${err.model.modelName} is not exist`));
                } else {
                    reject(err);
                }
            }
        });
    },
    clearCart: async (userId) => {
        await UserModel.findByIdAndUpdate(userId, { $set: { cart: [] } });
    },
    getOrders: () => {
        return new Promise(async (resolve, reject) => {
            const orders = await OrderModel.aggregate([
                { $match: { "status.status": { $ne: orderStatus.pending } } },
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
                resolve(order);
            } catch (err) {
                if (err.name === 'BSONError') {
                    reject(new Error('Invalid Order'));
                } else {
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
                            as: 'userAddresses'
                        }
                    },
                    { $addFields: { userAddresses: { $arrayElemAt: ['$userAddresses.address', 0] } } },
                    {
                        $lookup: {
                            from: 'reviews',
                            let: {
                                userId: '$userId',
                                productId: '$productId'
                            },
                            let: {
                                userId: '$userId',
                                productId: '$productId'
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$$userId', '$userId'] },
                                                { $eq: ['$$productId', '$productId'] }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: 'review'
                        }
                    },
                    { $addFields: { review: { $arrayElemAt: ['$review', 0] } } },
                ]))[0];
                if (!order) reject(new Error('Invalid order'));

                resolve(order);
            } catch (err) {
                if (err.name === 'BSONError') {
                    reject(new Error('Invalid Order'));
                } else {
                    reject(err);
                }
            }
        });
    },
    updateStatus: (orderId, newStatus, refundAmount) => {
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
                } else if (newStatusIndex - currentStatusIndex != 1 && newStatus != orderStatus.cancelled) {
                    reject(new Error('You can\'t skip order status'));
                } else if (newStatus == orderStatus.confirmed) {
                    await order.updateOne({ $set: { status: [{ status: newStatus }] } });
                    resolve({ message: 'Order status updated' });
                } else {
                    await order.updateOne({ $push: { status: { status: newStatus } } });
                    if (newStatus == orderStatus.return || (newStatus == orderStatus.cancelled && /^(online|wallet)$/.test(order.paymentMethod))) {
                        const user = await UserModel.findById(order.userId);
                        const product = await ProductModel.findById(order.productId);
                        refundAmount = refundAmount ?? order.price.totalPrice;
                        user.wallet.creditAmount(refundAmount, `Refund of the order of '${product.title}'`);
                    }
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
    },
    returnOrder: (userId, orderId, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                const returnQuantity = parseInt(data.returnQuantity);
                if (isNaN(returnQuantity)) throw new Error('Please enter valid quantity');
                if (!returnQuantity || !data.addressId) throw new Error('Please select quantity and addressId');
                const pickupAddress = await userController.getAddressById(userId, data.addressId);
                const order = await OrderModel.findById(orderId);
                if (!order) throw new Error('Invalid order');
                if (!pickupAddress) throw new Error('Invalid address ID');
                if (returnQuantity > order.quantity) throw new Error('Return quantity is cannot be more than order quantity');

                const returnAmount = (order.price.totalPrice / order.quantity) * returnQuantity;

                await orderController.updateStatus(orderId, orderStatus.return, returnAmount);
                await order.updateOne({ pickupAddress, returnQuantity, returnAmount });
                resolve({ message: 'Return request submitted' });
            } catch (err) {
                if (err.name === 'BSONError') {
                    reject(new Error('Invalid Order'));
                } else {
                    reject(err);
                }
            }
        });
    },
    addReview: async (userId, orderId, data) => {
        const starRating = data.starRating
        const review = data.review;
        const order = await OrderModel.findById(orderId);
        if (!starRating || isNaN(starRating)) throw new Error('Please enter a valid star rating');
        if (!order) throw new Error('Invalid order');

        const productId = order.productId;
        const oldReview = await ReviewModel.findOne({ userId, productId });

        if (oldReview) {
            await oldReview.updateOne({ starRating, review });
            return { message: 'Review updated' }
        } else {
            const reviewData = new ReviewModel({
                userId,
                productId,
                starRating,
                review
            });
            await reviewData.save();
            return { message: 'Review submited' };
        }
    },
    generateRazorpay: (amount) => {
        return new Promise((resolve, reject) => {
            const options = {
                amount: amount * 100,
                currency: 'INR'
            }
            razorpayInstance.orders.create(options)
                .then(response => {
                    resolve(response);
                })
                .catch(err => {
                    reject(err.description);
                });
        });
    },
    verifyPaymentId: (orderId, paymentId, signature) => {
        let hmac = crypto.createHmac('sha256', razorpaySecret);
        hmac.update(orderId + '|' + paymentId);
        hmac = hmac.digest('hex');
        return hmac == signature;
    },
    verifyOrderPayment: (data) => {
        return new Promise(async (resolve, reject) => {
            const { payment: { razorpay_order_id, razorpay_payment_id, razorpay_signature }, order } = data;
            try {
                if (orderController.verifyPaymentId(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
                    const userOrder = await OrderModel.findOne({ razorpayId: order.id });
                    if (!userOrder) reject('Something went wrong. Please try again');
                    await orderController.updateStatus(userOrder._id.toString(), orderStatus.confirmed);
                    resolve({
                        message: 'Your order placed succesfully',
                        orderPlaced: true,
                        redirect: '/orderSuccess'
                    });
                } else {
                    throw new Error('Your payment is failed');
                }
            } catch (err) {
                reject(err);
            }
        });
    },
    getSalesReport: (data) => {
        const { dateFrom, dateTo } = data;
        const duration = data.duration || 'weekly';
        const durations = {
            weekly: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            monthly: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            yearly: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        }
        return new Promise(async (resolve, reject) => {
            try {
                let dateRange;
                if (duration == 'custom') {
                    if (!dateFrom || !dateTo) throw new Error('Please enter a valid date range');
                    dateRange = {
                        $lte: new Date(dateTo),
                        $gte: new Date(dateFrom),
                    }
                } else {
                    dateRange = {
                        $gte: durations[duration],
                        $lte: new Date(),
                    }
                }

                const orders = await OrderModel.aggregate([
                    {
                        $match: {
                            'status.status': { $ne: orderStatus.pending },
                            orderedAt: dateRange
                        }
                    },
                    {
                        $lookup: {
                            from: 'products',
                            localField: 'productId',
                            foreignField: '_id',
                            as: 'productDetails'
                        }
                    },
                    { $addFields: { productDetails: { $arrayElemAt: ['$productDetails', 0] } } },
                ]);

                // Generate the report
                const report = orders.map((order) => {
                    return {
                        orderId: order.orderId,
                        productName: order.productDetails.title,
                        quantity: order.quantity,
                        paymentMethod: order.paymentMethod,
                        price: order.price,
                        status: order.status[order.status.length - 1].status,
                        orderedAt: order.orderedAt
                    };
                });

                // Calculate totals
                let totalCancelledAmount = 0;
                let totalReturnAmount = 0;
                let totalDeliveredAmount = 0;
                let totalOngoingAmount = 0;

                report.forEach((order) => {
                    const status = order.status;
                    const totalPrice = order.price.totalPrice;
                    if (status == orderStatus.cancelled) totalCancelledAmount += totalPrice;
                    else if (status == orderStatus.return) totalReturnAmount += totalPrice;
                    else if (status == orderStatus.delivered) totalDeliveredAmount += totalPrice;
                    else totalOngoingAmount += totalPrice;
                });


                const totalSalesAmount = totalCancelledAmount + totalReturnAmount + totalDeliveredAmount + totalOngoingAmount;
                const totalQuantity = report.reduce((acc, order) => acc + order.quantity, 0);

                // Return the report
                resolve({
                    report,
                    totalSalesAmount,
                    totalCancelledAmount,
                    totalReturnAmount,
                    totalDeliveredAmount,
                    totalOngoingAmount,
                    totalQuantity,
                });
            } catch (err) {
                reject(err);
            }
        });
    },
    getSalesReportPdf: async (data) => {
        try {
            data.duration = data.duration || 'weekly';
            const salesReport = await orderController.getSalesReport(data);
            const { report, totalSalesAmount, totalCancelledAmount, totalReturnAmount, totalDeliveredAmount, totalOngoingAmount, totalQuantity } = salesReport;
            const duration = (data.duration == 'custom') ? `${data.dateFrom} to ${data.dateTo}` : data.duration;

            // Create a new PDF document
            const doc = new PDFDocument({
                margin: 30,
                size: 'A4',
            });

            // Add a title
            doc.font('Helvetica-Bold', 18).text(`Sales Report`, { align: 'center' });
            doc.font('Helvetica', 12).text(`(${duration})`, { align: 'center' }).moveDown();

            // Add the totals
            doc.fontSize(12).text(`Total Sales Amount: ${totalSalesAmount.toLocaleString('en-IN')}`);
            doc.text(`Total Cancelled Amount: ${totalCancelledAmount.toLocaleString('en-IN')}`);
            doc.text(`Total Return Amount: ${totalReturnAmount.toLocaleString('en-IN')}`);
            doc.text(`Total Delivered Amount: ${totalDeliveredAmount.toLocaleString('en-IN')}`);
            doc.text(`Total Ongoing Amount: ${totalOngoingAmount.toLocaleString('en-IN')}`);
            doc.text(`Total Quantity: ${totalQuantity}`);
            doc.moveDown();
            doc.moveDown();

            // Add the report data
            const table = {
                title: "Order Details",
                headers: ["Order ID", "Product Name", "Quantity", "Payment Method", "Price", "Status", "Ordered At"],
                rows: report.map((order) => [
                    order.orderId,
                    order.productName,
                    order.quantity,
                    order.paymentMethod,
                    `${order.price.totalPrice.toFixed(2)}`,
                    order.status,
                    order.orderedAt.toLocaleString(),
                ]),
            };

            doc.table(table, {
                widths: [100, 150, 50, 100, 50, 50, 100],
                columnSpacing: 10,
                margin: 10,
                headerStyle: { bold: true, fontSize: 12 },
                bodyStyle: { fontSize: 12 },
            });

            doc.moveDown();

            // Save the PDF to a file
            const pdfBuffer = await new Promise((resolve, reject) => {
                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', (err) => reject(err));
                doc.end();
            });

            // Return the PDF buffer
            return pdfBuffer;
        } catch (err) {
            throw err;
        }
    },
    getSalesReportExcel: async (data) => {
        try {
            data.duration = data.duration || 'weekly';
            const salesReport = await orderController.getSalesReport(data);
            const { report, totalSalesAmount, totalCancelledAmount, totalReturnAmount, totalDeliveredAmount, totalOngoingAmount, totalQuantity } = salesReport;
            const duration = (data.duration == 'custom') ? `${data.dateFrom} to ${data.dateTo}` : data.duration;

            // Create a new workbook
            const workbook = xlsx.utils.book_new();

            // Create a new worksheet
            const reportWorksheet = xlsx.utils.json_to_sheet([
                {
                    "Total Sales Amount": totalSalesAmount,
                    "Total Cancelled Amount": totalCancelledAmount,
                    "Total Return Amount": totalReturnAmount,
                    "Total Delivered Amount": totalDeliveredAmount,
                    "Total Ongoing Amount": totalOngoingAmount,
                    "Total Quantity": totalQuantity
                }
            ]);
            const orderDetailsWorksheet = xlsx.utils.json_to_sheet(report.map(row => {
                row.orderedAt = row.orderedAt.toString();
                return row;
            }));

            // Add the worksheet to the workbook
            xlsx.utils.book_append_sheet(workbook, reportWorksheet, `Sales Report ${duration}`);
            xlsx.utils.book_append_sheet(workbook, orderDetailsWorksheet, 'Order Details');

            // Generate the Excel file
            const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

            // Return the Excel file as a Buffer
            return excelBuffer;
        } catch (err) {
            throw err;
        }
    },
    generateOrderInvoicePDF: async (userId, orderId) => {
        const orderDetails = await orderController.getUserOrderDetails(userId, orderId);
        const { productDetails, quantity, price, address } = orderDetails;

        // Create a new PDF document
        const doc = new PDFDocument({
            margin: 30,
            size: 'A4'
        });

        // Add a Title
        doc.font('Helvetica-Bold', 18).text('Invoice', { align: 'center' }).moveDown();

        doc.font('Helvetica-Bold', 10).text(`Payment Method: ${orderDetails.paymentMethod.toUpperCase()}`, { align: 'right' });

        doc
            .font('Helvetica', 10)
            .text(`Order ID: ${orderDetails.orderId}`)
            .text(`Ordered at: ${moment(orderDetails.orderedAt).format('MMMM D, YYYY')}`)
            .moveDown();

        // Add customer information
        doc
            .font('Helvetica-Bold', 10)
            .text('Shipping Address:')
            .font('Helvetica', 10)
            .text(`${address.name}`)
            .text(`${address.address}, ${address.locality}`)
            .text(`${address.pincode}, ${address.state}`)
            .text(`Mobile: ${address.mobile}`)
            .moveDown();

        // Add order details table
        const orderDetailsTable = {
            title: 'Order Details',
            headers: ['Item', 'Quantity', 'Price', 'Delivery Charge', 'Discount', 'Total'],
            rows: [
                [
                    productDetails.title,
                    quantity,
                    price.price.toFixed(2),
                    price.deliveryCharge.toFixed(2),
                    price.promocodeDiscount ? '-' + price.promocodeDiscount.toFixed(2) : '',
                    price.totalPrice.toFixed(2)
                ],
                ['Total', '', '', '', '', price.totalPrice.toFixed(2)]
            ],
        };

        await doc.table(orderDetailsTable, {
            width: 500,
            x: 50,
            y: 215,
            padding: { top: 10, bottom: 10, left: 10, right: 10 },
            styles: {
                total: {
                    font: 'Helvetica-Bold',
                    fontSize: 12
                }
            }
        });

        // Save the PDF to a file
        const pdfBuffer = await new Promise((resolve, reject) => {
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));
            doc.end();
        });

        // Return the PDF buffer
        return pdfBuffer;
    }
}

export default orderController;