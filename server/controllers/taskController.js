const Submission = require('../models/Submission');
const Task = require('../models/Task');

// @desc  Get all tasks
// @route GET /api/tasks
// @access Admin
const getAllTasks = async (req, res) => {
  try {
    // extract and parse pagination parameter
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const skip = (page - 1) * limit;

    // fetch paginated task for the table
    const tasks = await Task.find({})
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    // calculate database-wide totals
    const totalTasks = await Task.countDocuments();
    const openTasks = await Task.countDocuments({ status : 'Open'});
    const submittedTasks = await Task.countDocuments({ status : 'Submitted'});
    const approvedTasks = await Task.countDocuments({ status : 'Approved'});
    const totalPages = Math.ceil(totalTasks / limit);

    res.json({
      tasks,
      pagination: {
        totalTasks, 
        totalPages, 
        currentPage: page, 
        limit
      }, 
      stats : {
        total : totalTasks, 
        open : openTasks, 
        submitted : submittedTasks, 
        approved : approvedTasks
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single task
// @route GET /api/tasks/:id
// @access Admin
const getTaskById = async (req, res) => {
  try {
    // — will throw a CastError from Mongoose instead of a clean 400
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Create a task
// @route POST /api/tasks
// @access Admin
const createTask = async (req, res) => {
  const { title, description, status, assignedTo, dueDate } = req.body;

  try {
    // first check due date exists or not
    if(dueDate)
    {
      const selectedDate = new Date(dueDate);
      const today = new Date();
      
      today.setHours(0, 0, 0, 0);

      if(selectedDate < today)
      {
        return res.status(400).json({
          message : 'Due date cannot be in past..!'
        });
      }
    }
    const task = await Task.create({
      title,
      description,
      status,
      assignedTo: assignedTo || null,
      dueDate,
      createdBy: req.user._id,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update a task
// @route PUT /api/tasks/:id
// @access Admin
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    // including internal fields like createdBy or __v
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    ).populate('assignedTo', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete a task
// @route DELETE /api/tasks/:id
// @access Admin
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    // — orphaned Submission documents remain in DB after task deletion

    // deleting all Submission documents referencing this id..!
    await Submission.deleteMany({ taskId : req.params.id });

    // delete the parent task
    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task and associated submission deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
