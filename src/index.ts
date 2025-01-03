import { Context, HotReloader } from "@rbxts/rewire";
import { Plugin, Scheduler, SystemFn } from "./types";


interface ModuleInfo {
	nameToSystem: Map<string, SystemFn<unknown[]>>;
	systemToName: Map<SystemFn<unknown[]>, string>;
}

class PlanckRewirePlugin implements Plugin {
	private readonly folders: Folder[];
	private readonly moduleToInfo: Map<ModuleScript, ModuleInfo>;
	private currentModule: ModuleScript | undefined;
	private readonly hotReloader = new HotReloader();

	constructor(folders: Folder[]) {
		this.folders = folders;
		this.moduleToInfo = new Map();

	}

	build(schedular: Scheduler<unknown[]>): void {
		schedular._addHook(schedular.Hooks.SystemAdd, (info) => {
			if (this.currentModule === undefined) {
				return;
			}
			const systemInfo = info.system;
			const moduleInfo = this.moduleToInfo.get(this.currentModule);
			if (moduleInfo === undefined) {
				const nameToSystem = new Map<string, SystemFn<unknown[]>>();
				const systemToName = new Map<SystemFn<unknown[]>, string>();
				nameToSystem.set(systemInfo.name, systemInfo.system);
				systemToName.set(systemInfo.system, systemInfo.name);
				this.moduleToInfo.set(this.currentModule, { nameToSystem, systemToName });
				return;
			}
			if (moduleInfo.nameToSystem.has(systemInfo.name)) {
				// Remove the current system
				schedular.removeSystem(systemInfo.system);
				// Replace the old system with the new system
				schedular.replaceSystem(moduleInfo.nameToSystem.get(systemInfo.name)!, systemInfo.system);
			} else {
				// Add the new system
				moduleInfo.nameToSystem.set(systemInfo.name, systemInfo.system);
				moduleInfo.systemToName.set(systemInfo.system, systemInfo.name);
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
					const oldName = moduleInfo.systemToName.get(oldSystemInfo.system)!;
					// Delete the old system
					moduleInfo.systemToName.delete(oldSystemInfo.system);
					// Add the new system with the old name
					moduleInfo.systemToName.set(newSystemInfo.system, oldName);
					// Replace the old system with the new system
					moduleInfo.nameToSystem.set(oldName, newSystemInfo.system);
				}
			})
		})
		// Load all the modules
		this.folders.forEach(folder => {
			folder.GetChildren().forEach(child => {
				if (child.IsA("ModuleScript")) {
					this.hotReloader.listen(child, (module: ModuleScript, context: Context) => {
						// Set the current module
						this.currentModule = module;
						pcall(() => { require(module) });
						this.currentModule = undefined;
					}, (module: ModuleScript, context: Context) => {

					})
				}
			})
		})
	}
}

export = PlanckRewirePlugin;