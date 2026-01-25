import { useEffect, useState } from "react";
import { getTasks } from "../../api/tasks";
export function Tasks() {
  const [ tasks, setTasks ] = useState([]);
  const [ status, setStatus ] = useState("idle");
  const [ error, setError ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setStatus("loading");
        const data = await getTasks();

        const list = Array.isArray(data) ? data : (data.tasks ?? []);
        setTasks(list);

        setStatus("success");
      } catch (e) {
        setStatus("error");
        setError(
          e?.response?.data?.error || e.message || "Failed to load tasks",
        );
      }
    })();
  }, []);



  return (
    <div>
      <h1> Tasks </h1>
      {status === "loading" && <p>Loading...</p>}
      {status === "error" && <p> Error: {error} </p>}

      {status === "success" && tasks.length === 0 && <p> no tasks yet</p>}

      {tasks.map((task) => {
        return (
          <div key={task.id}>
            <div> {task.title} </div>
            <div> completed: {String(task.completed)}</div>
          </div>
        );
      })}
    </div>
  );
}
