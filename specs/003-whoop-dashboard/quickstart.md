# Quickstart: Whoop Recovery Dashboard

## Prerequisites

- Node.js 20 LTS or later
- A Whoop developer account with an app registered at [developer.whoop.com](https://developer.whoop.com)
- Your Whoop app's **Client ID** and **Client Secret**
- A **Redirect URI** registered in your Whoop app settings (e.g., `http://localhost:3000/oauth/callback`)

## Setup

1. **Clone and switch to the feature branch**:

    ```bash
    git clone <repo-url>
    cd whoop-performance-engine
    git checkout 003-whoop-dashboard
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Create the `.env` file** from the example:

    ```bash
    cp .env.example .env
    ```

4. **Fill in your Whoop credentials** in `.env`:

    ```env
    WHOOP_CLIENT_ID=your_client_id_here
    WHOOP_CLIENT_SECRET=your_client_secret_here
    WHOOP_REDIRECT_URI=http://localhost:3000/oauth/callback
    PORT=3000
    ```

    Leave the token fields (`WHOOP_ACCESS_TOKEN`, `WHOOP_REFRESH_TOKEN`, `WHOOP_TOKEN_EXPIRES_AT`) empty — the app populates them automatically after first login.

5. **Start the server**:

    ```bash
    npm start
    ```

6. **Open the app** at [http://localhost:3000](http://localhost:3000)

7. **Click "Connect to Whoop"** and authorize with your Whoop account

8. **View your recovery dashboard** — recovery score, HRV, and resting heart rate will display automatically

## Returning Visits

After the first authorization, the app persists your refresh token in `.env`. On subsequent visits or server restarts, you are automatically authenticated — no need to log in again (until the refresh token expires).

## Troubleshooting

| Problem | Solution |
| ------- | -------- |
| "Missing WHOOP_CLIENT_ID" error on startup | Ensure `.env` exists and has `WHOOP_CLIENT_ID` and `WHOOP_CLIENT_SECRET` set |
| Redirect fails after Whoop login | Verify `WHOOP_REDIRECT_URI` in `.env` matches the Redirect URI registered in your Whoop developer app |
| "Recovery data not yet available" | Your Whoop hasn't scored your latest sleep yet — check back after your next sleep is processed |
| Forced to re-authorize unexpectedly | Your refresh token has expired — this is normal; click "Connect to Whoop" again |
