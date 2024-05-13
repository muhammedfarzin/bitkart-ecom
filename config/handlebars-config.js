import hbs from 'express-handlebars'

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
        isEqual: function (value1, value2, output) {
            if (value1 == value2) return output;
        },
        isEqualElse: function (value1, value2, output, elseOutput) {
            if (value1 == value2) return output;
            else return elseOutput;
        },
        getOfferPecentage: function (total, value) {
            return Math.floor((total - value) * 100 / total);
        }
    }
});

export default hbsConfig;