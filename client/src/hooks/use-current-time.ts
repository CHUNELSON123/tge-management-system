"use client";

import { useSyncExternalStore } from "react";

let currentTime: number | null = null;
let interval: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    currentTime = Date.now();
    interval = setInterval(() => {
      currentTime = Date.now();
      listeners.forEach((notify) => notify());
    }, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(interval);
      interval = undefined;
    }
  };
}

function getSnapshot() {
  return currentTime;
}

function getServerSnapshot() {
  return null;
}

// Keep time reads outside render and use the same initial snapshot during hydration.
export function useCurrentTime() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
