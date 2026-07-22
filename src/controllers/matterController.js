const Matter   = require("../models/Matter");
const Case     = require("../models/Case");
const User     = require("../models/User");
const { createAuditLog } = require("../utils/audit");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const OPEN_STATUSES = ["active", "pending", "on_hold"];
const BULK_STAGE_CHANGES_ENABLED = process.env.ALLOW_BULK_STAGE_CHANGES === "true";

const getImmigrationRouteMeta = (matterType = "", immigration = {}) => {
  const label = `${matterType} ${immigration.applicationRoute || ""}`.toLowerCase();

  if (label.includes("skilled worker")) {
    return {
      routeKey: "skilled_worker",
      requiredFields: ["sponsorName", "sponsorRef"],
      checklist: [
        { code: "sponsor_licence_check", label: "Sponsor licence and CoS reviewed", required: true },
        { code: "salary_threshold_check", label: "Salary and role threshold confirmed", required: true },
      ],
      prompts: [
        "Confirm sponsor licence and CoS before progressing to submission.",
        "Check that salary and SOC role still meet the route threshold.",
      ],
    };
  }

  if (label.includes("student")) {
    return {
      routeKey: "student",
      requiredFields: ["sponsorName"],
      checklist: [
        { code: "cas_review", label: "CAS and course details verified", required: true },
        { code: "maintenance_review", label: "Maintenance evidence reviewed", required: true },
      ],
      prompts: [
        "Check CAS issue date and sponsor status before submission.",
        "Maintenance evidence should cover the route-specific holding period.",
      ],
    };
  }

  if (label.includes("asylum")) {
    return {
      routeKey: "asylum",
      requiredFields: [],
      checklist: [
        { code: "asylum_bundle", label: "Protection narrative and bundle reviewed", required: true },
        { code: "vulnerability_check", label: "Vulnerability and safeguarding review completed", required: true },
      ],
      prompts: [
        "Confirm interpreter / vulnerability adjustments are documented.",
      ],
    };
  }

  if (label.includes("spouse") || label.includes("flr(m)") || label.includes("appendix fm")) {
    return {
      routeKey: "family_route",
      requiredFields: [],
      checklist: [
        { code: "relationship_evidence", label: "Relationship evidence reviewed", required: true },
        { code: "financial_calculation", label: "Financial requirement calculation reviewed", required: true },
      ],
      prompts: [
        "Track financial requirement evidence and expiry-sensitive documents closely.",
      ],
    };
  }

  return {
    routeKey: "general",
    requiredFields: [],
    checklist: [
      { code: "route_review", label: "Route requirements reviewed", required: true },
    ],
    prompts: [],
  };
};

const buildChecklist = ({ practiceArea, matterType, immigration = {}, family = {} }) => {
  const checklist = [
    { code: "conflict_check", label: "Conflict check recorded", required: true },
    { code: "engagement_ready", label: "Engagement / client-care ready", required: true },
    { code: "next_action_logged", label: "Next action recorded", required: true },
  ];

  if (practiceArea === "immigration") {
    const routeMeta = getImmigrationRouteMeta(matterType, immigration);
    checklist.push(
      { code: "id_documents", label: "Identity and passport documents reviewed", required: true },
      ...routeMeta.checklist,
      { code: "submission_complete", label: "Submission marked complete", required: true }
    );
  }

  if (practiceArea === "family") {
    checklist.push(
      { code: "court_data_review", label: "Court data and hearing position reviewed", required: true }
    );
    if (family.hasDomesticAbuse || family.hasChildRisk) {
      checklist.push({ code: "safeguarding_review", label: "Safeguarding escalation reviewed", required: true });
    }
    if (family.isWithoutNotice) {
      checklist.push({ code: "retrospective_review", label: "Retrospective review completed", required: true });
    }
  }

  return checklist;
};

