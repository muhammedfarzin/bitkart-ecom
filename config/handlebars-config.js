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
        firstImagePath: function (imagePaths) {
            return imagePaths[0];
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
        }
    }
});

export default hbsConfig;