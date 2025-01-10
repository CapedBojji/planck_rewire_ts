import Scheduler from "@rbxts/planck/out/Scheduler";
import { Plugin, SystemFn, SystemInfo } from "@rbxts/planck/out/types";
import { Context, HotReloader } from "@rbxts/rewire";

interface ModuleInfo {
	nameToSystem: Map<string, SystemFn<unknown[]>>;
	systemToName: Map<SystemFn<unknown[]>, string>;
}

class PlanckRewirePlugin implements Plugin {
	private readonly folders: Folder[];
	private moduleToSystem: Map<ModuleScript, Array<SystemInfo<unknown[]>>> = new Map();
	private context: { originalModule: ModuleScript, isReloading: boolean, newSystems: Array<SystemInfo<unknown[]>> } | undefined;
	private readonly hotReloader = new HotReloader();
	private schedular: Scheduler<unknown[]> | undefined;

	constructor(folders: Folder[]) {
		this.folders = folders;
		this.moduleToSystem = new Map();
	}


	private reloadSystem(system: SystemInfo<unknown[]>) {
		assert(this.context !== undefined, "Cannot reload a system outside of a reloading context");

		const name = system.name;
		const oldSystem = this.getSystemByName(name);
		if (oldSystem === undefined) {
			// This is a new system
			this.context.newSystems.push(system);
		}
		if (oldSystem !== undefined) {
			// This is an existing system
			this.schedular?.removeSystem(system.system)
			this.schedular?.replaceSystem(oldSystem.system, system.system);
			this.context.newSystems.push(system);
			this.unmarkForCleanup(oldSystem)
		}
	}

	private unmarkForCleanup(system: SystemInfo<unknown[]>) {
		assert(this.context !== undefined, "Cannot unmark a system for cleanup outside of a reloading context");

		const module = this.context.originalModule;
		const systems = this.moduleToSystem.get(module);
		if (systems === undefined) {
			return;
		}
		this.moduleToSystem.set(module, systems.filter(s => s !== system));
	}

	private cleanupModule(module: ModuleScript) {
		const systems = this.moduleToSystem.get(module);
		if (systems === undefined) {
			return;
		}
		systems.forEach(system => {
			this.schedular?.removeSystem(system.system);
		})
	}

	private getSystemByName(name: string): SystemInfo<unknown[]> | undefined {
		// Ensure we are in a reloading context
		if (this.context === undefined) {
			return undefined;
		}
		// Find the system in the original module
		const og = this.context.originalModule
		const systems = this.moduleToSystem.get(og);
		if (systems === undefined) {
			return undefined;
		}

		const system = systems.find(system => system.name === name);
		return system;
	}

	build(schedular: Scheduler<unknown[]>): void {
		this.schedular = schedular;

		schedular._addHook(schedular.Hooks.SystemAdd, (info) => {
			if (this.context === undefined) {
				return;
			}
			if (this.context.isReloading) {
				this.reloadSystem(info.system);
			}
			if (!this.context.isReloading) {
				this.context.newSystems.push(info.system);
			}
		})
		// Load all the modules
		this.folders.forEach(folder => {
			this.hotReloader.scan(folder, (module: ModuleScript, context: Context) => {
				// Set the current module
				this.context = { originalModule: context.originalModule, newSystems: new Array(), isReloading: context.isReloading };
				pcall(() => { require(module) });
				this.cleanupModule(module);
				this.moduleToSystem.set(context.originalModule, this.context.newSystems);
				this.context = undefined;
			}, (module: ModuleScript, context: Context) => {
				if (context.isReloading) return;
				this.cleanupModule(context.originalModule);
				this.moduleToSystem.delete(context.originalModule);
			})
		})
	}
}

export = PlanckRewirePlugin;