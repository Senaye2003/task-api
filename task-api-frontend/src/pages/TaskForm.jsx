import "./TaskForm.css";
export function TaskForm({ title, setTitle, onSubmit, submitStatus }) {
  return (
    <form className="tasksForm" onSubmit={onSubmit}>
      <input
        className="tasksInput"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New Task"
      />
      <button
        className="tasksButton"
        type="submit"
        disabled={submitStatus === "loading"}
      >
        Add
      </button>
    </form>
  );
}
