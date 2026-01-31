import { useEffect, useMemo, useState } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "../../api/tasks";


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

  const [ deletingId, setDeletingId ] = useState(null)
  const [deleteError, setDeleteError] = useState("") 

  const [ filter, setFilter ] = useState("all")
  const [ query, setQuery ] = useState("")
  const [ sort, setSort ] = useState("newest")

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

//handle delete
 async function handleDelete(task){
    if(!confirm("Delete this task")){
        return;
    }
    setDeletingId(task.id)
    setDeleteError("")

    try{
        await deleteTask(task.id)
        await loadTasks()

        if (editingId === task.id){
        cancelEdit()
      }
    } catch(e){
        setDeleteError(
        e?.response?.data?.error || e.message || "Failed to delete task",
      );
    } finally{
        setDeletingId(null)
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
    visibleTasks = visibleTasks.filter(task => !task.completed);
  } else if (filter === "completed") {
    visibleTasks = visibleTasks.filter(task => task.completed);
  }

  // search
  const q = query.trim().toLowerCase();
  if (q) {
    visibleTasks = visibleTasks.filter(task =>
      task.title.toLowerCase().includes(q)
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
if(query.trim()) emptyMessage = "No results for your search";
else if (filter === "active") emptyMessage = "No active tasks";
else if (filter === "completed") emptyMessage = "No completed tasks";

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

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button type="button" onClick={() => setFilter("active")}>active</button>
      <button type="button" onClick={()=>{setFilter("completed")}}> completed </button>
      <button type="button" onClick = {()=>{setFilter("all")}}> all </button>

      <select value={sort} onChange={(e)=>{ setSort(e.target.value)}}>
        <option value="newest" > newest </option>
        <option value= "oldest"> oldest </option>
      </select>

      

      {status === "success" && <p>Showing {visibleTasksHandler.length} of {tasks.length}</p>}
      {status === "success" && visibleTasksHandler.length === 0 && <p>{emptyMessage}</p>}

      {status === "success" &&
          visibleTasksHandler.map((task) => {
            const isUpdating = updatingId === task.id;
            const isEditing = editingId === task.id;
            const isDeleting = deletingId === task.id;

            return (
              <div key={task.id}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  disabled={isUpdating || isDeleting}
                  onChange={() => handleToggle(task)}
                />

                {isEditing ? (
                  <>
                    <input
                      value={editTitle}
                      disabled={isUpdating || isDeleting}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={isUpdating || isDeleting}
                      onClick={saveEdit}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating || isDeleting}
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
                      disabled={isUpdating || isDeleting}
                      onClick={() => startEdit(task)}
                    >
                      Edit
                    </button>
                  </>
                )}

                <button
                  type="button"
                  disabled={isUpdating || isDeleting}
                  onClick={() => handleDelete(task)}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            );
      })}

      
    </div>
  );
}
