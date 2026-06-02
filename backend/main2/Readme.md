# Statathon-Narad main2 Backend API Documentation

This document outlines the API endpoints available in the `main2` backend service.

## Base URL
The API routes are prefixed by `/api`.

---

## 🚀 Survey Routes
**Base:** `/api/survey`

### 1. Create a Survey
- **Method:** `POST`
- **Endpoint:** `/api/survey/`
- **Description:** Creates a new survey.
- **Request Body:**
  ```json
  {
    "surveyId": "string",
    "name": "string",
    "status": "string", // e.g. "pending", "approved", "active", "complete"
    "createdBy": "string",
    "supportedLanguages": ["english", "hindi"], // Must be a non-empty array
    "categories": [""], // Must be a non-empty array
    "questionSections": [ // Must be a non-empty array (Note: AI generated surveys always prepend a 'Demographics' section first)
      {
        "sectionTitle": "string",
        "questions": [
          {
            "qid": "string",
            "type": "mcq|text|checkbox",
            "text": { "en": "Question text?", "hi": "प्रश्न?" },
            "options": [
              {
                "id": "opt1",
                "label": { "en": "Option 1", "hi": "विकल्प 1" }
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Responses:**
  - `201 Created`: 
    ```json
    {
      "statusCode": 201,
      "data": { /* survey object */ },
      "message": "Survey created successfully",
      "success": true
    }
    ```
  - `400 Bad Request`: Missing required fields (name, status, surveyId, createdBy), or empty arrays for `supportedLanguages`, `categories`, `questionSections`.

### 2. Get All Surveys
- **Method:** `GET`
- **Endpoint:** `/api/survey/`
- **Description:** Fetches a list of all surveys (returns selected fields: name, surveyId, status).
- **Request Body:** None
- **Responses:**
  - `200 OK`:
    ```json
    {
      "statusCode": 200,
      "data": [
        { "name": "Survey 1", "surveyId": "s1", "status": "active" }
      ],
      "message": "Successfully fetched surveys",
      "success": true
    }
    ```

### 3. Get Survey by ID
- **Method:** `GET`
- **Endpoint:** `/api/survey/:survey_id`
- **Description:** Fetches details of a specific survey by its `surveyId`.
- **Request Body:** None
- **Responses:**
  - `200 OK`:
    ```json
    {
      "statusCode": 200,
      "data": { /* survey object */ },
      "message": "Successfully fetched survey",
      "success": true
    }
    ```
  - `404 Not Found`: "Survey not found"
  - `400 Bad Request`: "Survey id is required"

### 4. Update a Survey
- **Method:** `PATCH`
- **Endpoint:** `/api/survey/:survey_id`
- **Description:** Updates fields of an existing survey. Active or completed surveys cannot be updated.
- **Request Body:** Fields to update (e.g., `questionSections`, `name`, etc.)
  ```json
  {
    "status": "active"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "statusCode": 200,
      "data": { /* updated survey object */ },
      "message": "Survey updated successfully",
      "success": true
    }
    ```
  - `400 Bad Request`: "Active or completed surveys cannot be edited", "questionSections must be a non-empty array"
  - `404 Not Found`: "Survey not found"

### 5. Delete a Survey
- **Method:** `DELETE`
- **Endpoint:** `/api/survey/:survey_id`
- **Description:** Deletes a specific survey by its `surveyId`.
- **Request Body:** None
- **Responses:**
  - `200 OK`:
    ```json
    {
      "statusCode": 200,
      "data": {},
      "message": "Survey deleted successfully",
      "success": true
    }
    ```
  - `404 Not Found`: "Survey not found"

---

## 📝 Response Routes
**Base:** `/api/response`

### 1. Submit Survey Response
- **Method:** `POST`
- **Endpoint:** `/api/response/:survey_id`
- **Description:** Submits a response to a given survey. The survey must have an "active" status.
- **Request Body:**
  ```json
  {
    "userInfo": { /* optional user details */ },
    "paraInfo": { /* optional parameters */ },
    "responses": [ // Must be a non-empty array
      {
        "qid": "string",
        "answer": "validOptionId" // String for MCQ/Text, Array of Strings for Checkbox
      }
    ]
  }
  ```
  **Validation Rules per Question Type:**
  - **MCQ:** `answer` is required and must match a valid option `id` defined in the survey.
  - **Text:** `answer` must be a non-empty valid string.
  - **Checkbox:** `answer` must be a non-empty array of valid option `id`s.
- **Responses:**
  - `201 Created`:
    ```json
    {
      "statusCode": 201,
      "data": { /* survey response object */ },
      "message": "Successfully created survey response",
      "success": true
    }
    ```
  - `400 Bad Request`: Invalid response format, invalid `qid`, invalid/missing answers matching constraints.
  - `403 Forbidden`: "Survey is not accepting responses" (if status isn't "active").
  - `404 Not Found`: "Survey not found"

### 2. Get All Responses by Survey ID
- **Method:** `GET`
- **Endpoint:** `/api/response/:survey_id`
- **Description:** Retrieves all responses submitted for a specific survey.
- **Request Body:** None
- **Responses:**
  - `200 OK`:
    ```json
    {
      "statusCode": 200,
      "data": [ /* array of survey response objects */ ],
      "message": "successfully fetched survey response",
      "success": true
# Statathon-Narad main2 Backend API Documentation

This document outlines the API endpoints available in the `main2` backend service.

## Base URL
The API routes are prefixed by `/api`.

---

## 🚀 Survey Routes
**Base:** `/api/survey`

### 1. Create a Survey
- **Method:** `POST`
- **Endpoint:** `/api/survey/`
- **Description:** Creates a new survey.
- **Request Body:**
  ```json
  {
    "surveyId": "string",
    "name": "string",
    "status": "string", // e.g. "pending", "approved", "active", "complete"
    "createdBy": "string",
    "supportedLanguages": ["english", "hindi"], // Must be a non-empty array
    "categories": [""], // Must be a non-empty array
    "questionSections": [ // Must be a non-empty array (Note: AI generated surveys always prepend a 'Demographics' section first)
      {
        "sectionTitle": "string",
        "questions": [
          {
            "qid": "string",
            "type": "mcq|text|checkbox",
            "text": { "en": "Question text?", "hi": "प्रश्न?" },
            "options": [
              {
                "id": "opt1",
                "label": { "en": "Option 1", "hi": "विकल्प 1" }
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Responses:**
  - `201 Created`: 
    ```json
    {
      "statusCode": 201,
      "data": { /* survey object */ },
      "message": "Survey created successfully",
      "success": true
    }
    ```
  - `400 Bad Request`: Missing required fields (name, status, surveyId, createdBy), or empty arrays for `supportedLanguages`, `categories`, `questionSections`.

### 2. Get All Surveys
- **Method:** `GET`
- **Endpoint:** `/api/survey/`
- **Description:** Fetches a list of all surveys (returns selected fields: name, surveyId, status).
- **Request Body:** None
- **Responses:**
  - `200 OK`:
    ```json
    {
      "statusCode": 200,
      "data": [
        { "name": "Survey 1", "surveyId": "s1", "status": "active" }
      ],
      "message": "Successfully fetched surveys",
      "success": true
    }
    ```

### 3. Get Survey by ID
- **Method:** `GET`
- **Endpoint:** `/api/survey/:survey_id`
- **Description:** Fetches details of a specific survey by its `surveyId`.
- **Request Body:** None
- **Responses:**
  - `200 OK`:
    ```json
    {
      "statusCode": 200,
      "data": { /* survey object */ },
      "message": "Successfully fetched survey",
      "success": true
    }
    ```
  - `404 Not Found`: "Survey not found"
  - `400 Bad Request`: "Survey id is required"

### 4. Update a Survey
- **Method:** `PATCH`
- **Endpoint:** `/api/survey/:survey_id`
- **Description:** Updates fields of an existing survey. Active or completed surveys cannot be updated.
- **Request Body:** Fields to update (e.g., `questionSections`, `name`, etc.)
  ```json
  {
    "status": "active"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "statusCode": 200,
      "data": { /* updated survey object */ },
      "message": "Survey updated successfully",
      "success": true
    }
    ```
  - `400 Bad Request`: "Active or completed surveys cannot be edited", "questionSections must be a non-empty array"
  - `404 Not Found`: "Survey not found"

### 5. Delete a Survey
- **Method:** `DELETE`
- **Endpoint:** `/api/survey/:survey_id`
- **Description:** Deletes a specific survey by its `surveyId`.
- **Request Body:** None
- **Responses:**
  - `200 OK`:
    ```json
    {
      "statusCode": 200,
      "data": {},
      "message": "Survey deleted successfully",
      "success": true
    }
    ```
  - `404 Not Found`: "Survey not found"

---

## 📝 Response Routes
**Base:** `/api/response`

### 1. Submit Survey Response
- **Method:** `POST`
- **Endpoint:** `/api/response/:survey_id`
- **Description:** Submits a response to a given survey. The survey must have an "active" status.
- **Request Body:**
  ```json
  {
    "userInfo": { /* optional user details */ },
    "paraInfo": { /* optional parameters */ },
    "responses": [ // Must be a non-empty array
      {
        "qid": "string",
        "answer": "validOptionId" // String for MCQ/Text, Array of Strings for Checkbox
      }
    ]
  }
  ```
  **Validation Rules per Question Type:**
  - **MCQ:** `answer` is required and must match a valid option `id` defined in the survey.
  - **Text:** `answer` must be a non-empty valid string.
  - **Checkbox:** `answer` must be a non-empty array of valid option `id`s.
- **Responses:**
  - `201 Created`:
    ```json
    {
      "statusCode": 201,
      "data": { /* survey response object */ },
      "message": "Successfully created survey response",
      "success": true
    }
    ```
  - `400 Bad Request`: Invalid response format, invalid `qid`, invalid/missing answers matching constraints.
  - `403 Forbidden`: "Survey is not accepting responses" (if status isn't "active").
  - `404 Not Found`: "Survey not found"

### 2. Get All Responses by Survey ID
- **Method:** `GET`
- **Endpoint:** `/api/response/:survey_id`
- **Description:** Retrieves all responses submitted for a specific survey.
- **Request Body:** None
- **Responses:**
  - `200 OK`:
    ```json
    {
      "statusCode": 200,
      "data": [ /* array of survey response objects */ ],
      "message": "successfully fetched survey response",
      "success": true
    }
    ```
  - `404 Not Found`: "Survey not found"

---

## 🏗️ Recent Architectural Updates (June 2026)

- **Translation Pipeline Stabilization:** Synchronized the `backend/main2` survey schema with `backend/ai` by removing strict `minlength: 1` and `required: true` constraints on the `audio` map. This allows the AI translator to successfully save multi-lingual iterations even if audio is not yet populated.
- **Mongoose Deprecation Fix:** Updated the `surveyController.js` to utilize the modern `returnDocument: 'after'` option during `findOneAndUpdate` calls, replacing the deprecated `new: true` property to silence Mongoose trace warnings and ensure future compatibility.
- **Database Synchronization:** Confirmed that `backend/main2` and `backend/ai` both share the `statathon` MongoDB database to ensure survey data is mutually accessible without synchronization delays or 404 Not Found errors.
- **Port Re-assignment:** `main2` runs on port `3000` (Core Auth/Survey CRUD) while the AI microservice runs on `3001`.
- **ApiResponse Data Unpacking (Frontend Note):** Fixed an issue where API consumers (like `SurveyEditor`) were directly assigning the `ApiResponse` class instance to state instead of accessing the inner `res.data.data` payload. The API standardizes all success payloads within the `data` wrapper property.
