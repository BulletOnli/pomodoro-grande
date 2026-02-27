import Header from "./components/common/Header";
import Navbar from "./components/common/Navbar";
import Settings from "./features/settings/Settings";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import PomodoroTimer from "./features/pomodoro/PomodoroTimer";
import { useState } from "react";
import Todos from "./features/todos/Todos";
import SiteBlocker from "./features/site-blocker/SiteBlocker";
import AnalyticsTab from "./features/analytics/AnalyticsTab";

const DEFAULT_TAB_SIZE = {
  width: "w-[350px]", // 320px
  height: "h-[570px]",
};

const App = () => {
  const [tabSize, setTabSize] = useState(DEFAULT_TAB_SIZE);

  const handleTabResize = (value: string) => {
    if (value === "analytics") {
      setTabSize({
        width: "w-[550px]",
        height: DEFAULT_TAB_SIZE.height,
      });
    } else if (value === "todos") {
      setTabSize({
        width: "w-[700px]",
        height: DEFAULT_TAB_SIZE.height,
      });
    } else {
      setTabSize(DEFAULT_TAB_SIZE);
    }
  };

  return (
    <>
      <Tabs
        defaultValue="timer"
        onValueChange={handleTabResize}
        className={`${tabSize.width} ${tabSize.height} relative flex flex-col mx-auto text-sm border transition-all duration-300`}
      >
        <Header />

        <div className="w-full h-full flex-1 min-h-0 px-4 overflow-hidden">
          <PomodoroTimer />
          <TabsContent value="sites">
            <SiteBlocker />
          </TabsContent>
          <TabsContent value="settings">
            <Settings />
          </TabsContent>
          <TabsContent value="todos" className="h-full">
            <Todos />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </div>

        <Navbar />
      </Tabs>
    </>
  );
};

export default App;
