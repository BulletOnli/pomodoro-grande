import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { TimerContextProvider } from "../../context/TimerContext";
import { mockChrome } from "../../tests/setup";
import { Tabs, TabsContent } from "../../components/ui/tabs";
import PomodoroTimer from "../../features/pomodoro/PomodoroTimer";

describe("PomodoroTimer", () => {
  const renderPomodoroTimer = async () => {
    let result;
    await act(async () => {
      result = render(
        <TimerContextProvider>
          <Tabs defaultValue="timer">
            <TabsContent value="timer">
              <PomodoroTimer />
            </TabsContent>
          </Tabs>
        </TimerContextProvider>,
      );
    });
    return result!;
  };

  it("renders initial timer state correctly", async () => {
    await renderPomodoroTimer();
    await screen.findByText("25:00");
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("handles start timer button click", async () => {
    await renderPomodoroTimer();

    const startButton = await screen.findByText("Start");
    fireEvent.click(startButton);

    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "start-timer",
    });
  });

  it("handles stop timer button click when timer is running", async () => {
    // Mock storage to simulate running timer
    mockChrome.storage.local.get.mockImplementation((keys: any, cb: any) => {
      const data = { time: 1500000, isRunning: true };
      if (typeof cb === "function") cb(data);
      else if (typeof keys === "function") keys(data);
      return Promise.resolve(data);
    });

    await renderPomodoroTimer();

    const stopButton = await screen.findByText("Stop");
    fireEvent.click(stopButton);

    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "stop-timer",
    });
  });

  it("shows break timer state correctly", async () => {
    // Mock storage to simulate break time
    mockChrome.storage.local.get.mockImplementation((keys: any, cb: any) => {
      const data = { time: 300000, isRunning: true, isBreak: true };
      if (typeof cb === "function") cb(data);
      else if (typeof keys === "function") keys(data);
      return Promise.resolve(data);
    });

    await renderPomodoroTimer();

    await screen.findByText("Break");
    const skipButton = screen.getByText("Skip");
    expect(skipButton).toBeInTheDocument();
  });

  it("handles storage changes correctly", async () => {
    await renderPomodoroTimer();

    // Simulate storage change across all listeners
    act(() => {
      mockChrome.storage.onChanged.addListener.mock.calls.forEach(
        (call: any) => {
          call[0]({
            time: { newValue: 1400000 },
            isRunning: { newValue: true },
            isBreak: { newValue: false },
            isLongBreak: { newValue: false },
            ultraFocusMode: { newValue: true },
          });
        },
      );
    });

    // Check if Ultra Focus Mode badge appears
    expect(await screen.findByText("Ultra Focus Mode! 🔥")).toBeInTheDocument();
  });

  it("formats timer correctly for different durations", async () => {
    // Test with time > 1 hour
    mockChrome.storage.local.get.mockImplementation((keys: any, cb: any) => {
      const data = { time: 3600001 };
      if (typeof cb === "function") cb(data);
      else if (typeof keys === "function") keys(data);
      return Promise.resolve(data);
    });

    // We can't easily rerender due to context so we just mount a fresh copy
    let { unmount } = await renderPomodoroTimer();
    await screen.findByText("01:00:00");
    unmount();

    // Test with time = 0
    mockChrome.storage.local.get.mockImplementation((keys: any, cb: any) => {
      const data = { time: 0 };
      if (typeof cb === "function") cb(data);
      else if (typeof keys === "function") keys(data);
      return Promise.resolve(data);
    });

    await renderPomodoroTimer();
    await screen.findByText("00:00");
  });
});
