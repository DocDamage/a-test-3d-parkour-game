/**
 * Shared lifecycle adapters for systems that predate a common update signature.
 *
 * New systems should prefer update(dt, context), but this adapter keeps legacy
 * update(dt, player), update(dt, input), and update(dt, player, world, ...)
 * modules centralized while they are migrated.
 */
export function updateLifecycle(system, context, args = ['dt']) {
  if (!system || typeof system.update !== 'function') return undefined;
  return system.update(...args.map(arg => resolveLifecycleArg(arg, context)));
}

export function disposeLifecycle(system) {
  if (!system) return undefined;
  if (typeof system.dispose === 'function') return system.dispose();
  if (typeof system.cleanup === 'function') return system.cleanup();
  return undefined;
}

function resolveLifecycleArg(arg, context) {
  if (typeof arg === 'function') return arg(context);
  if (arg === 'dt') return context.dt;
  return context[arg];
}
