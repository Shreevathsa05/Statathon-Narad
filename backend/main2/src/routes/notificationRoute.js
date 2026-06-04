import express from 'express';
import { getNotifications, markAsRead, apiCreateNotification, streamNotifications } from '../controllers/notificationController.js';
import { verifyJWT } from '../middleware/verifyJWT.js';

const router = express.Router();

// All notification routes require authentication
router.use(verifyJWT);

// SSE Stream
router.get('/stream', streamNotifications);

// Get notifications for current user
router.get('/', getNotifications);

// Mark specific notification as read
router.post('/read/:id', markAsRead);

// Create notification (Restricted to certain roles)
router.post('/', apiCreateNotification);

export default router;
