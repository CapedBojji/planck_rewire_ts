# @rbxts/planck-rewire

A plugin for the Planck ECS framework in Roblox TypeScript. This plugin enables hot-reloading of systems by dynamically reloading system folders, making development faster and more efficient.

## Installation

Install the package via `npm`:

```sh
npm install @rbxts/planck-rewire
```

Or using `pnpm`:

```sh
pnpm add @rbxts/planck-rewire
```

## Usage

### Setting Up the Scheduler

In your `scheduler.ts` file, configure and initialize the scheduler with the necessary plugins:

```ts
import { Scheduler } from '@rbxts/planck';
import PlanckRewirePlugin from '@rbxts/planck-rewire';

export const scheduler = new Scheduler();

export function hotReload(systemRoots: Array<Folder>) {
  const rewirePlugin = new PlanckRewirePlugin(systemRoots);
  scheduler.addPlugin(rewirePlugin);
}
```

### Hot Reloading Systems

To enable hot reloading of systems, call the `hotReload` function in your client code:

```ts
import { hotReload } from "shared/scheduler";

hotReload([ReplicatedStorage.WaitForChild("TS").WaitForChild("systems") as Folder]);
```

In this example, the systems are located in the `ReplicatedStorage/TS/systems` folder. **Ensure that the systems are not required beforehand**. The plugin will handle loading the systems dynamically at runtime. Requiring them manually before passing them to the plugin may cause unexpected behavior.

## How It Works

- The `PlanckRewirePlugin` hooks into the Planck scheduler, listening for changes in the specified system folders.
- When a change is detected, the affected systems are reloaded dynamically, improving iteration speed during development.

## Why Use Planck Rewire?
- **Faster Iteration** – No need to restart the server after every code change.
- **Modular** – Easily integrates with Planck ECS.
- **Simple Setup** – Minimal configuration required.

## Requirements
- Roblox TypeScript (`rbxts`)
- Planck ECS framework (`@rbxts/planck`)

## License

MIT License. See `LICENSE` for details.

---

If you encounter any issues or have feature requests, feel free to open an issue on the GitHub repository.

