import "./TaskFilter.css";
export function TaskFilters({
  filter,
  setFilter,
  query,
  setQuery,
  sort,
  setSort,
}) {
  return (
    <div className="tasksControls">
      <input
        className="tasksInput tasksSearch"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tasks…"
      />

      <div className="tasksFilterGroup">
        <button
          type="button"
          className={`tasksChip ${filter === "active" ? "tasksChipActive" : ""}`}
          onClick={() => setFilter("active")}
        >
          Active
        </button>

        <button
          type="button"
          className={`tasksChip ${filter === "completed" ? "tasksChipActive" : ""}`}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>

        <button
          type="button"
          className={`tasksChip ${filter === "all" ? "tasksChipActive" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>

        <select
          className="tasksSelect"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
    </div>
  );
}
