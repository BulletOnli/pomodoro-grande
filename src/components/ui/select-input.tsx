import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ONE_MINUTE } from "@/constants";

interface CustomSelectInputProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputPlaceholder?: string;
  allowCustomInput?: boolean;
  max?: number;
}

interface CustomInputState {
  isActive: boolean;
  value: string;
  error: string;
}

const DEFAULT_MIN = 1;
const DEFAULT_MAX = 180;

const convertMsToMinutes = (ms: string): number => Number(ms) / ONE_MINUTE;
const convertMinutesToMs = (minutes: number): string =>
  (minutes * ONE_MINUTE).toString();

const formatMinutesDisplay = (minutes: number): string => {
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
};

const formatMaxDisplay = (max: number): string => {
  const hours = Math.floor(max / 60);
  const remainingMinutes = max % 60;

  if (hours > 0) {
    const hourText = `${hours} hour${hours > 1 ? "s" : ""}`;
    const minuteText =
      remainingMinutes > 0 ? ` ${remainingMinutes} minutes` : "";
    return `${hourText}${minuteText}`;
  }

  return `${max} minutes`;
};

const validateMinutesInput = (input: string, max: number): string => {
  const trimmed = input.trim();

  if (!trimmed) return "Please enter a value";

  const num = Number(trimmed);

  if (isNaN(num)) return "Please enter a valid number";
  if (num <= 0) return "Must be greater than 0";
  if (num > max) return `Max. ${formatMaxDisplay(max)} allowed`;
  if (!Number.isInteger(num)) return "Please enter whole minutes only";

  return "";
};

const getDisplayValue = (
  value: string,
  options: Array<{ value: string; label: string }>
): string => {
  const selected = options.find((opt) => opt.value === value);
  if (selected) return selected.label;

  if (value) {
    const minutes = convertMsToMinutes(value);
    return formatMinutesDisplay(minutes);
  }

  return "";
};

// Sub-components
const OptionItem: React.FC<{
  option: { value: string; label: string };
  isSelected: boolean;
  onSelect: (value: string) => void;
}> = ({ option, isSelected, onSelect }) => (
  <div
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
      isSelected && "bg-accent text-accent-foreground"
    )}
    onClick={() => onSelect(option.value)}
  >
    <Check
      className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}
    />
    {option.label}
  </div>
);

const CustomInputForm: React.FC<{
  state: CustomInputState;
  max: number;
  placeholder: string;
  onStateChange: (state: Partial<CustomInputState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}> = ({ state, max, placeholder, onStateChange, onSubmit, onCancel }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const error =
      state.error && !validateMinutesInput(newValue, max) ? "" : state.error;
    onStateChange({ value: newValue, error });
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        How many minutes? ({DEFAULT_MIN}-{max})
      </div>
      <Input
        placeholder={placeholder}
        value={state.value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoFocus
        className={cn("h-8 text-sm", state.error && "border-destructive")}
        type="number"
        min={DEFAULT_MIN.toString()}
        max={max.toString()}
        step="1"
      />
      {state.error && (
        <div className="text-xs text-destructive">{state.error}</div>
      )}
      <div className="grid grid-cols-2 gap-1">
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!state.value.trim()}
          className="h-7 text-xs"
        >
          Apply
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

// Main Component
export function CustomSelectInput({
  value = "",
  onValueChange,
  options = [],
  placeholder = "Select or enter value...",
  disabled = false,
  className,
  inputPlaceholder,
  allowCustomInput = true,
  max = DEFAULT_MAX,
}: CustomSelectInputProps) {
  const [open, setOpen] = React.useState(false);
  const [customInput, setCustomInput] = React.useState<CustomInputState>({
    isActive: false,
    value: "",
    error: "",
  });

  const displayValue = getDisplayValue(value, options);
  const finalInputPlaceholder = inputPlaceholder || `${max}`;

  const resetCustomInput = () => {
    setCustomInput({ isActive: false, value: "", error: "" });
  };

  const handleSelectOption = (optionValue: string) => {
    onValueChange?.(optionValue);
    setOpen(false);
    resetCustomInput();
  };

  const handleActivateCustomInput = () => {
    const currentMinutes = value ? convertMsToMinutes(value).toString() : "";
    setCustomInput({ isActive: true, value: currentMinutes, error: "" });
  };

  const handleSubmitCustomInput = () => {
    const error = validateMinutesInput(customInput.value, max);

    if (error) {
      setCustomInput({ ...customInput, error });
      return;
    }

    const minutes = Number(customInput.value.trim());
    const milliseconds = convertMinutesToMs(minutes);
    onValueChange?.(milliseconds);
    setOpen(false);
    resetCustomInput();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">{value ? displayValue : placeholder}</span>

          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="overflow-auto">
          {options.length > 0 && (
            <div className="p-1">
              {options.map((option) => (
                <OptionItem
                  key={option.value}
                  option={option}
                  isSelected={value === option.value}
                  onSelect={handleSelectOption}
                />
              ))}
            </div>
          )}

          {allowCustomInput && (
            <>
              {options.length > 0 && <div className="border-t border-border" />}
              <div className="p-2 flex">
                {!customInput.isActive ? (
                  <Button
                    variant="ghost"
                    className="flex-1 h-8 text-sm font-normal"
                    onClick={handleActivateCustomInput}
                  >
                    Custom
                  </Button>
                ) : (
                  <CustomInputForm
                    state={customInput}
                    max={max}
                    placeholder={finalInputPlaceholder}
                    onStateChange={(partial) =>
                      setCustomInput({ ...customInput, ...partial })
                    }
                    onSubmit={handleSubmitCustomInput}
                    onCancel={resetCustomInput}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