const buildMatterTypeImpactPreview = (matter, nextMatterType) => {
  const nextRouteMeta = getImmigrationRouteMeta(nextMatterType, matter.immigration || {});
  const nextChecklist = buildChecklist({
    practiceArea: matter.practiceArea,
    matterType: nextMatterType,
    immigration: matter.immigration || {},
    family: matter.family || {},
  });

  const currentCodes = new Set((matter.checklist || []).map((item) => item.code || item.label));
  const nextCodes = new Set(nextChecklist.map((item) => item.code || item.label));

  return {
    currentMatterType: matter.matterType,
    nextMatterType,
    warnings: [
      "Review downstream documents, tasks and forms before applying the new matter type.",
      ...(matter.practiceArea === "immigration" ? nextRouteMeta.prompts : []),
    ],
    addedChecklistItems: nextChecklist.filter((item) => !currentCodes.has(item.code || item.label)),
    removedChecklistItems: (matter.checklist || []).filter((item) => !nextCodes.has(item.code || item.label)),
    impactedFields: matter.practiceArea === "immigration"
      ? ["applicationRoute", "homeOfficeRef", "sponsorName", "sponsorRef", "legalCalculation"]
      : matter.practiceArea === "family"
        ? ["courtName", "nextHearingDate", "safeguarding controls"]
        : ["matter metadata", "documents", "tasks"],
  };
};

const formatMatter = (m) => ({
  id:           m._id,
  reference:    m.reference,
  clientId:     m.clientId?._id || m.clientId,
  clientName:   m.clientId ? `${m.clientId.firstName} ${m.clientId.lastName}` : "",
  practiceArea: m.practiceArea,
  matterType:   m.matterType,
  description:  m.description,
  ownerId:      m.ownerId?._id || m.ownerId,
  ownerName:    m.ownerId?.name || "",
  supervisorId: m.supervisorId?._id || m.supervisorId,
  supervisorName: m.supervisorId?.name || "",
  status:       m.status,
  stage:        m.stage,
  jurisdiction: m.jurisdiction,
  classification: m.classification,
  risk:         m.risk,
  priority:     m.priority,
  fundingType:  m.fundingType,
  fixedFee:     m.fixedFee,
  totalBilled:  m.totalBilled,
  outstanding:  m.outstanding,
  wip:          m.wip,
  keyDate:      m.keyDate,
  nextActionDate: m.nextActionDate,
  nextActionNote: m.nextActionNote,
  openedAt:     m.openedAt,
  closedAt:     m.closedAt,
  immigration:  m.immigration,
  family:       m.family,
  parties:      m.parties,
  checklist:    m.checklist,
  tags:         m.tags,
  openingGates: m.openingGates,
  isRestricted: m.isRestricted,
  createdFromTemplate: m.createdFromTemplate,
  updatedAt:    m.updatedAt,
});

// ─── Auto-checklist per practice area ────────────────────────────────────────
function getDefaultChecklist(practiceArea, matterType) {
  const mt = (matterType || "").toLowerCase()
  const base = [
    { label: "Client care letter sent and signed",          required: true  },
    { label: "Engagement letter / terms of business agreed",required: true  },
    { label: "Conflict check completed",                    required: true  },
    { label: "AML / CDD screening passed",                  required: true  },
    { label: "Identity documents verified",                 required: true  },
    { label: "Source of funds documented",                  required: true  },
    { label: "Funding agreed and confirmed",                required: true  },
  ]
  if (practiceArea === "immigration") {
    base.push(
      { label: "Current immigration status confirmed",      required: true  },
      { label: "Passport and travel documents obtained",    required: true  },
      { label: "Application form completed and reviewed",   required: true  },
      { label: "Supporting evidence bundle prepared",       required: true  },
      { label: "Fees paid and receipts obtained",           required: true  },
      { label: "Supervisor sign-off before submission",     required: true  },
    )
    if (mt.includes("spouse") || mt.includes("flr")) {
      base.push(
        { label: "Financial requirement evidence reviewed", required: true  },
        { label: "Relationship evidence bundle reviewed",   required: true  },
        { label: "Sponsor financial documents obtained",    required: false },
      )
    }
    if (mt.includes("asylum")) {
      base.push(
        { label: "Asylum interview preparation completed",  required: true  },
        { label: "Protection bundle reviewed",              required: true  },
        { label: "Vulnerability assessment completed",      required: false },
      )
    }
    if (mt.includes("skilled worker")) {
      base.push(
        { label: "CoS and sponsor licence verified",        required: true  },
        { label: "Salary threshold confirmed",              required: true  },
      )
    }
  }
  if (practiceArea === "family") {
    base.push(
      { label: "MIAM / mediation information obtained",     required: true  },
      { label: "Court application prepared",                required: true  },
      { label: "Financial disclosure completed",            required: false },
      { label: "Children's details confirmed",              required: false },
      { label: "Safeguarding checks completed",             required: true  },
    )
  }
  return base
}

