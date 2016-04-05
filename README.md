# node-docker-log-monitor

This library is an extention of [node-docker-monitor](https://github.com/Beh01der/node-docker-monitor) It is developed to perform one simple function: monitor logs of running Docker containers (and this way monitor logs of application that run in the containers). This library can be used as more light-weight, performat and reliable replacement of combination of [docker-gen](https://github.com/jwilder/docker-gen) and [fluentd](http://www.fluentd.org/) which is often used for the same purposes.

Diagram below shows daily CPU and RAM usage summary for **log-monit** service based on **node-docker-log-monitor** and **docker-gen+fluentd** based solution performing the same operations.

![daily CPU and RAM usage summary](https://raw.githubusercontent.com/Beh01der/node-docker-log-monitor/master/doc/node-vs-fluentd.png)

## Install
Install locally
```
npm install node-docker-log-monitor
```

## Quick start
Following simple snippet starts monitoring logs of container `nginx` on local host
```javascript
var monitor = require('node-docker-log-monitor');

monitor(['nginx'], function (event) {
    console.log('Log event: ', event);
});
```
It works similar to `tail` command in Unix and will print new log lines as they appended to the log. When defining what containers to monitor, be sure not to include container where monitor runs (if it runs in container) otherwise it may get into infinite loop, monitoring and producing its own logs.

## Extended example
In the example below, we start monitoring nginx (it's running in Docker container 'nginx') access logs. Every new log line is parsed using [node-grok](https://github.com/Beh01der/node-grok) library, then we send events to metrics collector `statsd` based on HTTP Response code. This example can easily be extended by log collecting / analysing / alarming functionality.
```javascript
var monitor = require('node-docker-log-monitor');
var grok = require('node-grok');
require('collections/shim-object');

var empty = {};
grok.loadDefault(function (patterns) {
    console.log('Starting up docker log monitor...');

    var SDC = require('statsd-client'),
        sdc = new SDC({host: '172.17.42.1', port: 8125});

    var logPattern = patterns.createPattern('%{IP:client} \\[%{TIMESTAMP_ISO8601:timestamp}\\] "%{WORD:method}' +
    ' %{URIHOST:site}%{URIPATHPARAM:url}" %{INT:code} %{INT:request} %{INT:response} - %{NUMBER:took}' +
    ' \\[%{DATA:cache}\\] "%{DATA:mtag}" "%{DATA:agent}"');

    monitor(['nginx'], function (event) {
        function logParsed(err, result) {
            if (!err) {
                Object.addEach(event, result || empty);
                var code;
                if (event.code && (code = parseInt(event.code))) {
                    sdc.increment('router.hit');
                    sdc.increment('router.hit.' + (Math.floor(code / 100) * 100));
                }
            }

            console.log(event);
        }

        if (event.log) {
            logPattern.parse(event.log, logParsed);
        } else {
            console.log(event);
        }
    });
}, ['grok-patterns']);
```

## API
* **function(containerNames, handler, [docker])** - starts monitor for containers listed in *containerNames* array. If empty array is provided, all containers will be monitored (except containers that have label "no_log_monitoring=1"). Function *handler* will receive log events (lines). Even handler is a callback `function(event, container, docker)` where *event* - one line of log file, *container* - container [info](https://github.com/Beh01der/node-docker-monitor) and *docker* is Docker [object](https://github.com/apocas/dockerode). Parameter *docker* is a Docker [object](https://github.com/apocas/dockerode) which defines how monitor will connect to Docker service.

## License 
**ISC License (ISC)**

Copyright (c) 2015, Andrey Chausenko <andrey.chausenko@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
