# Fintelly: AI Loan Advisor - Project Report

## 1. Executive Summary
Fintelly is a high-fidelity, AI-powered conversational agent designed to simplify the complex process of loan planning for users in the Indian market. By replacing traditional, lengthy banking forms with an intuitive chat interface, Fintelly collects financial data, assesses creditworthiness in real-time, and generates professional-grade underwriting reports.

The system leverages a hybrid architecture: a deterministic **Rule-Based Loan Engine** for instant, accurate mathematical assessments, combined with **Generative AI (Google Gemini)** for qualitative analysis and real-time market data retrieval.

---

## 2. Technical Architecture

### Stack
*   **Frontend Library:** React 18 (TypeScript)
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS (Utility-first framework)
*   **Animations:** Framer Motion (Transitions, typing indicators, smooth scrolling)
*   **Generative AI:** Google Gemini API (`@google/genai`)
*   **PDF Generation:** `jspdf` (Client-side vector PDF generation)
*   **Icons/Assets:** SVG components and Base64 encoded logos

### Design Pattern
The application follows a **Client-Side Agentic Architecture**. There is no backend database; all logic runs in the browser.
1.  **UI Layer:** Handles user input and displays chat stream.
2.  **Service Layer:** Contains "Agents" (Eligibility, Risk, Prediction) that process data.
3.  **Integration Layer:** Communicates with Gemini API for dynamic content.

---

## 3. Core Functionalities

### A. Conversational Data Collection
Instead of forms, users interact with a linear chatbot.
*   **File:** `components/ChatInterface.tsx`, `constants.ts`
*   **Logic:** A state machine tracks `stepIndex`. As the user answers, data is aggregated into a `UserData` object.
*   **UX:** Includes typing delays, auto-scrolling, and input validation.

### B. The Loan Engine (The "Brain")
Located in `services/loanEngine.ts`, this module processes the raw user data using banking heuristics. It consists of four sub-agents:

1.  **Eligibility Agent:**
    *   Validates constraints (e.g., Age 21-65, Income > ₹25k).
    *   Returns specific reasons for ineligibility (e.g., "CIBIL score below 650").
2.  **Risk Analysis Agent:**
    *   Calculates **FOIR** (Fixed Obligation to Income Ratio): `(Existing EMI / Income) * 100`.
    *   Classifies risk as **Low** (<40%), **Medium** (40-60%), or **High** (>60%).
3.  **Prediction Agent (Scoring Model):**
    *   Calculates an "Approval Probability" score (0-98%) based on weighted factors:
        *   **CIBIL Score:** 40 points
        *   **FOIR:** 30 points
        *   **Income Stability:** 20 points
        *   **Age/Demographics:** 10 points
    *   *Note:* The score is capped at 98% to reflect real-world banking compliance where 100% guarantees do not exist.
4.  **Recommendation Agent:**
    *   Filters a static database of 20+ bank schemes (`BANK_SCHEMES`).
    *   Matches based on Loan Type, Tenure caps, and CIBIL thresholds.
    *   Sorts results by Interest Rate (lowest first).

### C. Live Market Sync (Gemini Grounding)
*   **File:** `services/geminiService.ts` -> `fetchLatestBankRates`
*   **Functionality:**
    *   Users can click "Sync Market Rates".
    *   The app sends a prompt to Gemini 1.5 Flash: *"Latest Home Loan interest rates for HDFC Bank in India..."*
    *   **Google Search Tool** is enabled, allowing the model to scrape the web for current data.
    *   Returns structured JSON (Rate, Fee, Tenure) to update the UI in real-time.

### D. Institutional Report (PDF)
*   **File:** `components/ChatInterface.tsx` -> `downloadReport`
*   **Functionality:** Generates a downloadable A4 PDF using `jspdf`.
*   **Features:**
    *   **Vector Graphics:** Draws branding bars and boxes programmatically.
    *   **Base64 Images:** Embeds bank logos and the Fintelly logo.
    *   **AI Summary:** Fetches a professional narrative from Gemini ("The applicant demonstrates strong creditworthiness...") to include in the PDF.
    *   **Hyperlinks:** Bank cards in the PDF are clickable, leading to official portals.

---

## 4. File Structure & Explanation

```
/
├── index.html              # Entry point
├── src/
│   ├── App.tsx             # Main Layout & Navigation (Home/Privacy/Schemes)
│   ├── constants.ts        # Static Data (Questions, Bank Assets, Schemes)
│   ├── types.ts            # TypeScript Interfaces (Type safety)
│   ├── components/
│   │   ├── ChatInterface.tsx    # Main Chat Logic & PDF Generator
│   │   ├── MessageBubble.tsx    # Chat bubble UI component
│   │   ├── RecommendationCard.tsx # Visual card for Bank Schemes
│   │   ├── FintellyLogo.tsx     # SVG Component
│   │   └── BotAvatar.tsx        # SVG Component
│   ├── services/
│   │   ├── loanEngine.ts        # Mathematical Logic & Rules
│   │   └── geminiService.ts     # Google AI API Integration
│   └── pages/                   # Static Content pages
│       ├── PrivacyPolicy.tsx
│       └── TermsOfService.tsx
```

---

## 5. Performance & Complexity Analysis

### Time Complexity
*   **Local Processing:** `O(1)`
    *   Risk calculations and Prediction scoring use simple arithmetic operations.
*   **Bank Filtering:** `O(N log N)`
    *   Filtering and sorting the list of banks (N ≈ 20) is computationally negligible.
*   **PDF Generation:** `O(1)` (Dependent on fixed layout size, not data scale).
*   **Network Calls (AI):** `O(Latency)`
    *   The bottleneck is the API call to Google Gemini, typically taking 1.5s - 3.0s.

### Accuracy & Reliability
*   **Math:** 100% deterministic. The engine will always output the same probability for the same input.
*   **Data:** The `BANK_SCHEMES` constant acts as a fallback database. The "Live Sync" feature enhances accuracy by fetching up-to-the-minute rates, making the tool robust against static data staleness.

---

## 6. Deployment Guide

1.  **Prerequisites:** Node.js v16+, Google Cloud API Key.
2.  **Setup:**
    ```bash
    npm install
    ```
3.  **Environment:**
    Create a `.env` file:
    ```
    API_KEY=your_google_gemini_key
    ```
4.  **Run:**
    ```bash
    npm run dev
    ```
5.  **Build:**
    ```bash
    npm run build
    ```
    The `dist` folder can be hosted on any static site provider (Vercel, Netlify, GitHub Pages).
