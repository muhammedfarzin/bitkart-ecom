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

walletSchema.methods.creditAmount = async function (amount, description) {
    this.balance += amount;
    this.transactions.push({
        amount,
        balance: this.balance,
        description,
        transactionType: transactionTypes.credit
    });
    await this.ownerDocument().save();
}

walletSchema.methods.debitAmount = async function (amount, description) {
    if (amount > this.balance) throw new Error('Insufficient balance');

    this.balance -= amount;
    this.transactions.push({
        amount: -amount,
        balance: this.balance,
        description,
        transactionType: transactionTypes.debit
    });
    await this.ownerDocument().save();
}


export default walletSchema;