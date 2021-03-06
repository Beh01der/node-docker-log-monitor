interface Container {
    inspect(opts, callback: { (err, data) });
    rename(opts, callback: { (err, data) });
    update(opts, callback: { (err, data) });
    top(opts, callback: { (err, data) });
    start(opts, callback: { (err, data) });
    pause(opts, callback: { (err, data) });
    unpause(opts, callback: { (err, data) });
    exec(opts, callback: { (err, data) });
    commit(opts, callback: { (err, data) });
    stop(opts, callback: { (err, data) });
    restart(opts, callback: { (err, data) });
    kill(opts, callback: { (err, data) });
    resize(opts, callback: { (err, data) });
    attach(opts, callback: { (err, data) });
    remove(opts, callback: { (err, data) });
    copy(opts, callback: { (err, data) });
    logs(opts, callback: { (err, data) });
    stats(opts, callback: { (err, data) });
    wait(callback: { (err, data) });
    changes(callback: { (err, data) });
}

interface Dockerode {
    listContainers(callback: { (err, list: ContainerInfo[]) });
    getContainer(id: string): Container;
    createContainer(opts, callback: { (err, container: Container) });
}

interface DockerodeOptions {
    socketPath?: string;
    host?: string;
    port?: number;
    protocol?: string;
}

interface PortInfo {
    IP: string;
    PrivatePort: number;
    PublicPort: number;
    Type: string;
}

interface HostConfigInfo {
    NetworkMode: string;
}

interface ContainerInfo {
    Id: string;
    Name: string;
    Image: string;
    Names: string[];
    Command: string;
    Created: number;
    HostConfig: HostConfigInfo;
    Labels: any;
    Ports: PortInfo[];
    Status: string;
}

interface LogEvent {
    log: string;        // log string
    stream: string;     // stream name (stdout)
    time: string;       // event time (ISO)
    container: string;  // Docker contanier name
}

interface Options {
    strategy?: 'monitorSelected' | 'monitorAll';
    selectorLabel?: string;
}

interface EventHandler {
    (event: LogEvent, info?: ContainerInfo, docker?: Dockerode);
}

interface MonitorFunction {
    (handler: EventHandler, dockerOpts?: DockerodeOptions | Dockerode, opts?: Options /* { strategy: 'monitorAll', selectorLabel: 'node-docker-monitor' } */)
}

declare let monitorFunction: MonitorFunction;

export = monitorFunction;