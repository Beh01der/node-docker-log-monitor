var fs = require('fs');
var Tail = require('tail').Tail;
var monitor = require('node-docker-monitor');

module.exports = function (handler, dockerOpts, opts) {
    monitor({
        onContainerUp: function (container) {
            watchLog(container, handler, dockerOpts);
        },

        onContainerDown: function (container) {
            unwatchLog(container);
        }
    }, dockerOpts, opts);
};

function getLogPath(container) {
    return '/var/lib/docker/containers/' + container.Id + '/' + container.Id + '-json.log';
}

function watchLog(container, handler, docker) {
    var logFile = getLogPath(container);
    if (container.tail) {
        if (!container.tail.isWatching) {
            container.tail.watch();
        }
    } else {
        if (fs.existsSync(logFile)) {
            try {
                container.tail = new Tail(logFile, { follow: false, fromBeginning: !!container.errorLogTailing });
                container.errorLogTailing = false;

                container.tail.on("line", function (line) {
                    try {
                        var event = JSON.parse(line);
                        event.container = container.Name;
                        handler(event, container, docker);
                    } catch (e) {
                    }
                });

                container.tail.on("error", function (error) {
                    handleError(container, handler, docker, error);
                });
            } catch (e) {
                handleError(container, handler, docker, e);
            }
        } else {
            handleError(container, handler, docker, 'File is missing');
        }
    }
}

function handleError(container, handler, docker, error) {
    if (container.tail) {
        container.tail.unwatch();
        container.tail = null;
    }

    if (!container.errorLogTailing) {
        container.errorLogTailing = true;
        console.log('Error while tailing file for container', container.Name, error);
    }

    // retry
    setTimeout(function () {
        watchLog(container, handler, docker);
    }, 1000);
}

function unwatchLog(container) {
    if (container.tail) {
        container.tail.unwatch();
    }
}