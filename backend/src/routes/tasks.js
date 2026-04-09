const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const Task = require('../models/Task');

const router = express.Router();

const parseDeadline = (rawDeadline) => {
  if (rawDeadline === undefined) return { isProvided: false, value: undefined, isValid: true };
  if (rawDeadline === null || rawDeadline === '') {
    return { isProvided: true, value: null, isValid: true };
  }

  const parsed = new Date(rawDeadline);
  if (Number.isNaN(parsed.getTime())) {
    return { isProvided: true, value: null, isValid: false };
  }

  return { isProvided: true, value: parsed, isValid: true };
};

const toTaskResponse = (task) => ({
  id: task._id.toString(),
  user_id: task.user_id.toString(),
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  deadline: task.deadline ? task.deadline.toISOString() : null,
  created_at: task.created_at.toISOString(),
  updated_at: task.updated_at.toISOString(),
});

// Get all tasks for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ user_id: req.user.userId }).sort({ created_at: -1 });
    res.json({ tasks: tasks.map(toTaskResponse) });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create task
router.post('/', authenticateToken, async (req, res) => {
  const { title, description, priority, deadline } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const validPriorities = ['low', 'medium', 'high'];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority value' });
  }

  const parsedDeadline = parseDeadline(deadline);
  if (!parsedDeadline.isValid) {
    return res.status(400).json({ error: 'Invalid deadline value' });
  }

  try {
    const task = await Task.create({
      user_id: req.user.userId,
      title: title.trim(),
      description: description || '',
      priority: priority || 'medium',
      deadline: parsedDeadline.value,
    });

    res.status(201).json({ task: toTaskResponse(task) });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  const { title, description, status, priority, deadline } = req.body;
  const taskId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  const validStatuses = ['pending', 'in_progress', 'completed'];
  const validPriorities = ['low', 'medium', 'high'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority value' });
  }
  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  const parsedDeadline = parseDeadline(deadline);
  if (!parsedDeadline.isValid) {
    return res.status(400).json({ error: 'Invalid deadline value' });
  }

  try {
    const task = await Task.findOne({ _id: taskId, user_id: req.user.userId });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.title = title !== undefined ? title.trim() : task.title;
    task.description = description !== undefined ? description : task.description;
    task.status = status !== undefined ? status : task.status;
    task.priority = priority !== undefined ? priority : task.priority;
    if (parsedDeadline.isProvided) {
      task.deadline = parsedDeadline.value;
    }

    await task.save();

    res.json({ task: toTaskResponse(task) });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  const taskId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  try {
    const task = await Task.findOne({ _id: taskId, user_id: req.user.userId });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await Task.deleteOne({ _id: taskId, user_id: req.user.userId });
    res.json({ message: 'Task deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
