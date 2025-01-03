
type SystemInfo<T extends unknown[]> = {
    readonly system: SystemFn<T>;
    readonly phase: Phase;
    readonly name: string;
    readonly logs: string[];
}


interface Hooks {
    readonly Hooks: {
        readonly SystemAdd: "SystemAdd";
        readonly SystemRemove: "SystemRemove";
        readonly SystemReplace: "SystemReplace";
        readonly SystemError: "SystemError";

        readonly OuterSystemCall: "OuterSystemCall";
        readonly InnerSystemCall: "InnerSystemCall";
        readonly SystemCall: "SystemCall";

        readonly PhaseAdd: "PhaseAdd";
        readonly PhaseBegan: "PhaseBegan";
    }
    systemAdd: <T extends unknown[] = unknown[]>(scheduler: Scheduler<T>, systemInfo: SystemInfo<T>) => void;
    systemRemove: <T extends unknown[] = unknown[]>(scheduler: Scheduler<T>, systemInfo: SystemInfo<T>) => void;
    systemReplace: <T extends unknown[] = unknown[]>(scheduler: Scheduler<T>, oldSystemInfo: SystemInfo<T>, newSystemInfo: SystemInfo<T>) => void;
    systemCall: <T extends unknown[] = unknown[]>(scheduler: Scheduler<T>, hookName: "OuterSystemCall" | "InnerSystemCall" | "SystemCall", systemInfo: SystemInfo<T>, nextFn: () => void) => void;
    systemError: <T extends unknown[] = unknown[]>(scheduler: Scheduler<T>, systemInfo: SystemInfo<T>, error: string) => void;
    phaseAdd: <T extends unknown[] = unknown[]>(scheduler: Scheduler<T>, phase: Phase) => void;
    phaseBegan: <T extends unknown[] = unknown[]>(scheduler: Scheduler<T>, phase: Phase) => void;
}
type SystemAddHookArgs<T extends unknown[]> = {
    scheduler: Scheduler<T>,
    system: SystemInfo<T>
}
type SystemRemoveHookArgs<T extends unknown[]> = SystemAddHookArgs<T>;
type SystemReplaceHookArgs<T extends unknown[]> = {
    scheduler: Scheduler<T>,
    old: SystemInfo<T>,
    new: SystemInfo<T>
}
type SystemErrorHookArgs<T extends unknown[]> = SystemAddHookArgs<T> & { error: string };
type SystemCallHookArgs<T extends unknown[]> = {
    scheduler: undefined;
    system: SystemInfo<T>;
    nextFn: () => void;
}
type PhaseAddHookArgs<T extends unknown[]> = {
    scheduler: Scheduler<T>;
    phase: Phase;
}
type PhaseBeganHookArgs<T extends unknown[]> = PhaseAddHookArgs<T>;
type HookFunctionMap<T extends unknown[] = unknown[]> = {
    SystemAdd: SystemAddHookArgs<T>;
    SystemRemove: SystemRemoveHookArgs<T>;
    SystemReplace: SystemReplaceHookArgs<T>;
    SystemError: SystemErrorHookArgs<T>;
    OuterSystemCall: SystemCallHookArgs<T>;
    InnerSystemCall: SystemCallHookArgs<T>;
    SystemCall: SystemCallHookArgs<T>;
    PhaseAdd: PhaseAddHookArgs<T>;
    PhaseBegan: PhaseBeganHookArgs<T>;
}
// Utility type to get the correct function type based on the hook name
type HookFunctionArgs<K extends keyof HookFunctionMap, T extends unknown[]> = HookFunctionMap<T>[K];

type SystemFn<T extends unknown[]> = ((...args: T) => unknown[]) | ((...args: T) => void);

interface SystemTable<T extends unknown[]> {
    readonly system: SystemFn<T>;
    readonly phase?: Phase
    readonly [key: string]: unknown
}

type System<T extends unknown[]> = SystemFn<T> | SystemTable<T>;

interface EventLike {
    connect(callback: (...args: unknown[]) => void): void;
    Connect(callback: (...args: unknown[]) => void): void;
    on(callback: (...args: unknown[]) => void): void;
    On(callback: (...args: unknown[]) => void): void;
}

type EventInstance = Instance | EventLike;

declare class Phase {
    constructor(debugName?: string)
    static readonly PreStartup: Phase
    static readonly Startup: Phase
    static readonly PostStartup: Phase
    static readonly PreRender: Phase
    static readonly PreAnimation: Phase
    static readonly PreSimulation: Phase
    static readonly PostSimulation: Phase
    static readonly First: Phase
    static readonly PreUpdate: Phase
    static readonly Update: Phase
    static readonly PostUpdate: Phase
    static readonly Last: Phase
}

declare class Pipeline {
    constructor(debugName?: string)
    insert(phase: Phase) : Pipeline
    insertAfter(phase: Phase, after: Phase): Pipeline
    static readonly Main: Pipeline
    static readonly Startup: Pipeline
}

interface Plugin {
    build<T extends unknown[]>(schedular: Scheduler<T>): void
}

export declare class Scheduler<T extends unknown[]> {
    Hooks: Hooks["Hooks"]
    insertAfter(phase: Phase, after: Phase | Pipeline): Scheduler<T>
    insertAfter(pipeline: Pipeline, after: Phase | Pipeline): Scheduler<T>
    insert(phase: Phase): Scheduler<T>
    insert(phase: Pipeline): Scheduler<T>
    insert(phase: Phase, instance: EventInstance | EventLike): Scheduler<T>
    insert(pipeline: Pipeline, instance: EventInstance | EventLike): Scheduler<T>
    runAll(): Scheduler<T>
    run(system: System<T>): Scheduler<T>
    run(phase: Phase): Scheduler<T>
    run(pipeline: Pipeline): Scheduler<T>
    setRunCondition(system: System<T>, fn: (...args: T) => boolean): Scheduler<T>
    setRunCondition(phase: Phase, fn: (...args: T) => boolean): Scheduler<T>
    setRunCondition(pipeline: Pipeline, fn: (...args: T) => boolean): Scheduler<T>
    removeSystem(system: System<T>): Scheduler<T>
    replaceSystem(oldSystem: System<T>, newSystem: System<T>): Scheduler<T>
    editSystem(system: System<T>, phase: Phase): Scheduler<T>
    addSystem(system: System<T>, phase?: Phase): Scheduler<T>
    addPlugin(plugin: Plugin): Scheduler<T>
    /** @hidden */
    _addHook<K extends keyof HookFunctionMap>(hook: K, fn: (info: HookFunctionArgs<K, T>) => void): void
    constructor(...args: T)
}




