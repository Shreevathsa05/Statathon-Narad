import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  targetRoles: [{
    type: String,
    enum: ['admin', 'sdrd', 'fod', 'field_manager', 'field_agent', 'dpd', 'cqcd', 'all']
  }],
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String, // e.g., 'SURVEY_CREATED', 'SURVEY_TRANSLATED', 'AUDIO_GENERATED', 'SYSTEM'
    default: 'SYSTEM'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, { timestamps: true });

// TTL index to automatically delete notifications 30 days after creation
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const Notification = mongoose.model('Notification', notificationSchema);
