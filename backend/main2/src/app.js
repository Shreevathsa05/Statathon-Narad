import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import surveyRoute from "./routes/surveyRoute.js";
import responseRoute from "./routes/responseRoute.js";
import demographicRoute from "./routes/demographicRoute.js";
import campaignRoute from "./routes/campaignRoute.js";
import notificationRoute from "./routes/notificationRoute.js";
import { verifyJWT } from "./middleware/verifyJWT.js";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,          // Required for cookies to flow cross-origin
}));
app.use(express.json());
app.use(cookieParser());

// Public auth routes (login, check-email, setup-password)
app.use('/api/auth', authRoute);

// User management (RBAC protected inside router)
app.use('/api/users', userRoute);

// Protected data routes
app.use('/api/survey', surveyRoute);
app.use('/api/response', responseRoute);
app.use('/api/demographic', demographicRoute);
app.use('/api/campaign', campaignRoute);
app.use('/api/notifications', notificationRoute);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

import errorHandler from "./middleware/errorMiddleware.js"
app.use(errorHandler);

export default app;
