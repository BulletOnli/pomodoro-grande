import React, { useEffect, useState, useCallback } from "react";
import { isBlockedSite } from "@/utils/sites";
import { StorageChanges } from "@/types";

// Store the original page content so we can restore it
let originalBodyHTML: string | null = null;
let originalHeadHTML: string | null = null;
let tabKeyHandler: ((e: KeyboardEvent) => void) | null = null;

const createFocusOverlay = (): void => {
  if (document.getElementById("focus-overlay")) return;

  // Save original page content
  if (originalBodyHTML === null) {
    originalBodyHTML = document.body.innerHTML;
    originalHeadHTML = document.head.innerHTML;
  }

  // Wipe the entire page and replace with premium blocked design
  document.head.innerHTML = `
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${chrome.runtime.getURL("assets/css/blocked.css")}?t=${new Date().getTime()}">
  `;

  document.body.innerHTML = `
    <div id="focus-overlay">
      <div class="blocked-container">
        <div class="blocked-icon">
          <img src="${chrome.runtime.getURL("assets/images/icon48.png")}" alt="Pomodoro Grande" />
        </div>
        <h1 class="blocked-title">Stay <span>focused</span>,<br/>you're doing great!</h1>
        <div class="blocked-divider"></div>
        <p class="blocked-subtitle">This site is blocked during your focus session. Keep up the momentum — your future self will thank you.</p>
      </div>
      <div class="blocked-footer">
        <img src="${chrome.runtime.getURL("assets/images/icon48.png")}" alt="" />
        <p>Pomodoro Grande</p>
      </div>
    </div>
  `;

  tabKeyHandler = (e: KeyboardEvent) => {
    if (e.key === "Tab") e.preventDefault();
  };
  window.addEventListener("keydown", tabKeyHandler);
};

const removeFocusOverlay = (): void => {
  if (originalBodyHTML === null) return;

  // Restore the original page
  document.head.innerHTML = originalHeadHTML!;
  document.body.innerHTML = originalBodyHTML;

  originalBodyHTML = null;
  originalHeadHTML = null;

  if (tabKeyHandler) {
    window.removeEventListener("keydown", tabKeyHandler);
    tabKeyHandler = null;
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
