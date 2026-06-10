StateManager.js
/**
 * RUBRO - stateManager.js
 * --------------------------------------------------------
 * Centralized state orchestration system.
 * Responsible for:
 * - state lifecycle
 * - transitions
 * - overlays
 * - locks
 * - transition guards
 * - history tracking
 * - persistence hooks
 * - render invalidation
 * - event synchronization
 * --------------------------------------------------------
 */

import eventBus from "./eventBus.js";

const INTERNAL_EVENTS = Object.freeze({
  STATE_REGISTERED: "state:registered",
  STATE_UNREGISTERED: "state:unregistered",
  STATE_CHANGED: "state:changed",
  STATE_PUSHED: "state:pushed",
  STATE_POPPED: "state:popped",
  STATE_LOCKED: "state:locked",
  STATE_UNLOCKED: "state:unlocked",
  OVERLAY_ADDED: "overlay:added",
  OVERLAY_REMOVED: "overlay:removed",
  RENDER_INVALIDATED: "render:invalidate",
});

class StateManager {
  constructor() {
    this.states = new Map();

    this.currentState = null;

    /**
     * Navigation stack.
     * Contains unique transition history,
     * not duplicate transition records.
     */
    this.stateStack = [];

    this.overlays = new Map();

    this.transitionHistory = [];

    this.transitionGuards = new Set();

    this.locks = new Set();

    this.persistenceHooks = new Map();

    this.transitionInProgress = false;

    this.debug = false;
  }

  /**
   * --------------------------------------------------------
   * Registration
   * --------------------------------------------------------
   */

  registerState(stateId, config = {}) {
    if (!stateId || typeof stateId !== "string") {
      throw new Error("Invalid stateId.");
    }

    if (this.states.has(stateId)) {
      throw new Error(`State already registered: ${stateId}`);
    }

    const state = {
      id: stateId,
      onEnter:
        typeof config.onEnter === "function"
          ? config.onEnter
          : null,

      onExit:
        typeof config.onExit === "function"
          ? config.onExit
          : null,

      onUpdate:
        typeof config.onUpdate === "function"
          ? config.onUpdate
          : null,

      metadata: config.metadata || {},

      persistent: Boolean(config.persistent),
    };

    this.states.set(stateId, state);

    eventBus.emit(INTERNAL_EVENTS.STATE_REGISTERED, {
      stateId,
    });

    this.#log(`Registered state: ${stateId}`);
  }

  unregisterState(stateId) {
    if (!this.states.has(stateId)) {
      return;
    }

    if (this.currentState?.id === stateId) {
      throw new Error(
        `Cannot unregister active state: ${stateId}`
      );
    }

    this.states.delete(stateId);

    eventBus.emit(INTERNAL_EVENTS.STATE_UNREGISTERED, {
      stateId,
    });

    this.#log(`Unregistered state: ${stateId}`);
  }

  /**
   * --------------------------------------------------------
   * State Transitions
   * --------------------------------------------------------
   */

  async transitionTo(stateId, payload = {}) {
    if (this.transitionInProgress) {
      this.#log(
        `Transition blocked. Another transition is active.`
      );
      return false;
    }

    if (this.isLocked()) {
      this.#log(`Transition blocked by lock.`);
      return false;
    }

    const targetState = this.states.get(stateId);

    if (!targetState) {
      throw new Error(`Unknown state: ${stateId}`);
    }

    const currentStateId = this.currentState?.id || null;

    if (currentStateId === stateId) {
      return true;
    }

    const transitionContext = {
      from: currentStateId,
      to: stateId,
      payload,
      timestamp: Date.now(),
    };

    const allowed =
      await this.#runTransitionGuards(transitionContext);

    if (!allowed) {
      this.#log(`Transition denied: ${stateId}`);
      return false;
    }

    this.transitionInProgress = true;

