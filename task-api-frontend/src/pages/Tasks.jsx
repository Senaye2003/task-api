import { useEffect, useState } from "react";
import { getTasks, createTask } from "../../api/tasks";

export function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");

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

  return (
    <div>
      <h1> Tasks </h1>
      <form onSubmit={handleSubmit}>
        <input
            value={title}
            onChange={(e)=>{setTitle(e.target.value)}}
            placeholder="New Task"
        />
        <button type="submit" disabled={submitStatus === "loading"}>
            Add
        </button>
      </form>

      {submitStatus === "error" && <p> Error: {submitError}</p>}

      {tasks.map((task) => {
        return (
          <div key={task.id}>
            <div> {task.title} </div>
            <div> completed: {String(task.completed)}</div>
            <br />
          </div>
        );
      })}
    </div>
  );
}
