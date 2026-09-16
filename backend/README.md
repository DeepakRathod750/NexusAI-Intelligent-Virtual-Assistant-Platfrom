# NexusAI Enterprise OS - Backend

This backend is built with Node.js, Express, and MongoDB. It powers the NexusAI Enterprise OS with features like AI Chat (Gemini), Document Analysis, and Task Management.

## Prerequisites

- Node.js (v18+)
- Google Cloud Account (for Gemini API)

## Setup

1.  **Clone the repository** (if you haven't already).
2.  **Install dependencies**:
    ```bash
    cd backend
    npm install
    ```
3.  **Environment Variables**:
    - Copy `.env.example` to `.env`.
    - Fill in your MongoDB `MONGO_URI` and Gemini API Key.
    ```bash
    cp .env.example .env
    ```

4.  **MongoDB Setup**:
    - Ensure your MongoDB instance is running (local or Atlas).
    - The app will use Mongoose models to create and manage collections.

## Running the Server

-   **Development**:
    ```bash
    npm run dev
    ```
-   **Production**:
    ```bash
    npm start
    ```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register a new user (bcrypt + JWT)
- `POST /api/auth/login` - Login user (bcrypt + JWT)
- `GET /api/auth/me` - Get the authenticated user

### AI Chat
- `POST /api/ai/chat` - Send message to Gemini
- `GET /api/ai/history` - Get chat history
- `DELETE /api/ai/history` - Clear chat history

### Files
- `POST /api/files/upload` - Upload document

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

## Project Structure

- `config/` - Configuration (MongoDB)
- `controllers/` - Route logic
- `middleware/` - Auth and Upload middleware
- `routes/` - API route definitions
- `services/` - External services (Gemini, email)
- `utils/` - Helpers (Response handler)
