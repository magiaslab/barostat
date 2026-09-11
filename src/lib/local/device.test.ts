import { describe, expect, test } from "vitest";

import {
  SSR_DEVICE_ID,
  clearDeviceId,
  ensureDeviceId,
  isPersistableDeviceId,
  readDeviceId,
} from "./device";

describe("ensureDeviceId (SSR)", () => {
  test("senza localStorage non minta un id reale e non persiste", () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: undefined,
    });
    try {
      expect(ensureDeviceId()).toBe(SSR_DEVICE_ID);
      expect(readDeviceId()).toBe("");
      expect(isPersistableDeviceId(SSR_DEVICE_ID)).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: original,
      });
    }
  });
});

describe("ensureDeviceId (browser)", () => {
  test("crea e riusa un id persistito", () => {
    const store = new Map<string, string>();
    const mock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: mock,
    });
    try {
      clearDeviceId();
      const first = ensureDeviceId();
      expect(first).not.toBe(SSR_DEVICE_ID);
      expect(isPersistableDeviceId(first)).toBe(true);
      expect(ensureDeviceId()).toBe(first);
      expect(readDeviceId()).toBe(first);
      clearDeviceId();
      expect(readDeviceId()).toBe("");
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: original,
      });
    }
  });
});
