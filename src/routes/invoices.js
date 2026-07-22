const express = require("express");
const router  = express.Router();
const { getInvoices, createInvoice, recordPayment, markSent } = require("../controllers/invoiceController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("director","admin","supervisor"));

router.get("/",                  getInvoices);
router.post("/",                 createInvoice);
router.post("/:id/payment",      recordPayment);
router.patch("/:id/send",        markSent);

module.exports = router;
