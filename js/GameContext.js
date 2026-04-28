/**
 * GameContext — lightweight dependency injection container with lifecycle management.
 *
 * Solves three problems in main.js:
 *   1. Fragile linear instantiation order (80+ systems in one file)
 *   2. Circular dependency detection at startup instead of runtime
 *   3. No clean re-initialization path for NG+ / save reload
 *
 * Usage:
 *   const ctx = new GameContext();
 *   ctx.register('player', ['scene','world','camera','audio'], (d) => new Player(...));
 *   ctx.initialize();               // topological sort + build
 *   ctx.update(dt);                 // calls .update(dt) on all registered systems
 *   ctx.get('player');              // access any instance
 *   ctx.emit('enemy:killed', data); // cross-system events without closure-wrangling
 *
 * Gradual adoption: existing main.js vars coexist with ctx.get() lookups.
 * Migrate one system at a time by adding its register() call.
 */

const __DEV__ = typeof window !== 'undefined' && window.location.hash === '#dev';

export class GameContext {
    constructor() {
        /** @type {Map<string, {name:string,deps:string[],factory:Function,opts:Object}>} */
        this._registry = new Map();

        /** @type {Map<string, any>} */
        this._instances = new Map();

        /** @type {{name:string,update:Function}[]} */
        this._updateQueue = [];

        /** @type {string} 'registry' | 'initializing' | 'running' */
        this._phase = 'registry';

        /** @type {Array<{name:string,error:string}>} */
        this.errors = [];

        // ── Simple event bus ──────────────────────────────────────────
        /** @type {Map<string, Set<Function>>} */
        this._eventListeners = new Map();

        // Track dependencies for cycle detection
        this._resolveStack = [];
    }

    /* ================================================================ */
    /*  Registration                                                    */
    /* ================================================================ */

    /**
     * Register a system with its dependencies.
     * @param {string}  name       — unique identifier (e.g. 'combatSystem')
     * @param {string[]} deps      — names of systems this one depends on
     * @param {Function} factory   — (deps, ctx) => instance
     * @param {Object}  [opts]     — { singleton:true, lazy:false, optional:[] }
     */
    register(name, deps, factory, opts = {}) {
        if (this._phase !== 'registry') {
            if (__DEV__) console.warn(`GameContext: "${name}" registered after init — deferring.`);
        }
        this._registry.set(name, {
            name,
            deps: deps || [],
            factory,
            opts: {
                singleton: true,
                lazy: false,
                optional: opts.optional || [],
                ...opts,
            },
        });
    }

    /**
     * Check if a name has been registered (not yet instantiated).
     */
    isRegistered(name) {
        return this._registry.has(name);
    }

    /* ================================================================ */
    /*  Initialization — topological sort + build                       */
    /* ================================================================ */

    /**
     * Build all registered systems in dependency order.
     * Throws on first circular dependency.
     */
    initialize() {
        this._phase = 'initializing';
        this.errors = [];

        const sorted = this._topologicalSort();

        for (const name of sorted) {
            const entry = this._registry.get(name);
            if (!entry) continue;

            try {
                this._buildOne(name, entry);
            } catch (e) {
                const msg = `GameContext: "${name}" failed — ${e.message}`;
                this.errors.push({ name, error: e.message });
                if (__DEV__) console.error(msg, e);
            }
        }

        // Call postInit on all instances that have it
        for (const [name, instance] of this._instances) {
            if (instance.postInit && typeof instance.postInit === 'function') {
                try {
                    instance.postInit(this);
                } catch (e) {
                    if (__DEV__) console.warn(`GameContext: "${name}.postInit" threw:`, e);
                }
            }
        }

        this._phase = 'running';
    }

    /**
     * Build a single system: resolve deps, call factory, register update.
     */
    _buildOne(name, entry) {
        if (this._instances.has(name) && entry.opts.singleton) return;

        const depInstances = {};
        for (const dep of entry.deps) {
            const depInstance = this._instances.get(dep);
            if (depInstance !== undefined) {
                depInstances[dep] = depInstance;
            } else if (!entry.opts.optional.includes(dep)) {
                // If dep isn't registered yet, try building it
                const depEntry = this._registry.get(dep);
                if (depEntry) {
                    this._buildOne(dep, depEntry);
                    depInstances[dep] = this._instances.get(dep);
                }
                // Still missing? Only warn if not optional
                if (depInstances[dep] === undefined && !entry.opts.optional.includes(dep)) {
                    throw new Error(`Missing required dependency "${dep}"`);
                }
            }
        }

        const instance = entry.factory(depInstances, this);
        if (instance) {
            this._instances.set(entry.name, instance);

            // Register .update method for the game loop
            if (typeof instance.update === 'function') {
                // Check if it's a per-frame update (takes dt) vs a custom signature
                this._updateQueue.push({
                    name: entry.name,
                    update: instance.update.bind(instance),
                });
            }
        }
    }

