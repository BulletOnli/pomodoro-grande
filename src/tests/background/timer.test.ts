import { vi, describe, it, expect, beforeEach } from "vitest";
import { mockChrome } from "../setup";
import { handleTimeEnds } from "../../background";
import sounds from "@/constants/sounds";

describe("Timer Management", () => {
  it("should switch to break mode when work session ends", async () => {
    await handleTimeEnds();

    expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ isBreak: true })
    );

    expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: "#ffccd5",
    });
  });

  it("should switch to work mode when break ends", async () => {
    await handleTimeEnds();

    expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ isBreak: false })
    );

    expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: "#40A662",
    });
  });

  it("should trigger long break after 4 pomodoros", async () => {
    // Simulate completing 4 work sessions
    for (let i = 0; i < 7; i++) {
      await handleTimeEnds();
    }
    await handleTimeEnds(); // 8th call triggers long break

    expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        isBreak: true,
        time: 1000 * 60 * 15, // 15 minute long break
        isLongBreak: true,
      })
    );

    expect(mockChrome.notifications.create).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        title: "Long Break! ✨",
        message: "Fantastic work session! Time for a proper recharge!",
      })
    );
  });

  it("should play notification sound if enabled", async () => {
    await handleTimeEnds();

    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: "playSound",
      isSoundEnabled: true,
      selectedSound: sounds[0].value,
      soundVolume: 0.5,
    });
  });

  it("should not play sound when disabled", async () => {
    mockChrome.storage.local.get.mockImplementation(() => ({
      isSoundEnabled: false,
    }));

    await handleTimeEnds();

    expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalledWith({
      action: "playSound",
      isSoundEnabled: false,
      selectedSound: sounds[0].value,
      soundVolume: 0.5,
    });
  });
});
