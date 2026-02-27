import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useMemo, useState } from "react";
import { PomodoroHistory } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";

type CustomBarLabel = {
  x: number;
  y: number;
  width: number;
  value: number;
};

const TODAY_DATE = new Date();
TODAY_DATE.setHours(0, 0, 0, 0);

const SEVEN_DAYS_DATE = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
const THIRTY_DAYS_DATE = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
const THREE_MONTHS_DATE = new Date(Date.now() - 93 * 24 * 60 * 60 * 1000);

const CHART_DATA = [
  {
    createdAt: new Date().toISOString(),
    totalPomodoros: 0,
    completedTodos: 0,
    totalWorkTime: 0,
  },
];

const chartConfig = {
  totalPomodoros: {
    label: "Total Pomodoros",
    color: "hsl(var(--chart-1))",
  },
  completedTodos: {
    label: "Completed Todos",
    color: "hsl(var(--chart-2))",
  },
  totalWorkTime: {
    label: "Total Work Time",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const AnalyticsTab = () => {
  const [chartData, setChartData] = useState<PomodoroHistory[]>(CHART_DATA);
  const [activeChart, setActiveChart] =
    useState<keyof typeof chartConfig>("totalPomodoros");
  const [filterDate, setFilterDate] = useState<Date>(TODAY_DATE);

  useEffect(() => {
    chrome.storage.local.get("pomodoroHistory").then((result) => {
      if (result.pomodoroHistory) {
        const data = result.pomodoroHistory as PomodoroHistory[];

        const today = new Date();
        const isToday =
          filterDate?.toDateString() === TODAY_DATE?.toDateString();

        if (isToday) {
          // For "Today" filter, group data by hour
          const hourlyData: PomodoroHistory[] = [];

          // Initialize 24 hours (0-23)
          for (let hour = 0; hour < 24; hour++) {
            const hourStart = new Date(today);
            hourStart.setHours(hour, 0, 0, 0);

            const hourEnd = new Date(today);
            hourEnd.setHours(hour, 59, 59, 999);

            // Find all data entries within this hour
            const hourlyEntries = data.filter((entry) => {
              const entryDate = new Date(entry.createdAt);
              return entryDate >= hourStart && entryDate <= hourEnd;
            });

            if (hourlyEntries.length > 0) {
              // Sum up the data for this hour
              const hourlySum = hourlyEntries.reduce(
                (sum, entry) => ({
                  totalPomodoros: sum.totalPomodoros + entry.totalPomodoros,
                  completedTodos: sum.completedTodos + entry.completedTodos,
                  totalWorkTime: sum.totalWorkTime + entry.totalWorkTime,
                }),
                { totalPomodoros: 0, completedTodos: 0, totalWorkTime: 0 },
              );

              // Create hourly time range label
              const startHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
              const endHour =
                hour === 23 ? 12 : hour + 1 > 12 ? hour + 1 - 12 : hour + 1;
              const startAmPm = hour < 12 ? "am" : "pm";
              const endAmPm = hour + 1 < 12 || hour + 1 === 24 ? "am" : "pm";

              hourlyData.push({
                createdAt: `${startHour}${startAmPm}-${endHour}${endAmPm}`,
                totalPomodoros: hourlySum.totalPomodoros,
                completedTodos: hourlySum.completedTodos,
                totalWorkTime: hourlySum.totalWorkTime,
              });
            }
          }

          setChartData(hourlyData.length > 0 ? hourlyData : CHART_DATA);
        } else {
          // For other filters, use the original daily grouping logic
          const filteredData: PomodoroHistory[] = Object.values(
            data.reduce((acc: any, current) => {
              const date = new Date(current.createdAt)
                .toISOString()
                .split("T")[0];

              const currentDate = new Date(date);

              // Include data within the filter range
              const shouldInclude =
                currentDate >= filterDate && currentDate <= today;

              if (shouldInclude) {
                if (!acc[date]) {
                  acc[date] = { ...current };
                } else {
                  acc[date].totalPomodoros += current.totalPomodoros;
                  acc[date].completedTodos += current.completedTodos;
                  acc[date].totalWorkTime += current.totalWorkTime;
                }
              }

              return acc;
            }, {}),
          );

          setChartData(filteredData || CHART_DATA);
        }
      }
    });
  }, [filterDate]);

  const total = useMemo(
    () => ({
      totalWorkTime: chartData.reduce(
        (acc, curr) => acc + curr.totalWorkTime,
        0,
      ),
      totalPomodoros: chartData.reduce(
        (acc, curr) => acc + curr.totalPomodoros,
        0,
      ),
      completedTodos: chartData.reduce(
        (acc, curr) => acc + curr.completedTodos,
        0,
      ),
    }),
    [chartData],
  );

  const renderCustomBarLabel = ({ x, y, width, value }: CustomBarLabel) => {
    // Hide label for total work time when not viewing today or last 7 days
    if (
      activeChart === "totalWorkTime" &&
      filterDate?.toDateString() !== SEVEN_DAYS_DATE?.toDateString() &&
      filterDate?.toDateString() !== TODAY_DATE?.toDateString()
    ) {
      return <></>;
    }

    // Hide label for 30 days and 3 months (but not today)
    if (
      filterDate?.toDateString() === THREE_MONTHS_DATE?.toDateString() ||
      filterDate?.toDateString() === THIRTY_DAYS_DATE?.toDateString()
    ) {
      return <></>;
    }

    const isWorkTime = activeChart === "totalWorkTime";
    const labelSuffix = isWorkTime ? (value > 1 ? "mins" : "min") : "";

    return (
      <text x={x + width / 2} y={y} fill="#666" textAnchor="middle" dy={-6}>
        {value.toFixed(2).replace(/\.00$/, "")} {labelSuffix}
      </text>
    );
  };

  const getDateRangeText = () => {
    const isToday = filterDate?.toDateString() === TODAY_DATE?.toDateString();

    if (isToday) {
      return `Today's Hourly Breakdown - ${new Date().toLocaleDateString()}`;
    }

    return `${filterDate?.toLocaleDateString()} - ${new Date()?.toLocaleDateString()}`;
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-base text-center font-semibold">
          Productivity Overview
        </h1>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger>
              <CircleHelp className="text-primary-custom size-4" />
            </TooltipTrigger>
            <TooltipContent className="w-[200px] bg-primary-custom text-center">
              <p>Sessions with at least one Pomodoro are saved.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mx-auto flex items-center justify-center gap-2 flex-wrap">
        <p
          onClick={() => setFilterDate(TODAY_DATE)}
          className={`${
            filterDate?.toDateString() === TODAY_DATE?.toDateString()
              ? "bg-primary-custom"
              : "bg-primary-custom/70"
          } text-xs text-white px-4 py-1 hover:bg-primary-custom/90 cursor-pointer rounded-full`}
        >
          Today
        </p>
        <p
          onClick={() => setFilterDate(SEVEN_DAYS_DATE)}
          className={`${
            filterDate?.toDateString() === SEVEN_DAYS_DATE?.toDateString()
              ? "bg-primary-custom"
              : "bg-primary-custom/70"
          } text-xs text-white px-4 py-1 hover:bg-primary-custom/90 cursor-pointer rounded-full`}
        >
          Last 7 days
        </p>
        <p
          onClick={() => setFilterDate(THIRTY_DAYS_DATE)}
          className={`${
            filterDate?.toDateString() === THIRTY_DAYS_DATE?.toDateString()
              ? "bg-primary-custom"
              : "bg-primary-custom/70"
          } text-xs text-white px-4 py-1 hover:bg-primary-custom/90 cursor-pointer rounded-full`}
        >
          Last 30 days
        </p>
        <p
          onClick={() => setFilterDate(THREE_MONTHS_DATE)}
          className={`${
            filterDate?.toDateString() === THREE_MONTHS_DATE?.toDateString()
              ? "bg-primary-custom"
              : "bg-primary-custom/70"
          } text-xs text-white px-4 py-1 hover:bg-primary-custom/90 cursor-pointer rounded-full`}
        >
          Last 3 months
        </p>
      </div>

      <div className="flex">
        {["totalPomodoros", "completedTodos", "totalWorkTime"].map((key) => {
          const chart = key as keyof typeof chartConfig;
          const count = total[key as keyof typeof total];

          return (
            <button
              key={chart}
              data-active={activeChart === chart}
              className="relative z-30 flex flex-1 flex-col  gap-1 border-t px-4 py-2 text-left even:border-l data-[active=true]:bg-primary-custom/10 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              onClick={() => setActiveChart(chart)}
            >
              <span className="text-xs text-muted-foreground">
                {chartConfig[chart].label}
              </span>

              <div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold leading-none sm:text-3xl">
                    {chart === "totalWorkTime"
                      ? (count / 60).toFixed(2).replace(/\.00$/, "")
                      : count}
                  </span>
                  {chart === "totalWorkTime" && (
                    <span className="text-xs">
                      {count / 60 > 1 ? "hours" : "hour"}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[300px] w-full"
      >
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="createdAt"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => {
              const isToday =
                filterDate?.toDateString() === TODAY_DATE?.toDateString();

              if (isToday) {
                // For hourly view, return the time range as is
                return value;
              }

              const date = new Date(value);
              const isTodayDate =
                date.toLocaleDateString() === new Date().toLocaleDateString();

              if (isTodayDate) return "Today";

              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />

          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[150px]"
                nameKey="views"
                labelFormatter={(value) => {
                  const isToday =
                    filterDate?.toDateString() === TODAY_DATE?.toDateString();

                  if (isToday) {
                    // For hourly view, show the time range
                    return value;
                  }

                  if (
                    new Date(value).toDateString() === new Date().toDateString()
                  ) {
                    return "Today";
                  }

                  return new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
                formatter={(value) => {
                  const labelMap = {
                    totalWorkTime: "Work Time",
                    completedTodos: "Completed Todos",
                    totalPomodoros: "Total Pomodoros",
                  };

                  const suffix =
                    activeChart === "totalWorkTime"
                      ? Number(value) > 1
                        ? "mins"
                        : "min"
                      : "";

                  return (
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-muted-foreground">
                        {labelMap[activeChart]}:
                      </div>
                      <p className="text-[10px] font-medium">
                        {Number(value)?.toFixed(2).replace(/\.00$/, "")}{" "}
                        {suffix}
                      </p>
                    </div>
                  );
                }}
              />
            }
          />

          <Bar
            dataKey={activeChart}
            fill={`#40A662`}
            label={renderCustomBarLabel}
          />
        </BarChart>
      </ChartContainer>

      <p className="text-xs text-center text-zinc-500">{getDateRangeText()}</p>
    </div>
  );
};

export default AnalyticsTab;
