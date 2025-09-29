import { useState, useEffect, FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableStateSnapshot,
} from "@hello-pangea/dnd";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Todo } from "@/types";

const Todos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    chrome.storage.local.get("todos").then((result) => {
      if (result.todos) setTodos(result.todos as Todo[]);
    });
  }, []);

  const addTodo = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === "") return;

    const newTodo = {
      id: Math.floor(Math.random() * 10_000).toString(),
      title: inputValue,
      isCompleted: false,
    };
    const updatedTodos = [newTodo, ...todos];
    setTodos(updatedTodos);
    setInputValue("");
    setError("");
    chrome.storage.local.set({ todos: updatedTodos });
  };

  const removeTodo = (id: string) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    setTodos(updatedTodos);
    chrome.storage.local.set({ todos: updatedTodos });
  };

  const toggleTodo = (id: string) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
    );
    setTodos(updatedTodos);
    chrome.storage.local.set({ todos: updatedTodos });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(todos);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setTodos(reordered);
    chrome.storage.local.set({ todos: reordered });
  };

  const sortedTodos = todos
    .slice()
    .sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));

  return (
    <div className="w-full space-y-2">
      <div className="">
        <h1 className="text-base text-center font-semibold">Todos</h1>
        <p className="text-xs text-center text-gray-500 ">
          Tip: Drag and drop todos based on priority!
        </p>
      </div>

      <form onSubmit={addTodo} className="flex items-center gap-1">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="What do you want to do?"
          className="h-8 text-sm placeholder:text-xs"
        />
        <Button
          type="submit"
          className="bg-primary-custom hover:bg-primary-custom/90"
          size="sm"
        >
          Add
        </Button>
      </form>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="todos-droppable">
          {(provided: DroppableProvided, _snapshot: DroppableStateSnapshot) => (
            <ul
              className="custom-scrollbar max-h-[20rem] overflow-y-auto"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {todos.length === 0 && (
                <p className="text-sm font-light text-center mt-4">
                  No todos yet
                </p>
              )}
              <AnimatePresence>
                {sortedTodos.map((todo, index) => (
                  <Draggable key={todo.id} draggableId={todo.id} index={index}>
                    {(
                      provided: DraggableProvided,
                      snapshot: DraggableStateSnapshot
                    ) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <motion.li
                          className={`flex justify-between items-center p-2 mb-2 rounded shadow bg-white transition-shadow ${
                            snapshot.isDragging ? "shadow-md" : ""
                          }`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          layout
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`todo-${todo.id}`}
                              checked={todo.isCompleted}
                              onCheckedChange={() => toggleTodo(todo.id)}
                            />
                            <label
                              htmlFor={`todo-${todo.id}`}
                              className={`max-w-[200px] break-words ${
                                todo.isCompleted
                                  ? "line-through text-gray-500"
                                  : ""
                              }`}
                            >
                              {todo.title}
                            </label>
                          </div>
                          <button
                            onClick={() => removeTodo(todo.id)}
                            className="text-primary-custom hover:text-primary-custom/90 focus:outline-none"
                          >
                            ✕
                          </button>
                        </motion.li>
                      </div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Todos;
