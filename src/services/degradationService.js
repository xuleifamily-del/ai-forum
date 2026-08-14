import { STORAGE_KEYS } from '../constants/forumStorageKeys.js';
import StorageService from './storageService.js';
import apiClient from './apiClient.js';
import { notifySummaryReady, notifyInitialAnswerReady } from './notificationService.js';

const DEFAULT_AI_STATE = {
  state: 'available',
  reason: null,
  lastCheckAt: 0,
  consecutiveFailures: 0,
};

const FAILURE_THRESHOLD = 3;
const POLL_INTERVALS = [30_000, 60_000, 120_000];

class DegradationManager {
  constructor() {
    this.listeners = new Set();
    this.currentState = this._loadState();
    this.pollTimer = null;
    this.pollAttempts = 0;
    this._autoStartIfNeeded();
  }

  _loadState() {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_AI_STATE };
    }
    const saved = StorageService.get(STORAGE_KEYS.AI_STATE);
    if (saved && typeof saved === 'object') {
      return {
        state: saved.state || 'available',
        reason: saved.reason || null,
        lastCheckAt: saved.lastCheckAt || 0,
        consecutiveFailures: saved.consecutiveFailures || 0,
      };
    }
    return { ...DEFAULT_AI_STATE };
  }

  _persistState() {
    if (typeof window === 'undefined') return;
    StorageService.set(STORAGE_KEYS.AI_STATE, this.currentState);
  }

  _notifyListeners() {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.warn('[DegradationManager] listener error', err);
      }
    });
  }

  _autoStartIfNeeded() {
    if (typeof window === 'undefined') return;
    if (this.currentState.state !== 'available') {
      this.startPolling();
    }
  }

  getState() {
    return {
      aiState: this.currentState.state,
      reason: this.currentState.reason,
      consecutiveFailures: this.currentState.consecutiveFailures,
      lastCheckAt: this.currentState.lastCheckAt,
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async checkAiAvailable() {
    this.currentState.lastCheckAt = Date.now();
    try {
      const data = await apiClient.get('/health');
      const aiOk = data && data.ai === true;
      if (aiOk) {
        this.reportSuccess();
        return true;
      } else {
        this.reportFailure('health_check_ai_false');
        return false;
      }
    } catch (err) {
      this.reportFailure(err.message || 'health_check_network_error');
      return false;
    }
  }

  reportFailure(reason) {
    const failures = this.currentState.consecutiveFailures + 1;
    let newState = 'degraded';
    if (failures >= FAILURE_THRESHOLD) {
      newState = 'unavailable';
    }
    this.currentState = {
      state: newState,
      reason: reason || null,
      lastCheckAt: this.currentState.lastCheckAt,
      consecutiveFailures: failures,
    };
    this._persistState();
    this._notifyListeners();
    if (newState !== 'available') {
      this.startPollingIfNeeded();
    }
  }

  reportSuccess() {
    const wasUnavailable = this.currentState.state !== 'available';
    this.currentState = {
      state: 'available',
      reason: null,
      lastCheckAt: Date.now(),
      consecutiveFailures: 0,
    };
    this.pollAttempts = 0;
    this._persistState();
    this._notifyListeners();
    if (wasUnavailable) {
      this.stopPolling();
    }
  }

  startPollingIfNeeded() {
    if (this.currentState.state === 'available') return;
    this.startPolling();
  }

  startPolling() {
    if (typeof window === 'undefined') return;
    this.stopPolling();
    this._scheduleNextPoll();
  }

  stopPolling() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  _getPollInterval() {
    const idx = Math.min(this.pollAttempts, POLL_INTERVALS.length - 1);
    return POLL_INTERVALS[idx];
  }

  _scheduleNextPoll() {
    if (this.currentState.state === 'available') {
      this.pollAttempts = 0;
      return;
    }
    const interval = this._getPollInterval();
    if (import.meta.env?.DEV) {
      console.debug(`[DegradationManager] schedule poll #${this.pollAttempts + 1} in ${interval / 1000}s`);
    }
    this.pollTimer = setTimeout(async () => {
      this.pollAttempts += 1;
      await this.checkAiAvailable();
      if (this.currentState.state !== 'available') {
        this._scheduleNextPoll();
      }
    }, interval);
  }

  _loadPendingTasks() {
    if (typeof window === 'undefined') return [];
    const saved = StorageService.get(STORAGE_KEYS.PENDING_AI_TASKS);
    return Array.isArray(saved) ? saved : [];
  }

  _persistPendingTasks(tasks) {
    if (typeof window === 'undefined') return;
    StorageService.set(STORAGE_KEYS.PENDING_AI_TASKS, tasks);
  }

  addPendingTask(task) {
    const tasks = this._loadPendingTasks();
    const exists = tasks.some(
      (t) => t.questionId === task.questionId && t.type === task.type
    );
    if (exists) return;
    tasks.push(task);
    this._persistPendingTasks(tasks);
  }

  async drainPendingTasks(onComplete) {
    if (this.currentState.state !== 'available') return;
    const tasks = this._loadPendingTasks();
    if (tasks.length === 0) return;
    const remaining = [];
    for (const task of tasks) {
      try {
        const result = await this._executePendingTask(task);
        if (task.type === 'summary') {
          notifySummaryReady({ questionId: task.questionId, title: task.payload?.title });
        } else if (task.type === 'answer') {
          notifyInitialAnswerReady({ questionId: task.questionId, title: task.payload?.title });
        }
        if (typeof onComplete === 'function') {
          onComplete(task, result);
        }
      } catch (err) {
        remaining.push(task);
      }
    }
    this._persistPendingTasks(remaining);
  }

  async _executePendingTask(task) {
    switch (task.type) {
      case 'summary':
        return apiClient.post('/ai/summary', task.payload);
      case 'answer':
        return apiClient.post('/ai/answer', task.payload);
      default:
        throw new Error(`Unknown pending task type: ${task.type}`);
    }
  }
}

const degradationService = new DegradationManager();

export default degradationService;
