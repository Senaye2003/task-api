import * as taskRepository from '../repositories/taskRepo.js';

export async function getAllTasks() {
  return taskRepository.findAll();
}

export async function createTask(newTask) {
  return taskRepository.create(newTask);
}

export async function getTaskById(id) {
  return taskRepository.findById(id);
}

export async function updateTaskById(id, updates) {
  return taskRepository.updateById(id, updates);
}

export async function deleteTaskById(id) {
  return taskRepository.deleteById(id);
}