// ─── GET /api/matters ─────────────────────────────────────────────────────────
const getMatters = async (req, res, next) => {
  try {
    const { search, status, practiceArea, ownerId, risk, page = 1, limit = 100 } = req.query;
    const filter = {};

    // Restricted matters: fee_earner / paralegal / consultant only see own
    if (["fee_earner","paralegal"].includes(req.user.role)) {
      filter.ownerId = req.user.userId;
    }
    // Consultants only see explicitly shared matters (not restricted)
    if (req.user.role === "consultant") {
      filter.isRestricted = false;
    }

    if (status       && status !== "all")       filter.status       = status;
    if (practiceArea && practiceArea !== "all") filter.practiceArea = practiceArea;
    if (risk         && risk !== "all")         filter.risk         = risk;
    if (ownerId      && ownerId !== "all")      filter.ownerId      = ownerId;
    if (search) {
      filter.$or = [
        { reference:  { $regex: search, $options: "i" } },
        { matterType: { $regex: search, $options: "i" } },
      ];
    }

    const matters = await Matter.find(filter)
      .populate("clientId",   "firstName lastName email")
      .populate("ownerId",    "name email")
      .populate("supervisorId","name")
      .sort({ keyDate: 1, createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Matter.countDocuments(filter);

    // Attach case count per matter
    const matterIds = matters.map((m) => m._id);
    const caseCounts = await Case.aggregate([
      { $match: { matterId: { $in: matterIds } } },
      { $group: { _id: "$matterId", count: { $sum: 1 } } },
    ]);
    const caseCountMap = {};
    caseCounts.forEach((c) => { caseCountMap[c._id.toString()] = c.count; });

    res.json({
      success: true,
      total,
      matters: matters.map((m) => ({
        ...formatMatter(m),
        caseCount: caseCountMap[m._id.toString()] || 0,
      })),
    });
  } catch (err) { next(err); }
};

// ─── GET /api/matters/:id ─────────────────────────────────────────────────────
const getMatterById = async (req, res, next) => {
  try {
    const matter = await Matter.findById(req.params.id)
      .populate("clientId",    "firstName lastName email phone address amlStatus identityVerified")
      .populate("ownerId",     "name email role")
      .populate("supervisorId","name email")
      .populate("createdBy",   "name")
      .populate("openingGates.exceptionBy", "name")
      .populate("immigration.authorisedSignOff.signedBy", "name role")
      .populate("family.retrospectiveReviewCompletedBy", "name role")
      .populate("timeline.createdBy", "name");

    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });

    // Restricted matter check
    if (matter.isRestricted && req.user.role === "consultant") {
      return res.status(403).json({ success: false, message: "Access denied to restricted matter" });
    }

    // Log access to restricted data
    if (matter.isRestricted) {
      await createAuditLog(req, "VIEW", "Matter", matter._id, `Accessed restricted matter: ${matter.reference}`);
    }

    // Get associated cases
    const cases = await Case.find({ matterId: matter._id })
      .populate("assignedTo", "name")
      .select("reference type stage status risk fee outstanding keyDate");

    res.json({ success: true, matter: formatMatter(matter), cases });
  } catch (err) { next(err); }
};

