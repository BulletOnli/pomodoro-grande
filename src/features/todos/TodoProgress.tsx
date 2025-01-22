import { Todo } from "@/types";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";

const TodoProgress = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const completedTodos = todos.filter((todo) => todo.done);

  useEffect(() => {
    const syncState = async () => {
      const result = await browser.storage.local.get("todos");
      setTodos((result.todos as Todo[]) ?? []);
    };

    syncState();

    const handleStorageChange = (changes: any) => {
      if (changes.todos) setTodos(changes.todos.newValue);
    };

    browser.storage.onChanged.addListener(handleStorageChange);

    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  if (todos.length === 0) return null;

  return (
    <p className="mt-2">
      <span className="font-semibold text-primary-custom">
        {completedTodos?.length}
      </span>{" "}
      out of{" "}
      <span className="font-semibold text-primary-custom">{todos.length}</span>{" "}
      Todos Completed
    </p>
  );
};

export default TodoProgress;
