import "./Tasks.css";
import { useEffect, useMemo, useState } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "../../api/tasks";
import { TaskRow } from "./TaskRow";
import { TaskForm } from "./TaskForm";
import { TaskFilters } from "./TaskFilter";
export function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");

  const [updatingId, setUpdatingId] = useState(null);
  const [updatingError, setUpdatingError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");

  async function loadTasks() {
    try {
      setStatus("loading");
      setError("");

      const data = await getTasks();
      const list = Array.isArray(data) ? data : (data.tasks ?? []);
      setTasks(list);

      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(e?.response?.data?.error || e.message || "Failed to load tasks");
    }
  }

  async function handleToggle(task) {
    setUpdatingId(task.id);
    setUpdatingError("");

    try {
      await updateTask(task.id, { completed: !task.completed });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completed: !t.completed } : t,
        ),
      );
    } catch (e) {
      setUpdatingError(
        e?.response?.data?.error || e.message || "Failed to update task",
      );
    } finally {
      setUpdatingId(null);
    }
  }
  useEffect(() => {
    loadTasks();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setSubmitError("Title is required");
      return;
    }

    try {
      setSubmitStatus("loading");
      setSubmitError("");

      await createTask({ title: cleanTitle, completed: false });

      setTitle("");
      await loadTasks();
      setSubmitStatus("idle");
    } catch (e) {
      setSubmitStatus("error");
      setSubmitError(
        e?.response?.data?.error || e.message || "Failed to create task",
      );
    }
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setUpdatingError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
  }

  async function handleDelete(task) {
    if (!confirm("Delete this task")) return;

    setDeletingId(task.id);
    setDeleteError("");

    try {
      await deleteTask(task.id);

      setTasks((prev) => prev.filter((t) => t.id !== task.id));

      if (editingId === task.id) cancelEdit();
    } catch (e) {
      setDeleteError(
        e?.response?.data?.error || e.message || "Failed to delete task",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function saveEdit() {
    if (!editTitle.trim()) {
      setUpdatingError("Title is required");
      return;
    }
    setUpdatingId(editingId);
    setUpdatingError("");

    try {
      await updateTask(editingId, { title: editTitle.trim() });
      await loadTasks();
      cancelEdit();
    } catch (e) {
      setUpdatingError(
        e?.response?.data?.error || e.message || "Failed to update task",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const visibleTasksHandler = useMemo(() => {
    let visibleTasks = tasks;

    // filter
    if (filter === "active") {
      visibleTasks = visibleTasks.filter((task) => !task.completed);
    } else if (filter === "completed") {
      visibleTasks = visibleTasks.filter((task) => task.completed);
    }

    // search
    const q = query.trim().toLowerCase();
    if (q) {
      visibleTasks = visibleTasks.filter((task) =>
        task.title.toLowerCase().includes(q),
      );
    }

    // sort
    if (sort === "newest") {
      visibleTasks = [...visibleTasks].sort((a, b) => b.id - a.id);
    } else if (sort === "oldest") {
      visibleTasks = [...visibleTasks].sort((a, b) => a.id - b.id);
    }

    return visibleTasks;
  }, [tasks, filter, query, sort]);

  let emptyMessage = "No tasks yet";
  if (query.trim()) emptyMessage = "No results for your search";
  else if (filter === "active") emptyMessage = "No active tasks";
  else if (filter === "completed") emptyMessage = "No completed tasks";

  return (
    <div className="tasksPage">
      <div className="tasksContainer">
        <h1 className="tasksTitle">Tasks</h1>

        <div className="tasksPanel">
          {status === "loading" && (
            <p className="tasksInfo">Loading tasks...</p>
          )}

          {status === "error" && <p className="tasksError">Error: {error}</p>}

          {submitError && <p className="tasksError">Error: {submitError}</p>}

          {updatingError && (
            <p className="tasksError">Error: {updatingError}</p>
          )}

          {deleteError && <p className="tasksError">Error: {deleteError}</p>}
        </div>

        <TaskForm
          title={title}
          setTitle={setTitle}
          onSubmit={handleSubmit}
          submitStatus={submitStatus}
        />

        <TaskFilters
          filter={filter}
          setFilter={setFilter}
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
        />

        {status === "success" && (
          <p className="tasksMeta">
            Showing {visibleTasksHandler.length} of {tasks.length}
          </p>
        )}

        {status === "success" && visibleTasksHandler.length === 0 && (
          <p className="tasksMeta">{emptyMessage}</p>
        )}

        <div className="tasksList">
          {status === "success" &&
            visibleTasksHandler.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isUpdating={updatingId === task.id}
                isDeleting={deletingId === task.id}
                isEditing={editingId === task.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onToggle={handleToggle}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onDelete={handleDelete}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
