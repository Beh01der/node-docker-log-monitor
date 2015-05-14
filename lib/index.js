var Tail = require('tail').Tail;
var monitor = require('node-docker-monitor');
var Set = require('collections/fast-set');

function processLogEvent(event) {
    console.log(event);
}

function getLogPath(service) {
    return '/var/lib/docker/containers/' + service.id + '/' + service.id + '-json.log';
}

function watchLog(service) {
    if (service.tail) {
        service.tail.watch();
    } else {
        tail = new Tail(getLogPath(service));

        tail.on("line", function(line) {
            try {
                var event = JSON.parse(line);
                event.container = service.name;
                processLogEvent(event);
            } catch (e){}
        });

        tail.on("error", function(error) {
            console.log('ERROR: ', error);
        });

        service.tail = tail;
    }
}

function unwatchLog(service) {
    if (service.tail) {
        service.tail.unwatch();
    }
}

module.exports = function (containerNames, handler, docker) {
    var watchedContainers = new Set(containerNames);
    monitor({
        onContainerUp: function (container) {
            if (watchedContainers.has(container.Name)) {
                watchLog(container);
            }
        },

        onContainerDown: function (container) {
            if (watchedContainers.has(container.Name)) {
                unwatchLog(container);
            }
        }
    }, docker);
};