    /* ================================================================ */
    /*  Topological sort                                                 */
    /* ================================================================ */

    _topologicalSort() {
        const visited = new Set();
        const stack = new Set();
        const sorted = [];

        const visit = (name) => {
            if (stack.has(name)) {
                throw new Error(`Circular dependency: "${name}" appears in ${[...stack].join(' -> ')} -> ${name}`);
            }
            if (visited.has(name)) return;
            visited.add(name);
            stack.add(name);

            const entry = this._registry.get(name);
            if (entry && entry.deps) {
                for (const dep of entry.deps) {
                    if (this._registry.has(dep)) {
                        visit(dep);
                    }
                }
            }

            stack.delete(name);
            sorted.push(name);
        };

        for (const name of this._registry.keys()) {
            if (!visited.has(name)) visit(name);
        }

        return sorted;
    }

    /* ================================================================ */
    /*  Runtime access                                                  */
    /* ================================================================ */

    /**
     * Get an instantiated system by name.
     * Returns undefined if not registered or not yet built.
     */
    get(name) {
        return this._instances.get(name);
    }

    /**
     * Check if a system has been instantiated.
     */
    has(name) {
        return this._instances.has(name);
    }

    /**
     * Get all instantiated system names.
     */
    keys() {
        return this._instances.keys();
    }

    /**
     * Get all instances (for iteration).
     */
    values() {
        return this._instances.values();
    }

    /* ================================================================ */
    /*  Game loop dispatch                                              */
    /* ================================================================ */

    /**
     * Call .update(dt) on every registered system that has one.
     * Systems are updated in dependency order (parents before children).
     */
    update(dt) {
        for (const { update } of this._updateQueue) {
            try {
                update(dt);
            } catch (e) {
                if (__DEV__) console.error('GameContext.update error:', e);
            }
        }
    }

    /**
     * Get the count of systems that have .update methods.
     */
    getUpdateCount() {
        return this._updateQueue.length;
    }

    /* ================================================================ */
    /*  Event bus — pub/sub for cross-system communication              */
    /* ================================================================ */

    /**
     * Subscribe to an event.
     * @param {string} event
     * @param {Function} callback  (data, ctx) => void
     * @returns {Function} unsubscribe
     */
    on(event, callback) {
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, new Set());
        }
        this._eventListeners.get(event).add(callback);
        return () => this._eventListeners.get(event)?.delete(callback);
    }

    /**
     * Emit an event. All subscribers are called synchronously.
     */
    emit(event, data) {
        const listeners = this._eventListeners.get(event);
        if (!listeners || listeners.size === 0) return;
        for (const cb of listeners) {
            try {
                cb(data, this);
            } catch (e) {
                if (__DEV__) console.warn(`GameContext event "${event}" handler error:`, e);
            }
        }
    }

    /**
     * Remove all listeners for an event.
     */
    clearEvent(event) {
        this._eventListeners.delete(event);
    }

    /* ================================================================ */
    /*  Lifecycle helpers                                               */
    /* ================================================================ */

    /**
     * Dispose all systems that have a .dispose() method.
     * Clears all state so the context can be re-initialized.
     */
    dispose() {
        for (const [name, instance] of this._instances) {
            if (instance.dispose && typeof instance.dispose === 'function') {
                try {
                    instance.dispose();
                } catch (e) {
                    if (__DEV__) console.warn(`GameContext.dispose "${name}":`, e);
                }
            }
        }
        this._instances.clear();
        this._updateQueue = [];
        this._eventListeners.clear();
        this.errors = [];
        this._phase = 'registry';
    }

    /**
     * Re-initialize: dispose everything, then re-build from registry.
     * Safe for NG+ / save reload.
     */
    reinitialize() {
        this.dispose();
        this.initialize();
    }
}
