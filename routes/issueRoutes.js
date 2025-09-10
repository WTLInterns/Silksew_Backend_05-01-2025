const express = require("express")
const router = express.Router()
const { getIssues, getIssueById, createIssue, updateIssueStatus } = require("../controllers/issueControllers")
const { protect } = require("../middleware/authMiddleware")

router.route("/").get(protect, getIssues).post(protect, createIssue)

router.route("/:id").get(protect, getIssueById)

router.route("/:id/status").put(protect, updateIssueStatus)

module.exports = router

