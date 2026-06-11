# Auth Implementation Notes

Base route: `/api/auth`

This file summarizes the auth routes in `src/routes/authRoute.js`, the required inputs, and the JSON output shape returned by each route.

## 1. `POST /api/auth/check-email`
Checks whether an email exists and returns the user status.

Required input:
- Body:
  - `email` - string

Output format:
```json
{
  "status": "pending_setup | active | suspended",
  "role": "string"
}
```

## 2. `POST /api/auth/setup-password`
Sets the initial password for a user whose status is `pending_setup`.

Required input:
- Body:
  - `email` - string
  - `password` - string, minimum 8 characters

Output format:
```json
{
  "message": "Password set successfully",
  "user": {
    "id": "string",
    "email": "string",
    "role": "string",
    "name": "string"
  }
}
```

## 3. `POST /api/auth/login`
Logs in an existing user and issues access and refresh cookies.

Required input:
- Body:
  - `email` - string
  - `password` - string

Output format:
```json
{
  "message": "Login successful",
  "user": {
    "id": "string",
    "email": "string",
    "role": "string",
    "name": "string"
  }
}
```

## 4. `GET /api/auth/refresh`
Issues a new access token from the refresh token cookie.

Required input:
- Cookies:
  - `refreshToken` - required

Output format:
```json
{
  "message": "Token refreshed"
}
```

## 5. `POST /api/auth/logout`
Logs out the current user and clears auth cookies.

Required input:
- Authentication:
  - Protected by `verifyJWT`
  - Requires a valid access token in the `accessToken` cookie or `token` query parameter

Output format:
```json
{
  "message": "Logged out"
}
```

## 6. `GET /api/auth/me`
Returns the authenticated user payload.

Required input:
- Authentication:
  - Protected by `verifyJWT`
  - Requires a valid access token in the `accessToken` cookie or `token` query parameter

Output format:
```json
{
  "user": {
    "userId": "string",
    "email": "string",
    "role": "string",
    "name": "string"
  }
}
```

## 7. `POST /api/auth/start/:surveyId`
Starts Aadhaar or phone-based OTP verification for a survey.

Required input:
- Params:
  - `surveyId` - string
- Body:
  - `value` - string, Aadhaar number or phone number depending on `mode`
  - `mode` - string, one of `aadhaar` or `phone`

Output format:
```json
{
  "statusCode": 200,
  "data": {
    "phone": "+91xxxxxxxxxx"
  },
  "message": "OTP sent successfully",
  "success": true
}
```

## 8. `POST /api/auth/complete/:surveyId`
Completes Aadhaar or phone-based OTP verification.

Required input:
- Params:
  - `surveyId` - string
- Body:
  - `value` - string, Aadhaar number or phone number depending on `mode`
  - `mode` - string, one of `aadhaar` or `phone`
  - `otp` - string

Output format for existing user:
```json
{
  "statusCode": 200,
  "data": {
    "demographic": {
      "fullname": "string",
      "age": "number",
      "gender": "string",
      "primarylanguage": "string",
      "pincode": "string",
      "area": "string"
    }
  },
  "message": "Existing user verified",
  "success": true
}
```

Output format for new user:
```json
{
  "statusCode": 200,
  "data": {
    "demographic": null
  },
  "message": "New user verified",
  "success": true
}
```

## Shared Auth Behavior
- `verifyJWT` reads the access token from the `accessToken` cookie first.
- `verifyJWT` also accepts `token` in the query string.
- On successful login, setup-password, or refresh flow, cookies are used for token persistence.