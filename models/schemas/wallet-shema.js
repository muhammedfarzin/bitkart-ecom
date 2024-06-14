import moment from "moment";
import { Schema } from "mongoose";

const transactionTypes = {
    debit: 'debit',
    credit: 'credit'
}

const transactinSchema = new Schema({
    amount: {
        type: Number,
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    transactionType: {
        type: String,
        required: true
    },
    transactionId: {
        type: String
    },
    transactionDate: {
        type: Date,
        default: Date.now
    }
});

const walletSchema = new Schema({
    balance: {
        type: Number,
        default: 0
    },
    transactions: [transactinSchema]
});

walletSchema.methods.creditAmount = async function (amount, description, transactionId) {
    this.balance += amount;
    const data = {
        amount,
        balance: this.balance,
        description,
        transactionType: transactionTypes.credit,
        transactionId
    };
    this.transactions.push(data);
    await this.ownerDocument().save();
    data.date = moment(Date.now()).format('MMMM D, YYYY');
    return data;
}

walletSchema.methods.debitAmount = async function (amount, description) {
    if (amount > this.balance) throw new Error('Insufficient balance');

    this.balance -= amount;
    this.transactions.push({
        amount: amount,
        balance: this.balance,
        description,
        transactionType: transactionTypes.debit
    });
    await this.ownerDocument().save();
}


export default walletSchema;