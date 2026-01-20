import * as taskService from '../services/taskService.js';

export async function getTasks(req, res, next) {
  const tasks = await taskService.getAllTasks();
  res.json(tasks);
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

  if (isNaN(id)) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["ID must be a number"],
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

  if (isNaN(id)) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["ID must be a number"],
    });
  }

  const updates = {};
  if (Object.prototype.hasOwnProperty.call(req.body, "title")) updates.title = req.body.title;
  if (Object.prototype.hasOwnProperty.call(req.body, "completed")) updates.completed = req.body.completed;

  try {
    // First check existence (so we return 404 instead of Prisma throwing)
    const existing = await taskService.getTaskById(id);
    if (!existing) return res.status(404).json({ error: "Task not found" });

    const updated = await taskService.updateTaskById(id, updates);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["ID must be a number"],
    });
  }

  try {
    const existing = await taskService.getTaskById(id);
    if (!existing) return res.status(404).json({ error: "Task not found" });

    await taskService.deleteTaskById(id);
    res.status(204).send(); 
  } catch (err) {
    next(err);
  }
}