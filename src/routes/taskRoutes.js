import express from 'express';
import * as taskController from '../controllers/taskController.js';
import { validateTask } from '../middleware/validateTask.js';
import { validateTaskUpdate } from '../middleware/validateTaskUpdate.js';

const router = express.Router();

router.get('/', taskController.getTasks);
router.post('/', validateTask, taskController.createTask);
router.get('/:id', taskController.getTaskById);
router.patch("/:id", validateTaskUpdate, taskController.updateTask);
router.delete("/:id", taskController.deleteTask);


export default router;
