import * as taskService from '../services/taskService.js';

export async function getTasks(req, res, next) {
  try {
    const tasks = await taskService.getAllTasks();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  const { title, completed } = req.body;

  try {
    const task = await taskService.createTask({ title, completed });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function getTaskById(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["ID must be an integer"],
    });
  }

  try {
    const task = await taskService.getTaskById(id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["ID must be an integer"],
    });
  }

  const updates = {};
  if (Object.prototype.hasOwnProperty.call(req.body, "title")) updates.title = req.body.title;
  if (Object.prototype.hasOwnProperty.call(req.body, "completed")) updates.completed = req.body.completed;

  try {
    const updated = await taskService.updateTaskById(id, updates);
    res.status(200).json(updated);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Task not found" });
    }
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["ID must be an integer"],
    });
  }

  try {
    await taskService.deleteTaskById(id);
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Task not found" });
    }
    next(err);
  }
}
