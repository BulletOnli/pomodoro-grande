import { useEffect, useState, useRef } from "react";
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import debounce from "@/utils/debounce";
import { Button } from "@/components/ui/button";

const DEFAULT_BADGE_COLOR = "#40A662";
const DEFAULT_BADGE_FONT_COLOR = "#000000";

const AppearanceSettings = () => {
  const [badgeColor, setBadgeColor] = useState(DEFAULT_BADGE_COLOR);
  const [badgeFontColor, setBadgeFontColor] = useState(
    DEFAULT_BADGE_FONT_COLOR
  );

  const handleReset = () => {
    setBadgeColor(DEFAULT_BADGE_COLOR);
    setBadgeFontColor(DEFAULT_BADGE_FONT_COLOR);

    chrome.storage.sync.set({
      badgeColor: DEFAULT_BADGE_COLOR,
      badgeFontColor: DEFAULT_BADGE_FONT_COLOR,
    });

    chrome.runtime.sendMessage({
      type: "set-badge-color",
      color: DEFAULT_BADGE_COLOR,
    });

    chrome.runtime.sendMessage({
      type: "set-badge-font-color",
      color: DEFAULT_BADGE_FONT_COLOR,
    });
  };

  useEffect(() => {
    const loadSettings = async () => {
      const data = await chrome.storage.sync.get([
        "badgeColor",
        "badgeFontColor",
      ]);

      setBadgeColor(data?.badgeColor ?? "#40A662");
      setBadgeFontColor(data?.badgeFontColor ?? "#ffffff");

      if (data?.badgeColor) {
        chrome.runtime.sendMessage({
          type: "set-badge-color",
          color: data.badgeColor,
        });
      }

      if (data?.badgeFontColor) {
        chrome.runtime.sendMessage({
          type: "set-badge-font-color",
          color: data.badgeFontColor,
        });
      }
    };

    loadSettings();
  }, []);

  const handleBadgeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBadgeColor(value);
    chrome.runtime.sendMessage({ type: "set-badge-color", color: value });
  };

  const handleBadgeColorBlur = () => {
    chrome.storage.sync.set({ badgeColor });
  };

  const handleBadgeFontColorChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setBadgeFontColor(value);
    chrome.runtime.sendMessage({ type: "set-badge-font-color", color: value });
  };

  const handleBadgeFontColorBlur = () => {
    chrome.storage.sync.set({ badgeFontColor });
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p>Badge Color</p>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger>
                <CircleHelp className="text-primary-custom size-4" />
              </TooltipTrigger>
              <TooltipContent className="w-[200px] bg-primary-custom text-center">
                <p>Change the background color of the extension badge.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <input
          type="color"
          value={badgeColor}
          onChange={handleBadgeColorChange}
          onBlur={handleBadgeColorBlur}
          className="p-0 border-none bg-transparent cursor-pointer"
          aria-label="Badge Color Picker"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p>Badge Font Color</p>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger>
                <CircleHelp className="text-primary-custom size-4" />
              </TooltipTrigger>
              <TooltipContent className="w-[200px] bg-primary-custom text-center">
                <p>Change the font color of the extension badge.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <input
          type="color"
          value={badgeFontColor}
          onChange={handleBadgeFontColorChange}
          onBlur={handleBadgeFontColorBlur}
          className="p-0 border-none bg-transparent cursor-pointer"
          aria-label="Badge Font Color Picker"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="button" variant="outline" size="sm" onClick={handleReset}>
          Reset to Default
        </Button>
      </div>
    </div>
  );
};

export default AppearanceSettings;
