import './TaskRow.css'
export function TaskRow({
  task,
  isUpdating,
  isDeleting,
  isEditing,
  editTitle,
  setEditTitle,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) {
  return (
    <div className="taskRow">
      <div className="taskRowLeft">
        <input
          className="taskRowCheckbox"
          type="checkbox"
          checked={task.completed}
          disabled={isUpdating || isDeleting}
          onChange={() => onToggle(task)}
        />

        {isEditing ? (
          <input
            className="taskRowInput"
            value={editTitle}
            disabled={isUpdating || isDeleting}
            onChange={(e) => setEditTitle(e.target.value)}
          />
        ) : (
          <span
            className={`taskRowTitle ${
              task.completed ? "taskRowTitleDone" : ""
            }`}
          >
            {task.title}
          </span>
        )}
      </div>

      <div className="taskRowRight">
        {isEditing ? (
          <>
            <button
              className="taskRowBtn"
              type="button"
              disabled={isUpdating || isDeleting}
              onClick={onSaveEdit}
            >
              Save
            </button>
            <button
              className="taskRowBtn"
              type="button"
              disabled={isUpdating || isDeleting}
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            className="taskRowBtn"
            type="button"
            disabled={isUpdating || isDeleting}
            onClick={() => onStartEdit(task)}
          >
            Edit
          </button>
        )}

        <button
          className="taskRowBtn taskRowDanger"
          type="button"
          disabled={isUpdating || isDeleting}
          onClick={() => onDelete(task)}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