// ─── POST /api/matters ────────────────────────────────────────────────────────
const createMatter = async (req, res, next) => {
  try {
    const {
      clientId, practiceArea, matterType, description,
      ownerId, supervisorId, fundingType, fixedFee, hourlyRate,
      keyDate, nextActionDate, nextActionNote, risk, priority,
      immigration, family, tags, openingGates, createdFromTemplate,
      jurisdiction, classification,
    } = req.body;

    if (!clientId || !practiceArea || !matterType || !ownerId || !supervisorId) {
      return res.status(400).json({ success: false, message: "clientId, practiceArea, matterType, ownerId and supervisorId are required for open matters" });
    }

    if (!nextActionDate || !nextActionNote) {
      return res.status(400).json({ success: false, message: "Open matters must have nextActionDate and nextActionNote" });
    }

    const hasOpeningGateException =
      openingGates &&
      (!openingGates.conflictPassed || !openingGates.amlPassed || !openingGates.engagementSigned || !openingGates.fundingAgreed);
    if (hasOpeningGateException && !openingGates.exceptionReason) {
      return res.status(400).json({ success: false, message: "Exception reason is required when any opening gate is bypassed" });
    }

    const routeMeta = practiceArea === "immigration" ? getImmigrationRouteMeta(matterType, immigration || {}) : null;
    if (practiceArea === "immigration") {
      if (!immigration?.applicationRoute) {
        return res.status(400).json({ success: false, message: "Immigration matters require an application route" });
      }
      if (!immigration?.legalCalculation?.source || !immigration?.legalCalculation?.assumptions || !immigration?.legalCalculation?.reviewer) {
        return res.status(400).json({ success: false, message: "Immigration legal calculations must include source, assumptions and reviewer" });
      }
      const missingRouteField = routeMeta.requiredFields.find((field) => !immigration?.[field]);
      if (missingRouteField) {
        return res.status(400).json({ success: false, message: `Immigration route requires ${missingRouteField}` });
      }
    }

    const isUrgentWithoutNotice = family?.isWithoutNotice;
    if (isUrgentWithoutNotice) {
      if (!family?.shortenedApprovalReason) {
        return res.status(400).json({
          success: false,
          message: "Urgent / without-notice matters require a shortened approval reason"
        });
      }
    }

    const checklist = buildChecklist({
      practiceArea,
      matterType,
      immigration: immigration || {},
      family: {
        ...(family || {}),
        retrospectiveReviewRequired: !!isUrgentWithoutNotice,
      },
    });

    const matter = await Matter.create({
      clientId, practiceArea, matterType, description,
      ownerId, supervisorId, createdBy: req.user.userId,
      fundingType, fixedFee, hourlyRate,
      keyDate, nextActionDate, nextActionNote, risk, priority,
      immigration,
      family: isUrgentWithoutNotice
        ? { ...(family || {}), retrospectiveReviewRequired: true }
        : family,
      checklist,
      tags, openingGates, createdFromTemplate,
      jurisdiction, classification,
      outstanding: fixedFee || 0,
    });

    // Check for safeguarding flags and create escalation
    const hasSafeguardingFlags = (family?.hasDomesticAbuse || family?.hasChildRisk);
    if (hasSafeguardingFlags) {
      // Get all supervisors and compliance officers for escalation
      const escalationUsers = await User.find({ 
        role: { $in: ["supervisor", "compliance", "director"] } 
      });
      
      matter.timeline.push({
        type:        "audit",
        description: `SAFEGUARDING ESCALATION TRIGGERED: ${family?.hasDomesticAbuse ? 'Domestic Abuse' : ''} ${family?.hasChildRisk ? 'Child Risk' : ''} flags active`,
        data:        { 
          flags: { domesticAbuse: family?.hasDomesticAbuse, childRisk: family?.hasChildRisk },
          escalationUsers: escalationUsers.map(u => ({ id: u._id, name: u.name, email: u.email }))
        },
        createdBy:   req.user.userId,
        isAudit:     true,
      });
    }

    // Add creation event to timeline
    matter.timeline.push({
      type:        "created",
      description: `Matter opened: ${matterType}`,
      data:        isUrgentWithoutNotice ? { urgentWithoutNotice: true } : undefined,
      createdBy:   req.user.userId,
      isAudit:     true,
    });
    if (practiceArea === "immigration" && routeMeta?.prompts.length) {
      matter.timeline.push({
        type: "compliance",
        description: "Immigration route prompts generated",
        data: { prompts: routeMeta.prompts },
        createdBy: req.user.userId,
        isAudit: true,
      });
    }
    if (isUrgentWithoutNotice) {
      matter.timeline.push({
        type: "audit",
        description: "Shortened approval flow invoked with retrospective review required",
        data: { shortenedApprovalReason: family.shortenedApprovalReason },
        createdBy: req.user.userId,
        isAudit: true,
      });
    }
    await matter.save();

    await createAuditLog(req, "CREATE", "Matter", matter._id, `Opened matter: ${matter.reference} (${matterType})${createdFromTemplate ? ` [TEMPLATE: ${createdFromTemplate}]` : ""}${isUrgentWithoutNotice ? " [URGENT/WITHOUT NOTICE]" : ""}`);
    if (hasSafeguardingFlags) {
      await createAuditLog(req, "ESCALATION", "Matter", matter._id, `SAFEGUARDING ESCALATION for matter: ${matter.reference}`);
    }
    res.status(201).json({ success: true, matter: formatMatter(matter) });
  } catch (err) { next(err); }
};

