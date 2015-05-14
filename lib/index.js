var Tail = require('tail').Tail;
var monitor = require('node-docker-monitor');
var Set = require('collections/fast-set');

function getLogPath(container) {
    return '/var/lib/docker/containers/' + container.Id + '/' + container.Id + '-json.log';
}

function watchLog(container, handler, docker) {
    if (container.tail) {
        container.tail.watch();
    } else {
        tail = new Tail(getLogPath(container));

        tail.on("line", function(line) {
            try {
                var event = JSON.parse(line);
                event.container = container.Name;
                handler(event, container, docker);
            } catch (e){}
        });

        tail.on("error", function(error) {
            console.log('ERROR: ', error);
        });

        container.tail = tail;
    }
}

function unwatchLog(container) {
    if (container.tail) {
        container.tail.unwatch();
    }
}

module.exports = function (containerNames, handler, docker) {
    var watchedContainers = new Set(containerNames);
    monitor({
        onContainerUp: function (container) {
            if (watchedContainers.has(container.Name)) {
                watchLog(container, handler, docker);
            }
        },

        onContainerDown: function (container) {
            if (watchedContainers.has(container.Name)) {
                unwatchLog(container);
            }
        }
    }, docker);
};