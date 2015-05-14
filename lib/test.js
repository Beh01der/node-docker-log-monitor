var monitor = require('./index');

monitor(['nginx'], function (event) {
    console.log('Log event: ', event);
});