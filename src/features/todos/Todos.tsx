import { useState, useEffect, FormEvent } from "react";
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
import { Todo, TodoStatus } from "@/types";
import { Pencil, X, Plus } from "lucide-react";

const Todos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    chrome.storage.local.get("todos").then((result) => {
      if (result.todos) {
        const loadedTodos = result.todos.map((t: any) => ({
          ...t,
          status: t.status || (t.isCompleted ? "done" : "todo"),
        }));
        setTodos(loadedTodos);
      }
    });
  }, []);

  const addTodo = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === "") return;

    const newTodo: Todo = {
      id: Math.floor(Math.random() * 10_000).toString(),
      title: inputValue,
      status: "todo",
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

  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditValue(currentTitle);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = (id: string) => {
    if (editValue.trim() === "") {
      setError("Task cannot be empty");
      return;
    }
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, title: editValue } : todo
    );
    setTodos(updatedTodos);
    chrome.storage.local.set({ todos: updatedTodos });
    setEditingId(null);
    setEditValue("");
    setError("");
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceStatus = source.droppableId as TodoStatus;
    const destStatus = destination.droppableId as TodoStatus;

    const columns = {
      todo: todos.filter((t) => t.status === "todo"),
      "in-progress": todos.filter((t) => t.status === "in-progress"),
      done: todos.filter((t) => t.status === "done"),
    };

    const [movedItem] = columns[sourceStatus].splice(source.index, 1);
    movedItem.status = destStatus;
    columns[destStatus].splice(destination.index, 0, movedItem);

    const newTodos = [
      ...columns.todo,
      ...columns["in-progress"],
      ...columns.done,
    ];

    setTodos(newTodos);
    chrome.storage.local.set({ todos: newTodos });
  };

  const columns: { id: TodoStatus; title: string }[] = [
    { id: "todo", title: "To Do" },
    { id: "in-progress", title: "In Progress" },
    { id: "done", title: "Done" },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className=" flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Kanban Board</h1>
          <p className="text-xs text-gray-500">
            Drag and drop tasks to manage your workflow
          </p>
        </div>
        <form onSubmit={addTodo} className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add new task..."
            className="h-8 w-64 text-sm"
          />
          <Button
            type="submit"
            className="bg-primary-custom hover:bg-primary-custom/90 h-8"
            size="sm"
          >
            <Plus className="size-4 mr-1" /> Add
          </Button>
        </form>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-3 gap-2 pb-2">
          {columns.map((column) => (
            <div
              key={column.id}
              className="max-h-[390px] flex flex-col bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <h2 className="font-medium text-sm mb-3 text-gray-700 flex justify-between items-center">
                {column.title}
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {todos.filter((t) => t.status === column.id).length}
                </span>
              </h2>

              <Droppable droppableId={column.id}>
                {(
                  provided: DroppableProvided,
                  snapshot: DroppableStateSnapshot
                ) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-h-[150px] custom-scrollbar overflow-y-auto transition-colors rounded-md ${
                      snapshot.isDraggingOver ? "bg-gray-100" : ""
                    }`}
                  >
                    {todos
                      .filter((t) => t.status === column.id)
                      .map((todo, index) => (
                        <Draggable
                          key={todo.id}
                          draggableId={todo.id}
                          index={index}
                        >
                          {(
                            provided: DraggableProvided,
                            snapshot: DraggableStateSnapshot
                          ) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white p-2 mb-2 rounded border group hover:shadow-sm transition-all ${
                                snapshot.isDragging ? "shadow-lg rotate-1" : ""
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                {editingId === todo.id ? (
                                  <div className="flex-1">
                                    <textarea
                                      className="w-full border rounded p-1 text-sm focus:outline-none resize-none"
                                      value={editValue}
                                      autoFocus
                                      rows={2}
                                      onChange={(e) =>
                                        setEditValue(e.target.value)
                                      }
                                      onBlur={() => saveEdit(todo.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          e.preventDefault();
                                          saveEdit(todo.id);
                                        } else if (e.key === "Escape") {
                                          cancelEdit();
                                        }
                                      }}
                                    />
                                    <div className="flex justify-end gap-1 mt-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs"
                                        onClick={cancelEdit}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="h-6 px-2 text-xs bg-primary-custom"
                                        onClick={() => saveEdit(todo.id)}
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-800 break-words flex-1 leading-tight">
                                    {todo.title}
                                  </span>
                                )}

                                {!editingId && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() =>
                                        startEdit(todo.id, todo.title)
                                      }
                                      className="text-gray-400 hover:text-blue-500"
                                    >
                                      <Pencil className="size-3" />
                                    </button>
                                    <button
                                      onClick={() => removeTodo(todo.id)}
                                      className="text-gray-400 hover:text-red-500"
                                    >
                                      <X className="size-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Todos;
