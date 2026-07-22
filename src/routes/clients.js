const express = require("express");
const router  = express.Router();
const { getClients, getClientById, createClient, updateClient, updateAML } = require("../controllers/clientController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

router.get("/",           getClients);
router.get("/:id",        getClientById);
router.post("/",          authorize("director","admin","supervisor","fee_earner"), createClient);
router.patch("/:id",      authorize("director","admin","supervisor","fee_earner"), updateClient);
router.patch("/:id/aml",  authorize("director","admin","supervisor","compliance"), updateAML);

module.exports = router;
