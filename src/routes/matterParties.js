const express = require("express");
const router  = express.Router({ mergeParams: true }); // to access :caseId
const { getParties, addParty, updateParty, removeParty } = require("../controllers/matterPartyController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/",           getParties);
router.post("/",          addParty);
router.patch("/:partyId", updateParty);
router.delete("/:partyId",removeParty);

module.exports = router;
