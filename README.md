# Fintelly: AI Loan Advisor

A modern, conversational AI loan advisory system built with React and Gemini API.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- A Google Cloud Project with Gemini API enabled

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Rename `.env.example` to `.env`
   - Paste your Gemini API key into `.env`:
     ```
     API_KEY=AIzaSy...
     ```

3. **Run Locally**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:3000`

## 🏗️ Project Structure
- `components/`: UI components (Chat, Cards, Logo)
- `services/`: Logic layer (Loan Engine, Gemini Integration)
- `pages/`: Static pages (Privacy, Terms)
- `types.ts`: TypeScript definitions
- `constants.ts`: Bank schemes and conversation data

## 🔐 Security Note
This is a client-side prototype. In a real production environment, the API Key should be stored on a backend server, and the API calls should be proxied to prevent exposing credentials.