const express = require("express");
const router = express.Router();
const { getCommunications, createCommunication, addAddendum } = require("../controllers/communicationController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.post("/:id/addendum", addAddendum);

// For matter-specific comms, the routes will be mounted under /api/matters/:id/communications 
// but we'll export the controller functions to be used in matters.js route or mount here.

module.exports = router;
