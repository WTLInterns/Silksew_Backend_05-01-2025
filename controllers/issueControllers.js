const asyncHandler = require("express-async-handler")
const Issue = require("../models/issueModel")

// @desc    Get all issues with pagination
// @route   GET /api/issues
// @access  Private
exports.getIssues = asyncHandler(async (req, res) => {
  const pageSize = 5
  const page = Number(req.query.page) || 1

  const count = await Issue.countDocuments()
  const issues = await Issue.find()
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 })

  res.json({
    issues,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  })
})

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Private
exports.getIssueById = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)
  if (issue) {
    res.json(issue)
  } else {
    res.status(404)
    throw new Error("Issue not found")
  }
})

// @desc    Create new issue
// @route   POST /api/issues
// @access  Private
exports.createIssue = asyncHandler(async (req, res) => {
  const { recipientId, recipientName, issue, related } = req.body

  const newIssue = await Issue.create({
    recipientId,
    recipientName,
    issue,
    related,
    status: "Unresolved",
  })

  res.status(201).json(newIssue)
})

// @desc    Update issue status
// @route   PUT /api/issues/:id/status
// @access  Private
exports.updateIssueStatus = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)

  if (issue) {
    issue.status = req.body.status || issue.status
    const updatedIssue = await issue.save()
    res.json(updatedIssue)
  } else {
    res.status(404)
    throw new Error("Issue not found")
  }
})

