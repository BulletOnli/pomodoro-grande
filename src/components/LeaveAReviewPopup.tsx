import { REVIEW_PAGE } from "@/constants";
import React, { useState, useEffect } from "react";

const LeaveAReviewPopup = () => {
  const [isClosed, setIsClosed] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(
      ["reviewPopupClosed", "pomodoroHistory"],
      (result) => {
        if (result?.pomodoroHistory?.length > 1 && !result.reviewPopupClosed) {
          setIsClosed(false);
        }
      }
    );
  }, []);

  const handleClose = () => {
    setIsClosed(true);
    chrome.storage.local.set({ reviewPopupClosed: true });
  };

  // if (isClosed) return null;

  return (
    <div className="text-xs px-4 py-1 flex items-center text-center gap-2 rounded-full border">
      <p>
        Your thoughts matter!{" "}
        <a
          href={REVIEW_PAGE}
          target="_blank"
          rel="noreferrer"
          className="text-primary-custom underline"
        >
          Share a quick review 😊
        </a>
      </p>
      <button
        onClick={handleClose}
        className="text-xs"
        data-testid="close-review-popup"
      >
        X
      </button>
    </div>
  );
};

export default LeaveAReviewPopup;
