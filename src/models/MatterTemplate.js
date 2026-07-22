const mongoose = require("mongoose");

const matterTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  practiceArea: {
    type: String,
    enum: ["immigration", "family", "employment", "property", "corporate", "criminal", "other"],
    required: true
  },
  matterType: {
    type: String,
    required: true,
    trim: true
  },
  fundingType: {
    type: String,
    enum: ["fixed_fee", "hourly", "legal_aid", "conditional", "pro_bono", "other"],
    default: "fixed_fee"
  },
  fixedFee: {
    type: Number,
    default: 0
  },
  risk: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "low"
  },
  priority: {
    type: String,
    enum: ["normal", "urgent", "critical"],
    default: "normal"
  },
  stage: {
    type: String,
    trim: true,
    default: "Initial Assessment"
  },
  // Immigration specific defaults
  immigration: {
    applicationRoute: String,
    applicationLocation: {
      type: String,
      enum: ["inside_uk", "outside_uk", "both"]
    },
    hasDependants: Boolean
  },
  // Family specific defaults
  family: {
    hasChildren: Boolean,
    protectedAddress: Boolean
  },
  // Checklist items
  checklist: [{
    label: {
      type: String,
      required: true
    },
    required: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("MatterTemplate", matterTemplateSchema);
