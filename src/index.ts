import { Plugin, Scheduler, SystemFn } from "@rbxts/planck/out/types";
import { Context, HotReloader } from "@rbxts/rewire";

interface ModuleInfo {
	nameToSystem: Map<string, SystemFn<unknown[]>>;
	systemToName: Map<SystemFn<unknown[]>, string>;
}

class PlanckRewirePlugin implements Plugin {
	private readonly folders: Folder[];
	private readonly moduleToInfo: Map<ModuleScript, ModuleInfo>;
	private currentModule: { old: ModuleScript, new: ModuleScript } | undefined;
	private readonly hotReloader = new HotReloader();

	constructor(folders: Folder[]) {
		this.folders = folders;
		this.moduleToInfo = new Map();
	}

	private cleanupModule(module: ModuleScript) {
		const moduleInfo = this.moduleToInfo.get(module);
		if (moduleInfo === undefined) return;
		moduleInfo.nameToSystem.forEach((system, name) => {
			// Remove the system
			this.moduleToInfo.forEach((moduleInfo) => {
				if (moduleInfo.systemToName.has(system)) {
					moduleInfo.systemToName.delete(system);
					moduleInfo.nameToSystem.delete(name);
				}
			})
		})
	}


	build(schedular: Scheduler<unknown[]>): void {
		schedular._addHook(schedular.Hooks.SystemAdd, (info) => {
			if (this.currentModule === undefined) {
				return;
			}
			const systemInfo = info.system;
			const currentSystemName = systemInfo.name;
			const isReloading = this.currentModule.old !== this.currentModule.new;
			if (isReloading) {
				const oldModuleInfo = this.moduleToInfo.get(this.currentModule.old);
				assert(oldModuleInfo !== undefined, "Old module info is undefined"); // This should never happen
				// Check if the new system is in the old module
				// If it is	, remove the old system
				if (oldModuleInfo.nameToSystem.has(currentSystemName)) {
					const oldSystem = oldModuleInfo.nameToSystem.get(currentSystemName)!;
					schedular.removeSystem(oldSystem);
				}
			}
			// Add the system to the module
			if (!this.moduleToInfo.has(this.currentModule.new)) {
				const nameToSystem = new Map<string, SystemFn<unknown[]>>();
				const systemToName = new Map<SystemFn<unknown[]>, string>();
				nameToSystem.set(systemInfo.name, systemInfo.system);
				systemToName.set(systemInfo.system, systemInfo.name);
				this.moduleToInfo.set(this.currentModule.new, { nameToSystem, systemToName });
			}
		})
		schedular._addHook(schedular.Hooks.SystemRemove, (info) => {
			const systemInfo = info.system;
			// Find the module that the system is in
			this.moduleToInfo.forEach((moduleInfo, module) => {
				if (moduleInfo.systemToName.has(systemInfo.system)) {
					// Update the maps
					moduleInfo.systemToName.delete(systemInfo.system);
					moduleInfo.nameToSystem.delete(systemInfo.name);
				}
			})
		})
		schedular._addHook(schedular.Hooks.SystemReplace, (info) => {
			const [oldSystemInfo, newSystemInfo] = [info.old, info.new];
			// Find the module that the old system is in
			this.moduleToInfo.forEach((moduleInfo, module) => {
				if (moduleInfo.systemToName.has(oldSystemInfo.system)) {
					const oldName = oldSystemInfo.name;
					const newName = newSystemInfo.name;
					// Delete the old system
					moduleInfo.systemToName.delete(oldSystemInfo.system);
					moduleInfo.nameToSystem.delete(oldName);
					// Add the new system with the old name
					moduleInfo.systemToName.set(newSystemInfo.system, newName);
					moduleInfo.nameToSystem.set(newName, newSystemInfo.system);
				}
			})
		})
		// Load all the modules
		this.folders.forEach(folder => {
			this.hotReloader.scan(folder, (module: ModuleScript, context: Context) => {
				// Set the current module
				this.currentModule = { old: context.originalModule, new: module };
				pcall(() => { require(module) });
				this.currentModule = undefined;
				if (context.isReloading)
					this.cleanupModule(context.originalModule);
			}, (module: ModuleScript, context: Context) => {
				if (context.isReloading) return;
				this.cleanupModule(module);
			})
		})
	}
}

export = PlanckRewirePlugin;