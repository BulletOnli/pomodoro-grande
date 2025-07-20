import { Todo } from "@/types";
import { useEffect, useState } from "react";

const TodoProgress = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const completedTodos = todos.filter((todo) => todo.isCompleted);

  useEffect(() => {
    const syncState = async () => {
      const result = await chrome.storage.local.get("todos");
      setTodos((result?.todos as Todo[]) ?? []);
    };

    syncState();

    const handleStorageChange = (changes: any) => {
      if (changes.todos) setTodos(changes.todos.newValue);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return (
    <div className="min-w-[80px] flex flex-col items-center justify-center">
      <p className="text-3xl font-extrabold text-nowrap">
        {todos.length > 0 ? `${completedTodos.length} of ${todos.length}` : 0}
      </p>
      <p className="font-semibold">Todos</p>
    </div>
  );
};

export default TodoProgress;
