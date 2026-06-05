import { Notification } from '../models/notificationSchema.js';

// Registry for SSE active clients
let activeClients = [];

// Get notifications for the logged-in user based on their role
export const getNotifications = async (req, res, next) => {
  try {
    const userRole = req.user.role; // Set by verifyJWT
    const userId = req.user.userId;

    // Build the query to get notifications for this role or global ones
    const query = {
      targetRoles: { $in: [userRole, 'all', 'admin'] } // Admin receives all or just 'admin' if targeted.
    };
    
    // If user is admin, they can see EVERYTHING.
    const finalQuery = userRole === 'admin' ? {} : query;

    const notifications = await Notification.find(finalQuery)
      .sort({ createdAt: -1 })
      .limit(50); // Fetch latest 50

    // Compute unread count for this user
    const unreadCount = notifications.filter(n => !n.readBy.some(id => id.toString() === userId.toString())).length;

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// Mark a notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { $addToSet: { readBy: userId } }, // Only add if not already present
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// SSE Stream Endpoint
export const streamNotifications = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Establish the connection immediately

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    role: req.user.role,
    res
  };

  activeClients.push(newClient);

  // Send an initial ping to establish connection
  res.write('event: connected\ndata: connected\n\n');

  // Remove client on connection close
  req.on('close', () => {
    activeClients = activeClients.filter(client => client.id !== clientId);
  });
};

// Internal utility to create notifications (called by other controllers)
export const createNotification = async ({ targetRoles, title, message, type, metadata = {} }) => {
  try {
    const notification = new Notification({
      targetRoles,
      title,
      message,
      type,
      metadata
    });
    await notification.save();

    // Broadcast to SSE clients
    activeClients.forEach(client => {
      // Check if client role is targeted or if targeted to 'all' or if client is admin (admin sees all targeted admin)
      if (
        targetRoles.includes(client.role) ||
        targetRoles.includes('all') ||
        client.role === 'admin'
      ) {
        client.res.write(`data: ${JSON.stringify(notification)}\n\n`);
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// API endpoint to create notification (useful for AI service webhook)
export const apiCreateNotification = async (req, res, next) => {
  try {
    // Basic security: only admins or internal services should call this
    if (req.user.role !== 'admin' && req.user.role !== 'sdrd') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { targetRoles, title, message, type, metadata } = req.body;
    
    const notification = await createNotification({ targetRoles, title, message, type, metadata });
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};
