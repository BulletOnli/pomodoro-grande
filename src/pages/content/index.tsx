import React, { useEffect, useState, useCallback } from "react";
import "./content.css";
import { isBlockedSite } from "@/utils/sites";
import { StorageChanges } from "@/types";

const createFocusOverlay = (): void => {
  let overlay = document.getElementById("focus-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "focus-overlay";
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
  }

  overlay.innerHTML = `
    <div class='focus-overlay-footer'>
      <img src="${chrome.runtime.getURL(
        "assets/images/icon48.png"
      )}" alt="Tomato" />
      <p>Pomodoro Grande</p>
    </div>
    <h1>
      Don't let the tomato distract you!
    </h1>
  `;

  const tabKeyHandler = (e: KeyboardEvent): void => {
    if (e.key === "Tab") {
      e.preventDefault();
    }
  };

  window.addEventListener("keydown", tabKeyHandler);

  // Store reference to cleanup the event listener later
  (overlay as any).tabKeyHandler = tabKeyHandler;
};

const removeFocusOverlay = (): void => {
  const overlay = document.getElementById("focus-overlay");
  if (overlay) {
    const tabKeyHandler = (overlay as any).tabKeyHandler;
    if (tabKeyHandler) {
      window.removeEventListener("keydown", tabKeyHandler);
    }

    overlay.remove();
    document.body.style.overflow = "auto";
  }
};

const Content: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [blockedSites, setBlockedSites] = useState<string[]>([]);
  const [allowedUrls, setAllowedUrls] = useState<string[]>([]);

  const handleOverlay = useCallback(async () => {
    if (isBreak || isPaused) {
      removeFocusOverlay();
      return;
    }

    const currentUrl = window.location.href;
    const isBlocked = await isBlockedSite(currentUrl);

    if (isRunning && isBlocked) {
      createFocusOverlay();
    } else {
      removeFocusOverlay();
    }
  }, [isRunning, isBreak, isPaused, blockedSites, allowedUrls]);

  useEffect(() => {
    const fetchStorageData = async () => {
      const result: StorageChanges = await chrome.storage.local.get([
        "isRunning",
        "isBreak",
        "isPaused",
        "blockedSites",
        "allowedUrls",
      ]);
      setIsRunning(result.isRunning ?? false);
      setIsBreak(result.isBreak ?? false);
      setIsPaused(result.isPaused ?? false);
      setBlockedSites(result.blockedSites ?? []);
      setAllowedUrls(result.allowedUrls ?? []);
    };

    fetchStorageData();

    const onStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      Object.entries(changes).forEach(([key, { newValue }]) => {
        if (key === "isRunning") setIsRunning(newValue ?? false);
        if (key === "isBreak") setIsBreak(newValue ?? false);
        if (key === "isPaused") setIsPaused(newValue ?? false);
        if (key === "blockedSites") setBlockedSites(newValue ?? []);
        if (key === "allowedUrls") setAllowedUrls(newValue ?? []);
      });
    };

    chrome.storage.onChanged.addListener(onStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(onStorageChange);
    };
  }, []);

  useEffect(() => {
    handleOverlay();
  }, [handleOverlay]);

  return null;
};

export default Content;
