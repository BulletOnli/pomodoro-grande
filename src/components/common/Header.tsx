import { REVIEW_PAGE } from "@/constants";
import { Star } from "lucide-react";
import React from "react";

const Header = () => {
  return (
    <div className="w-full flex justify-between items-center text-center p-2 text-sm text-primary-custom font-semibold ">
      <div className="flex items-center gap-1 select-none">
        <img src="/assets/images/icon48.png" alt="" className="size-8" />
        Pomodoro Grande
      </div>

      <a href={REVIEW_PAGE} target="_blank">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center ">
            <Star fill="#D9A923" color="#D9A923" className="size-[10px]" />
            <Star fill="#D9A923" color="#D9A923" className="size-[10px]" />
            <Star fill="#D9A923" color="#D9A923" className="size-[10px]" />
          </div>
          <p className="text-xs">Rate now</p>
        </div>
      </a>
    </div>
  );
};

export default Header;
