import "@testing-library/jest-dom/vitest";
import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

export const mockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
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
  // Setup default mock values
  mockChrome.storage.local.get.mockResolvedValue({ time: 1500000 }); // 25 minutes
});

// Add any global test setup here
