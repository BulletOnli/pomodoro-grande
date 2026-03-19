import "@testing-library/jest-dom/vitest";
import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

export const mockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    session: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() },
    onStartup: { addListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    getURL: vi.fn(),
  },
  action: {
    setBadgeBackgroundColor: vi.fn(),
    setBadgeText: vi.fn(),
    setBadgeTextColor: vi.fn(),
  },
  offscreen: {
    hasDocument: vi.fn(),
    createDocument: vi.fn(),
  },
  notifications: {
    create: vi.fn(),
    clear: vi.fn(),
  },
};

// Assign to global object before any tests run
(global as any).chrome = mockChrome;

beforeEach(() => {
  vi.clearAllMocks();
  // Setup default mock values with support for both Promises and Callbacks
  // We use mockImplementation so it serves as both a default and can be overridden by a standard return value
  mockChrome.storage.local.get.mockImplementation((keys: any, cb: any) => {
    const data = { time: 1500000 }; // 25 minutes
    if (typeof cb === "function") cb(data);
    else if (typeof keys === "function") keys(data);
    return Promise.resolve(data);
  });

  mockChrome.storage.session.get.mockImplementation((keys: any, cb: any) => {
    const data = {};
    if (typeof cb === "function") cb(data);
    else if (typeof keys === "function") keys(data);
    return Promise.resolve(data);
  });

  mockChrome.storage.sync.get.mockImplementation((keys: any, cb: any) => {
    const data = {};
    if (typeof cb === "function") cb(data);
    else if (typeof keys === "function") keys(data);
    return Promise.resolve(data);
  });
});

// Add any global test setup here