    try {
      await this.#exitCurrentState();

      this.currentState = targetState;

      this.transitionHistory.push(transitionContext);

      if (typeof targetState.onEnter === "function") {
        await targetState.onEnter(payload);
      }

      this.invalidateRender();

      eventBus.emit(
        INTERNAL_EVENTS.STATE_CHANGED,
        transitionContext
      );

      this.#log(`Transitioned to: ${stateId}`);

      return true;
    } finally {
      this.transitionInProgress = false;
    }
  }

  async #exitCurrentState() {
    if (!this.currentState) {
      return;
    }

    const previousState = this.currentState;

    try {
      if (typeof previousState.onExit === "function") {
        await previousState.onExit();
      }
    } finally {
      this.currentState = null;
    }

    this.invalidateRender();
  }

  /**
   * --------------------------------------------------------
   * Stack Management
   * --------------------------------------------------------
   */

  async pushState(stateId, payload = {}) {
    const currentStateId = this.currentState?.id || null;

    if (currentStateId) {
      this.stateStack.push(currentStateId);
    }

    const success = await this.transitionTo(
      stateId,
      payload
    );

    if (!success && currentStateId) {
      this.stateStack.pop();
      return false;
    }

    eventBus.emit(INTERNAL_EVENTS.STATE_PUSHED, {
      stateId,
      payload,
    });

    return true;
  }

  async popState() {
    if (this.stateStack.length === 0) {
      return false;
    }

    const previousStateId = this.stateStack.pop();

    const success = await this.transitionTo(
      previousStateId
    );

    if (!success) {
      this.stateStack.push(previousStateId);
      return false;
    }

    eventBus.emit(INTERNAL_EVENTS.STATE_POPPED, {
      stateId: previousStateId,
    });

    return true;
  }

  getCurrentState() {
    return this.currentState;
  }

  getCurrentStateId() {
    return this.currentState?.id || null;
  }

  getStateStack() {
    return [...this.stateStack];
  }

  getTransitionHistory() {
    return [...this.transitionHistory];
  }

  /**
   * --------------------------------------------------------
   * Overlays
   * --------------------------------------------------------
   */

  addOverlay(overlayId, data = {}) {
    if (!overlayId) {
      throw new Error("Invalid overlayId.");
    }

    if (this.overlays.has(overlayId)) {
      return false;
    }

    this.overlays.set(overlayId, {
      id: overlayId,
      data,
      createdAt: Date.now(),
    });

    this.invalidateRender();

    eventBus.emit(INTERNAL_EVENTS.OVERLAY_ADDED, {
      overlayId,
      data,
    });

    return true;
  }

  removeOverlay(overlayId) {
    if (!this.overlays.has(overlayId)) {
      return false;
    }

    this.overlays.delete(overlayId);

    this.invalidateRender();

    eventBus.emit(INTERNAL_EVENTS.OVERLAY_REMOVED, {
      overlayId,
    });

    return true;
  }

  hasOverlay(overlayId) {
    return this.overlays.has(overlayId);
  }

  getOverlays() {
    return [...this.overlays.values()];
  }

  /**
   * --------------------------------------------------------
   * Locks
   * --------------------------------------------------------
   */

  lock(lockId) {
    if (!lockId) {
      throw new Error("Invalid lockId.");
    }

    this.locks.add(lockId);

    eventBus.emit(INTERNAL_EVENTS.STATE_LOCKED, {
      lockId,
    });
  }

  unlock(lockId) {
    if (!this.locks.has(lockId)) {
      return false;
    }

    this.locks.delete(lockId);

    eventBus.emit(INTERNAL_EVENTS.STATE_UNLOCKED, {
      lockId,
    });

    return true;
  }

  isLocked() {
    return this.locks.size > 0;
  }

  hasLock(lockId) {
    return this.locks.has(lockId);
  }

  getLocks() {
    return [...this.locks];
  }

  /**
   * --------------------------------------------------------
   * Transition Guards
   * --------------------------------------------------------
   */

  addTransitionGuard(guard) {
    if (typeof guard !== "function") {
      throw new Error(
        "Transition guard must be a function."
      );
    }

    this.transitionGuards.add(guard);
  }

  removeTransitionGuard(guard) {
    this.transitionGuards.delete(guard);
  }

  async #runTransitionGuards(context) {
    for (const guard of this.transitionGuards) {
      try {
        const result = await guard(context);

        if (result === false) {
          return false;
        }
      } catch (error) {
        console.error(
          "[StateManager] Guard execution failed:",
          error
        );

        return false;
      }
    }

    return true;
  }

  /**
   * --------------------------------------------------------
   * Persistence
   * --------------------------------------------------------
   */

  registerPersistenceHook(stateId, hook) {
    if (!this.states.has(stateId)) {
      throw new Error(
        `Cannot register persistence hook. Unknown state: ${stateId}`
      );
    }

    if (typeof hook !== "function") {
      throw new Error(
        "Persistence hook must be a function."
      );
    }

    this.persistenceHooks.set(stateId, hook);
  }

  async persistState(stateId) {
    const hook = this.persistenceHooks.get(stateId);

    if (!hook) {
      return null;
    }

    try {
      return await hook();
    } catch (error) {
      console.error(
        `[StateManager] Persistence failed for ${stateId}`,
        error
      );

      return null;
    }
  }

  /**
   * --------------------------------------------------------
   * Render Invalidation
   * --------------------------------------------------------
   */

  invalidateRender() {
    eventBus.emit(
      INTERNAL_EVENTS.RENDER_INVALIDATED,
      {
        currentState: this.currentState?.id || null,
        overlays: this.getOverlays(),
      }
    );
  }

  /**
   * --------------------------------------------------------
   * Event Synchronization
   * --------------------------------------------------------
   */

  subscribe(eventName, listener) {
    return eventBus.on(eventName, listener);
  }

  unsubscribe(eventName, listener) {
    return eventBus.off(eventName, listener);
  }

  emit(eventName, payload = {}) {
    return eventBus.emit(eventName, payload);
  }

  /**
   * --------------------------------------------------------
   * Cleanup
   * --------------------------------------------------------
   */

  async cleanup() {
    try {
      await this.#exitCurrentState();
    } finally {
      this.stateStack.length = 0;

      this.overlays.clear();

      this.transitionHistory.length = 0;

      this.transitionGuards.clear();

      this.locks.clear();

      this.persistenceHooks.clear();

      this.currentState = null;

      this.transitionInProgress = false;

      this.invalidateRender();
    }

    this.#log("StateManager cleanup completed.");
  }

  /**
   * --------------------------------------------------------
   * Debug
   * --------------------------------------------------------
   */

  enableDebug() {
    this.debug = true;
  }

  disableDebug() {
    this.debug = false;
  }

  #log(message) {
    if (!this.debug) {
      return;
    }

    console.log(`[StateManager] ${message}`);
  }
}

const stateManager = new StateManager();

export default stateManager;