// ─── PATCH /api/matters/:id ───────────────────────────────────────────────────
const updateMatter = async (req, res, next) => {
  try {
    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });

    const oldStage = matter.stage;
    const oldMatterType = matter.matterType;
    const nextMatterType = req.body.matterType || matter.matterType;

    // If updating status to open, or already open, ensure required fields are present
    const newStatus = req.body.status || matter.status;
    if (OPEN_STATUSES.includes(newStatus)) {
      // Check required fields
      const checkOwnerId = req.body.ownerId !== undefined ? req.body.ownerId : matter.ownerId;
      const checkSupervisorId = req.body.supervisorId !== undefined ? req.body.supervisorId : matter.supervisorId;
      const checkStage = req.body.stage !== undefined ? req.body.stage : matter.stage;
      const checkNextActionDate = req.body.nextActionDate !== undefined ? req.body.nextActionDate : matter.nextActionDate;
      const checkNextActionNote = req.body.nextActionNote !== undefined ? req.body.nextActionNote : matter.nextActionNote;
      
      if (!checkOwnerId || !checkSupervisorId || !checkStage || !checkNextActionDate || !checkNextActionNote) {
        return res.status(400).json({ 
          success: false, 
          message: "Open matters must have owner, supervisor, stage and next action" 
        });
      }
    }

    const nextFamily = req.body.family ? { ...(matter.family?.toObject?.() || matter.family || {}), ...req.body.family } : matter.family;
    if (nextFamily?.isWithoutNotice && !nextFamily.shortenedApprovalReason) {
      return res.status(400).json({
        success: false,
        message: "Urgent / without-notice matters require a shortened approval reason"
      });
    }

    const nextImmigration = req.body.immigration
      ? { ...(matter.immigration?.toObject?.() || matter.immigration || {}), ...req.body.immigration }
      : matter.immigration;
    if ((req.body.practiceArea || matter.practiceArea) === "immigration") {
      if (!nextImmigration?.legalCalculation?.source || !nextImmigration?.legalCalculation?.assumptions || !nextImmigration?.legalCalculation?.reviewer) {
        return res.status(400).json({
          success: false,
          message: "Immigration legal calculations must include source, assumptions and reviewer"
        });
      }
    }

    // Stage change — add timeline event + require reason for deadline changes
    if (req.body.stage && req.body.stage !== oldStage) {
      matter.timeline.push({
        type:        "stage_change",
        description: `Stage changed: ${oldStage} → ${req.body.stage}`,
        data:        { from: oldStage, to: req.body.stage, reason: req.body.stageChangeReason },
        createdBy:   req.user.userId,
        isAudit:     true,
      });
    }

    // Owner/supervisor change — permission controlled
    if (req.body.ownerId || req.body.supervisorId) {
      if (!["director","admin","supervisor"].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Only directors, admins and supervisors can reassign matter ownership" });
      }
      if (req.body.ownerId && req.body.ownerId !== matter.ownerId?.toString()) {
        matter.timeline.push({
          type:        "audit",
          description: `Owner reassigned`,
          data:        { from: matter.ownerId, to: req.body.ownerId },
          createdBy:   req.user.userId,
          isAudit:     true,
        });
      }
    }

    // Check if safeguarding flags are being added
    const oldHasDomesticAbuse = matter.family?.hasDomesticAbuse;
    const oldHasChildRisk = matter.family?.hasChildRisk;
    const newHasDomesticAbuse = req.body.family?.hasDomesticAbuse ?? oldHasDomesticAbuse;
    const newHasChildRisk = req.body.family?.hasChildRisk ?? oldHasChildRisk;
    const safeguardingFlagsAdded = (newHasDomesticAbuse && !oldHasDomesticAbuse) || (newHasChildRisk && !oldHasChildRisk);
    const matterTypeChanged = !!req.body.matterType && req.body.matterType !== matter.matterType;
    
    // Apply updates
    Object.assign(matter, req.body);
    if (matterTypeChanged) {
      const rebuiltChecklist = buildChecklist({
        practiceArea: matter.practiceArea,
        matterType: nextMatterType,
        immigration: nextImmigration || {},
        family: nextFamily || {},
      });
      const existingChecklistMap = new Map(
        (matter.checklist || []).map((item) => [item.code || item.label, item])
      );
      matter.checklist = rebuiltChecklist.map((item) => {
        const existing = existingChecklistMap.get(item.code || item.label);
        return existing
          ? {
              ...item,
              completed: existing.completed,
              completedBy: existing.completedBy,
              completedAt: existing.completedAt,
              naReason: existing.naReason,
              notes: existing.notes,
            }
          : item;
      });
      matter.timeline.push({
        type: "audit",
        description: `Matter type changed: ${oldMatterType} → ${nextMatterType}`,
        createdBy: req.user.userId,
        isAudit: true,
      });
    }
    if (nextFamily?.isWithoutNotice) {
      matter.family = {
        ...(matter.family?.toObject?.() || matter.family || {}),
        ...nextFamily,
        retrospectiveReviewRequired: true,
      };
    }
    await matter.save();

    if (safeguardingFlagsAdded) {
      const escalationUsers = await User.find({ 
        role: { $in: ["supervisor", "compliance", "director"] } 
      });
      matter.timeline.push({
        type:        "audit",
        description: `SAFEGUARDING ESCALATION TRIGGERED: ${newHasDomesticAbuse ? 'Domestic Abuse' : ''} ${newHasChildRisk ? 'Child Risk' : ''} flags added`,
        data:        { 
          flags: { domesticAbuse: newHasDomesticAbuse, childRisk: newHasChildRisk },
          escalationUsers: escalationUsers.map(u => ({ id: u._id, name: u.name, email: u.email }))
        },
        createdBy:   req.user.userId,
        isAudit:     true,
      });
      await matter.save();
      await createAuditLog(req, "ESCALATION", "Matter", matter._id, `SAFEGUARDING ESCALATION for matter: ${matter.reference}`);
    }

    await createAuditLog(req, "UPDATE", "Matter", matter._id, `Updated matter: ${matter.reference}`);
    res.json({ success: true, matter: formatMatter(matter) });
  } catch (err) { next(err); }
};

