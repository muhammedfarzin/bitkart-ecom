import hbs from 'express-handlebars'
import moment from 'moment';

const hbsConfig = hbs.create({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: 'views/layouts',
    partialsDir: [
        'views/admin/partials',
        'views/user/partials'
    ],

    helpers: {
        first: function (data) {
            return data[0];
        },
        last: function (data) {
            if (data && data.length > 0) {
                return data[data.length - 1];
            }
            return null;
        },
        eq: function (value1, value2) {
            return value1 == value2;
        },
        isEqual: function (value1, value2, output) {
            if (value1 == value2) return output;
        },
        isEqualElse: function (value1, value2, output, elseOutput) {
            if (value1 == value2) return output;
            else return elseOutput;
        },
        lt: function (a, b, options) {
            if (a < b) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        lte: function (a, b, options) {
            if (a <= b) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        or: function (...datas) {
            const [options, ...values] = datas.reverse();
            if (values.some(value => value)) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        getOfferPecentage: function (total, value) {
            return Math.floor((total - value) * 100 / total);
        },
        repeat: function (count, options) {
            let accum = '';
            for (let i = 1; i <= count; i++) {
                accum += options.fn(i);
            }
            return accum;
        },
        formatDate: function (date, format) {
            return moment(date).format(format);
        },
        formatNumber: function (num) {
            return num.toLocaleString('en-IN');
        },
        sum: function (...nums) {
            nums = nums.slice(0, -1);
            return nums.reduce((sum, num) => sum + num, 0);
        },
        range: function (start, end) {
            const result = [];
            for (let i = start; i <= end; i++) {
                result.push(i);
            }
            return result;
        },
        formatKey: function (key) {
            return key.replace(/([a-z])([A-Z])/g, '$1 $2');
        },
        includes: function (arr, data) {
            return arr.includes(data);
        }
    }
});

export default hbsConfig;