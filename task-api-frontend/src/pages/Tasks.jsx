import { useEffect, useState } from "react";
import { getTasks, createTask, updateTask } from "../../api/tasks";


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

  async function loadTasks() {
    try {
      setStatus("loading");
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
      await loadTasks();
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

  return (
    <div>
      <h1> Tasks </h1>
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          placeholder="New Task"
        />
        <button type="submit" disabled={submitStatus === "loading"}>
          Add
        </button>
      </form>

      {submitStatus === "error" && <p> Error: {submitError}</p>}

      {tasks.map((task) => {
        const isUpdating = updatingId === task.id;
        const isEditing = editingId === task.id;

        return (
          <div key={task.id}>
            <input
              type="checkbox"
              checked={task.completed}
              disabled={isUpdating}
              onChange={() => handleToggle(task)}
            />

            {isEditing ? (
              <>
                <input
                  value={editTitle}
                  disabled={isUpdating}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <button type="button" disabled={isUpdating} onClick={saveEdit}>
                  Save
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span>{task.title}</span>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => startEdit(task)}
                >
                  Edit
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