// ─── POST /api/matters/:id/close ──────────────────────────────────────────────
const closeMatter = async (req, res, next) => {
  try {
    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });
    if (matter.status === "closed") {
      return res.status(400).json({ success: false, message: "Matter is already closed" });
    }

    const { outcome, outcomeNotes, clientFeedback } = req.body;
    if (!outcome) return res.status(400).json({ success: false, message: "Closure outcome is required" });

    // Check all mandatory checklist items are complete
    const incompleteMandatory = (matter.checklist || []).filter(item => item.required && !item.completed && !item.naReason);
    if (incompleteMandatory.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot close matter: ${incompleteMandatory.length} mandatory checklist item(s) are incomplete: ${incompleteMandatory.map(i => i.label).join(", ")}`,
        incompleteItems: incompleteMandatory.map(i => ({ id: i._id, label: i.label })),
      });
    }

    // Check for outstanding balance
    if (matter.outstanding > 0) {
      if (!req.body.balanceException) {
        return res.status(400).json({
          success: false,
          message: `Outstanding balance of £${matter.outstanding} must be cleared or an exception must be noted`,
        });
      }
    }

    matter.status   = "closed";
    matter.closedAt = new Date();
    matter.closure  = { outcome, outcomeNotes, clientFeedback, closedBy: req.user.userId, checklistComplete: true };

    matter.timeline.push({
      type:        "closed",
      description: `Matter closed — Outcome: ${outcome}`,
      data:        { outcome, outcomeNotes, balanceException: req.body.balanceException || null },
      createdBy:   req.user.userId,
      isAudit:     true,
    });
    await matter.save();

    await createAuditLog(req, "UPDATE", "Matter", matter._id, `Matter closed: ${matter.reference} — ${outcome}`);
    res.json({ success: true, matter: formatMatter(matter) });
  } catch (err) { next(err); }
};


// ─── POST /api/matters/:id/reopen ─────────────────────────────────────────────
const reopenMatter = async (req, res, next) => {
  try {
    if (!["director","admin","supervisor"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only director/admin/supervisor can reopen matters" });
    }
    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });

    matter.status   = "active";
    matter.closedAt = undefined;
    matter.timeline.push({
      type:        "reopened",
      description: `Matter reopened — Reason: ${req.body.reason || "Not specified"}`,
      createdBy:   req.user.userId,
      isAudit:     true,
    });
    await matter.save();

    await createAuditLog(req, "UPDATE", "Matter", matter._id, `Matter reopened: ${matter.reference}`);
    res.json({ success: true, matter: formatMatter(matter) });
  } catch (err) { next(err); }
};

// ─── GET /api/matters/:id/timeline ───────────────────────────────────────────
const getTimeline = async (req, res, next) => {
  try {
    const matter = await Matter.findById(req.params.id)
      .populate("timeline.createdBy", "name role")
      .select("timeline reference");
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });

    let events = matter.timeline;

    // Filter by type
    if (req.query.type && req.query.type !== "all") {
      events = events.filter(e => e.type === req.query.type);
    }
    // Filter by date range
    if (req.query.from) events = events.filter(e => new Date(e.createdAt) >= new Date(req.query.from));
    if (req.query.to)   events = events.filter(e => new Date(e.createdAt) <= new Date(req.query.to));

    events = events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // CSV export
    if (req.query.format === "csv") {
      const rows = ["type,description,createdBy,createdAt,isAudit"];
      events.forEach(e => {
        rows.push(`"${e.type}","${(e.description||'').replace(/"/g,"'")}","${e.createdBy?.name||""}","${e.createdAt}","${e.isAudit}"`); 
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=timeline-${matter.reference}.csv`);
      return res.send(rows.join("\n"));
    }

    res.json({ success: true, timeline: events });
  } catch (err) { next(err); }
};


// ─── POST /api/matters/bulk-stage ──────────────────────────────────────────────
const bulkUpdateStage = async (req, res, next) => {
  try {
    if (!BULK_STAGE_CHANGES_ENABLED) {
      return res.status(403).json({
        success: false,
        message: "Bulk stage changes are disabled unless specifically configured"
      });
    }

    const { matterIds, stage, stageChangeReason } = req.body;
    if (!Array.isArray(matterIds) || matterIds.length === 0 || !stage) {
      return res.status(400).json({ success: false, message: "matterIds and stage are required" });
    }

    const matters = await Matter.find({ _id: { $in: matterIds } });
    for (const matter of matters) {
      matter.timeline.push({
        type: "stage_change",
        description: `Stage changed: ${matter.stage} → ${stage}`,
        data: { from: matter.stage, to: stage, reason: stageChangeReason, bulk: true },
        createdBy: req.user.userId,
        isAudit: true,
      });
      matter.stage = stage;
      await matter.save();
    }

    res.json({ success: true, updated: matters.length });
  } catch (err) { next(err); }
};

// ─── POST /api/matters/:id/impact-preview ─────────────────────────────────────
const previewMatterTypeChange = async (req, res, next) => {
  try {
    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });
    if (!req.body.matterType) {
      return res.status(400).json({ success: false, message: "matterType is required" });
    }
    res.json({
      success: true,
      preview: buildMatterTypeImpactPreview(matter, req.body.matterType),
    });
  } catch (err) { next(err); }
};

// ─── POST /api/matters/:id/immigration-signoff ────────────────────────────────
const recordImmigrationSignOff = async (req, res, next) => {
  try {
    if (!["director", "admin", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only supervisors, directors and admins can sign off immigration submissions" });
    }
    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });
    if (matter.practiceArea !== "immigration") {
      return res.status(400).json({ success: false, message: "Sign-off is only available for immigration matters" });
    }
    matter.immigration = {
      ...(matter.immigration?.toObject?.() || matter.immigration || {}),
      authorisedSignOff: {
        signedBy: req.user.userId,
        signedAt: new Date(),
        notes: req.body.notes || "",
      },
    };
    matter.timeline.push({
      type: "audit",
      description: "Immigration submission authorised sign-off recorded",
      createdBy: req.user.userId,
      isAudit: true,
    });
    await matter.save();
    res.json({ success: true, matter: formatMatter(matter) });
  } catch (err) { next(err); }
};

// ─── POST /api/matters/:id/retrospective-review ───────────────────────────────
const completeRetrospectiveReview = async (req, res, next) => {
  try {
    if (!["director", "admin", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only supervisors, directors and admins can complete retrospective reviews" });
    }
    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });
    matter.family = {
      ...(matter.family?.toObject?.() || matter.family || {}),
      retrospectiveReviewRequired: false,
      retrospectiveReviewCompletedAt: new Date(),
      retrospectiveReviewCompletedBy: req.user.userId,
    };
    const checklistItem = (matter.checklist || []).find((item) => item.code === "retrospective_review");
    if (checklistItem) {
      checklistItem.completed = true;
      checklistItem.completedBy = req.user.userId;
      checklistItem.completedAt = new Date();
    }
    matter.timeline.push({
      type: "audit",
      description: "Retrospective review completed",
      data: { notes: req.body.notes || "" },
      createdBy: req.user.userId,
      isAudit: true,
    });
    await matter.save();
    res.json({ success: true, matter: formatMatter(matter) });
  } catch (err) { next(err); }
};

// ─── POST /api/matters/:id/parties ───────────────────────────────────────────
const addParty = async (req, res, next) => {
  try {
    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });
    const { role, name, email, phone, organisation, notes, isProtected } = req.body;
    if (!role || !name) return res.status(400).json({ success: false, message: "role and name required" });
    matter.parties.push({ role, name, email, phone, organisation, notes, isProtected: isProtected || false, addedBy: req.user.userId });
    matter.timeline.push({ type: "audit", description: `Party added: ${name} (${role})`, createdBy: req.user.userId, isAudit: true });
    await matter.save();
    await createAuditLog(req, "CREATE", "MatterParty", matter._id, `Party added: ${name} (${role})`);
    res.json({ success: true, parties: matter.parties });
  } catch (err) { next(err); }
};

// ─── PATCH /api/matters/:id/parties/:partyId ──────────────────────────────────
const updateParty = async (req, res, next) => {
  try {
    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });
    const party = matter.parties.id(req.params.partyId);
    if (!party) return res.status(404).json({ success: false, message: "Party not found" });

    // Track role history before update
    if (req.body.role && req.body.role !== party.role) {
      if (!party.roleHistory) party.roleHistory = [];
      party.roleHistory.push({
        previousRole: party.role,
        changedTo: req.body.role,
        changedBy: req.user.userId,
        changedAt: new Date(),
      });
    }

    // Apply updates
    const allowed = ["role","email","phone","organisation","notes","isProtected","startDate","endDate"];
    allowed.forEach(k => { if (req.body[k] !== undefined) party[k] = req.body[k]; });

    matter.timeline.push({ type: "audit", description: `Party updated: ${party.name}`, createdBy: req.user.userId, isAudit: true });
    await matter.save();
    await createAuditLog(req, "UPDATE", "MatterParty", matter._id, `Party updated: ${party.name}`);
    res.json({ success: true, parties: matter.parties });
  } catch (err) { next(err); }
};

// ─── DELETE /api/matters/:id/parties/:partyId ─────────────────────────────────
const removeParty = async (req, res, next) => {
  try {
    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });
    matter.parties = matter.parties.filter((p) => p._id.toString() !== req.params.partyId);
    await matter.save();
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── PATCH /api/matters/:id/checklist/:itemId ─────────────────────────────────
const updateChecklistItem = async (req, res, next) => {
  try {
    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });
    const item = matter.checklist.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: "Checklist item not found" });
    if (req.body.completed !== undefined) {
      if (req.body.completed && item.code === "submission_complete" && !matter.immigration?.authorisedSignOff?.signedBy) {
        return res.status(400).json({
          success: false,
          message: "Submission cannot be marked complete without authorised sign-off"
        });
      }
      item.completed   = req.body.completed;
      item.completedBy = req.user.userId;
      item.completedAt = new Date();
    }
    if (req.body.naReason) item.naReason = req.body.naReason;
    if (req.body.notes)    item.notes    = req.body.notes;
    await matter.save();
    res.json({ success: true, checklist: matter.checklist });
  } catch (err) { next(err); }
};

// ─── POST /api/matters/:id/notes ─────────────────────────────────────────────
const addNote = async (req, res, next) => {
  try {
    const { text, isPrivate } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Note text required" });
    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });
    matter.timeline.push({
      type:        "note",
      description: text,
      data:        { isPrivate: isPrivate || false },
      createdBy:   req.user.userId,
      isAudit:     false,
    });
    await matter.save();
    res.json({ success: true, message: "Note added" });
  } catch (err) { next(err); }
};

module.exports = {
  getMatters, getMatterById, createMatter, updateMatter,
  closeMatter, reopenMatter, getTimeline, bulkUpdateStage,
  previewMatterTypeChange, recordImmigrationSignOff, completeRetrospectiveReview,
  addParty, removeParty, updateParty, updateChecklistItem, addNote,
};

