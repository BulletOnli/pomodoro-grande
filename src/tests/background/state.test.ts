import { vi, describe, it, expect, beforeEach } from "vitest";
import { mockChrome } from "../setup";

describe("Background State Recovery", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Setup the mock to actually call the callback for Chrome APIs
    mockChrome.storage.local.get.mockImplementation((keys: any, cb: any) => {
      const data = {
        time: 1500000,
        isBreak: false,
        isPaused: true,
      };
      if (typeof cb === "function") cb(data);
      else if (typeof keys === "function") keys(data);
      return Promise.resolve(data);
    });

    mockChrome.storage.session.get.mockImplementation((keys: any, cb: any) => {
      const data = { pomodoroCount: 3 };
      if (typeof cb === "function") cb(data);
      else if (typeof keys === "function") keys(data);
      return Promise.resolve(data);
    });
  });

  it("should recover isBreak, isPaused, and pomodoroCount from storage on startup", async () => {
    // Dynamically import background.ts so it executes its top-level code
    const bg = await import("../../background");

    // verify the getters were called
    expect(mockChrome.storage.local.get).toHaveBeenCalledWith(
      expect.arrayContaining(["isBreak", "isPaused"]),
      expect.any(Function),
    );
    expect(mockChrome.storage.session.get).toHaveBeenCalledWith(
      ["pomodoroCount"],
      expect.any(Function),
    );

    // To verify that the states were actually recovered inside the module,
    // we set isBreak to false and pomodoroCount to 3.
    // handleTimeEnds() adds 1 to pomodoroCount since it's not a break, making it 4.
    // It toggles isBreak to true.
    // Since 4 % 4 === 0, it should trigger a long break!
    mockChrome.storage.local.set.mockClear();
    await bg.handleTimeEnds();

    expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        isLongBreak: true,
        isBreak: true,
        time: 1000 * 60 * 15,
      }),
    );
  });
});
