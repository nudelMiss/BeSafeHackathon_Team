# Frontend Chat Implementation - Code Explanation

## Overview
This frontend chat interface is **fully integrated with the backend reports API**. It collects user information about online incidents and sends it to the backend for AI-powered analysis and support. The backend uses user history to provide personalized responses.

## Components Created

### 1. `ChatBubble.jsx` - Message Display Component

**Location**: `client/src/components/ChatBubble/ChatBubble.jsx`

**What it does**: Displays a single message bubble in the chat

**Props explained**:
- `message` - The text to display inside the bubble
- `isUser` - `true` if it's the user's message (pink, right side), `false` if bot's message (white, left side)
- `isTyping` - Optional: shows typing indicator "..." if true

**How it works**:
- Simple component that receives props and displays them
- Uses CSS classes to style differently based on `isUser`
- Has a fade-in animation when message appears

---

### 2. `ChipSelector.jsx` - Selection Buttons Component

**Location**: `client/src/components/ChipSelector/ChipSelector.jsx`

**What it does**: Shows clickable chip buttons for multiple-choice questions

**Props explained**:
- `options` - Array of strings or objects with `{label, value}`, e.g., `["פחד", "עצב"]` or `[{label: "שיחה פרטית", value: "פרטי"}]`
- `onSelect` - Function that gets called when user clicks a chip. Receives the selected value
- `selectedValue` - Optional: highlights which chip is currently selected (can be string, array, or null)
- `multiple` - Boolean: if `true`, allows multiple selections (returns array)

**How it works**:
- Maps through `options` array and creates a button for each
- When clicked, calls `onSelect(option)` with the clicked option
- For object options, displays the `label` but saves the `value`
- Highlights selected chip(s) with different styling
- Supports both single and multiple selection modes
- For multiple selection, toggles items on/off when clicked

---

### 3. `MusicPlayer.jsx` - Relaxing Music Component

**Location**: `client/src/components/MusicPlayer/MusicPlayer.jsx`

**What it does**: Displays a YouTube embed for feeling-specific relaxing music

**Props explained**:
- `feeling` - The user's selected feeling (used to select appropriate music)

**How it works**:
- Maps feelings to specific YouTube music URLs
- User-controlled (no autoplay)
- Shows in follow-up phase after backend response

---

### 4. `ChatInterface.jsx` - Main Chat Logic Component

**Location**: `client/src/components/ChatInterface/ChatInterface.jsx`

**This is the main component that orchestrates everything!**

#### Integration with Backend:

- Uses `AnalyzeContext` for API calls (imported from `context/AnalyzeContext.jsx`)
- Calls `POST /api/reports` endpoint
- Handles backend response structure with Hebrew values

#### State Variables (React useState):

1. **`messages`** - Array of all chat messages
   - Each message: `{ text: "...", isUser: true/false, isTyping: true/false }`
   - Used to display all messages in the chat

2. **`currentQuestionIndex`** - Number (0, 1, 2, 3, 4...)
   - Tracks which question we're currently asking
   - Starts at 0, increments after each answer

3. **`userData`** - Object storing all user answers
   - Example: `{ nickname: "user123", feelings: ["פחד", "עצב"], messageText: "what happened...", channel: "פרטי", senderType: "זר" }`
   - Each question has a `key` that becomes a property in this object
   - **Matches backend API structure exactly**

4. **`showChips`** - Boolean
   - `true` when current question uses chips
   - `false` when current question uses text input

5. **`currentOptions`** - Array of strings
   - Stores the chip options for current question (display labels)
   - Only used when `showChips` is true

6. **`allowMultipleSelection`** - Boolean
   - `true` when current question allows multiple chip selections (feelings)
   - `false` for single selection questions

7. **`showFollowUp`** - Boolean
   - `true` when showing follow-up resources after backend response
   - `false` during initial question flow

8. **`inputText`** - String
   - Stores what user types in text input
   - Cleared after submission

#### From AnalyzeContext:

- **`analyzeResponse`** - Backend response object
- **`analyzeLoading`** - Boolean: `true` when API call is in progress
- **`analyzeError`** - Error object if API call fails
- **`analyzeMessage(request)`** - Function to call the backend API

#### Questions Array:

Defined at the top of component. Each question object has:
- `text` - The question to ask (in Hebrew)
- `type` - `"text"` or `"chips"`
- `key` - Where to save the answer in `userData` (must match backend structure)
- `options` - Only if type is `"chips"`, array of choices (can be strings or `{label, value}` objects)
- `multiple` - Boolean: if `true`, allows multiple selections

**Current Questions (matched to backend API)**:

1. **Nickname** - Text input
   - Question: "שלום! אני כאן כדי לעזור לך. בואי נתחיל - איך את רוצה להיקרא? (כינוי)"
   - Maps to: `nickname` (string, **required by backend**)

2. **Feelings** - Multiple selection chips
   - Question: "איך את מרגישה עכשיו? (אפשר לבחור כמה רגשות)"
   - Options: `["מבולבלת", "פחד", "עצב", "כעס", "חרדה", "תקווה", "אחר"]`
   - Maps to: `context.feelings` (array of Hebrew strings)
   - User can select multiple feelings
   - Shows "סיימתי ✓" button when at least one is selected

3. **What happened?** - Text input
   - Question: "מה קרה? ספרי לי בקצרה על האירוע או ההודעה שקיבלת."
   - Maps to: `messageText` (string)

4. **Where did it happen?** - Single selection chips
   - Question: "איפה זה קרה?"
   - Options: `[{label: "שיחה פרטית", value: "פרטי"}, {label: "קבוצה/צ'אט קבוצתי", value: "קבוצה"}]`
   - Maps to: `context.channel` ("פרטי" or "קבוצה" - **Hebrew values**)

5. **Who sent it?** - Single selection chips
   - Question: "מי שלח את ההודעה?"
   - Options: `[{label: "מישהו שאני לא מכירה", value: "זר"}, {label: "מישהו שאני מכירה", value: "מוכר"}]`
   - Maps to: `context.senderType` ("זר" or "מוכר" - **Hebrew values**)

#### Key Functions:

1. **`handleTextSubmit(text)`**
   - Called when user submits text input
   - Adds user message to `messages` array
   - Saves answer to `userData[question.key]`
   - Calls `moveToNextQuestion()`

2. **`handleChipSelect(value)`**
   - Called when user clicks a chip
   - Handles both string and object options
   - For object options: displays `label` but saves `value`
   - For multiple selection (feelings):
     - Toggles items on/off
     - Updates message to show current selections
     - Keeps chips visible until "Done" is clicked
   - For single selection:
     - Adds user's selection as a message
     - Saves answer to `userData[question.key]`
     - Hides chips and calls `moveToNextQuestion()`

3. **`handleMultipleSelectionDone()`**
   - Called when user clicks "סיימתי ✓" button
   - Hides chips and moves to next question
   - Only shown for multiple selection questions

4. **`moveToNextQuestion()`**
   - Increments `currentQuestionIndex`
   - If more questions exist: shows next question
   - If all questions done: calls `submitData()`

5. **`submitData()`**
   - Prepares request body matching backend API structure:
     ```javascript
     {
       nickname: userData.nickname,  // Required
       messageText: userData.messageText,
       context: {
         channel: userData.channel,  // "פרטי" or "קבוצה" (Hebrew)
         senderType: userData.senderType,  // "זר" or "מוכר" (Hebrew)
         feelings: userData.feelings  // Array of Hebrew strings
       }
     }
     ```
   - Calls `analyzeMessage(requestBody)` from AnalyzeContext
   - Shows typing indicator

6. **`displayResponseInChunks(fullResponse)`**
   - Splits response into sentences
   - Displays each sentence with 1.5 second delay
   - Creates illusion of live typing

7. **`showFollowUpResources(severityLevel, replyOptions)`**
   - Called after backend response
   - Shows music player (feeling-specific, uses first feeling from array)
   - Converts `replyOptions` object to chip options
   - Displays reply options as chips: gentle, assertive, noReply

8. **`handleResourceSelect(resource)`**
   - Called when user selects a reply option
   - Shows confirmation message
   - Ends the chat flow

#### useEffect Hooks:

1. **Auto-scroll**: Scrolls to bottom whenever `messages` array changes
2. **Initialize**: Shows welcome message and first question (nickname) when component loads
3. **Handle Backend Response**: Watches `analyzeResponse`, `analyzeLoading`, and `analyzeError`
   - When response arrives: displays `explanation` and `supportLine`
   - Maps `riskLevel` to severity (גבוה/בינוני = severe, נמוך = mild)
   - Shows follow-up resources with music and reply options

---

## Data Flow Summary

```
1. Component loads → Welcome message + Nickname question appears
2. User enters nickname → Saved in userData.nickname
3. Feelings question appears → User can select multiple feelings
4. User clicks "סיימתי ✓" → Saved in userData.feelings (array)
5. What happened question → User types messageText
6. Where question → User selects channel ("פרטי" or "קבוצה")
7. Who sent it question → User selects senderType ("זר" or "מוכר")
8. All questions answered → submitData() called
9. Request formatted to match backend:
   {
     nickname: "user123",
     messageText: "...",
     context: {
       channel: "פרטי" | "קבוצה",  // Hebrew
       senderType: "זר" | "מוכר",  // Hebrew
       feelings: ["פחד", "עצב"]  // Array of Hebrew strings
     }
   }
10. POST request to /api/reports → Backend AI analyzes (uses user history)
11. Response received:
    {
      riskLevel: "נמוך" | "בינוני" | "גבוה",  // Hebrew
      category: "גרומינג" | "הטרדה" | etc,  // Hebrew
      explanation: "הסבר בעברית...",
      replyOptions: {
        gentle: "תשובה עדינה...",
        assertive: "תשובה תקיפה...",
        noReply: "לא להגיב..."
      },
      supportLine: "משפט תמיכה...",
      userId: "...",  // Backend returns (can ignore)
      nickname: "...",  // Backend returns (can ignore)
      reportId: "...",  // Backend returns (can ignore)
      createdAt: "..."  // Backend returns (can ignore)
    }
12. Display explanation + supportLine in chunks
13. Show music player (feeling-specific, uses first feeling)
14. Show reply options as chips
15. User selects reply option → Confirmation message
```

---

## Backend API Integration

### Endpoint Used:
- **Route**: `POST /api/reports`
- **Location**: `server/routes/reports.js`
- **Controller**: `server/controllers/analyzeController.js`

### Request Format:
```javascript
{
  nickname: string,  // REQUIRED - User's nickname/identifier
  messageText: string,  // The incident/message text
  context: {
    channel: "פרטי" | "קבוצה",  // Where it happened (Hebrew)
    senderType: "זר" | "מוכר",  // Who sent it (Hebrew)
    feelings: string[]  // Array of Hebrew feeling strings
  }
}
```

### Response Format:
```javascript
{
  riskLevel: "נמוך" | "בינוני" | "גבוה",  // Hebrew
  category: string,  // e.g., "גרומינג", "הטרדה" (Hebrew)
  explanation: string,  // Main response text (Hebrew)
  replyOptions: {
    gentle: string,  // Gentle reply option (Hebrew)
    assertive: string,  // Assertive reply option (Hebrew)
    noReply: string  // No reply option (Hebrew)
  },
  supportLine: string,  // Support message (Hebrew)
  userId: string,  // Backend-generated (can ignore in UI)
  nickname: string,  // Echoed back (can ignore in UI)
  reportId: string,  // Backend-generated (can ignore in UI)
  createdAt: string  // Timestamp (can ignore in UI)
}
```

### How It's Used:
- **`explanation`** → Displayed as main response in chunks
- **`supportLine`** → Displayed after explanation
- **`replyOptions`** → Converted to chips for user selection
- **`riskLevel`** → Mapped to severity (גבוה/בינוני = severe, נמוך = mild) for resource selection
- **`category`** → Can be used for analytics (not displayed to user)

### Backend Features:
- **User History**: Backend tracks reports by nickname and adjusts tone based on previous reports
- **Report Storage**: Each analysis is saved as a report with unique ID
- **Tone Adjustment**: If user has previous reports, backend provides more direct/clear responses

---

## Context Provider Setup

The app is wrapped with `AnalyzeProvider` in `App.jsx`:

```javascript
import { AnalyzeProvider } from './context/AnalyzeContext';

function App() {
  return (
    <AnalyzeProvider>
      {/* ... rest of app ... */}
    </AnalyzeProvider>
  );
}
```

This provides the `analyzeMessage`, `response`, `loading`, and `error` to all components via `useContext(AnalyzeContext)`.

---

## How to Customize

### Change Questions:
Edit the `questions` array in `ChatInterface.jsx`:
```javascript
{
  text: "Your question",
  type: "text" or "chips",
  key: "uniqueKey",  // Must match backend if sending to API
  options: ["Option 1", "Option 2"]  // Only if type is "chips"
  // OR for backend values:
  options: [
    { label: "Display Text", value: "backendValue" }
  ],
  multiple: true  // If multiple selection allowed
}
```

### Change Colors:
Edit the `.module.css` files:
- `ChatBubble.module.css` - Bubble colors
- `ChipSelector.module.css` - Chip colors  
- `ChatInterface.module.css` - Container colors
- `MusicPlayer.module.css` - Music player styles

### Change Chunking Speed:
In `ChatInterface.jsx`, find `displayResponseInChunks()`:
```javascript
await new Promise(resolve => setTimeout(resolve, 1500)); // Change 1500 to different milliseconds
```

### Change Music URLs:
In `MusicPlayer.jsx`, edit the `feelingMusicMap` object:
```javascript
const feelingMusicMap = {
  "פחד": "https://www.youtube.com/embed/YOUR_VIDEO_ID",
  // ... etc
};
```

---

## File Structure

```
client/src/
  components/
    ChatBubble/
      ChatBubble.jsx          ← Message bubble component
      ChatBubble.module.css   ← Bubble styles
    ChipSelector/
      ChipSelector.jsx        ← Chip buttons component (supports single/multiple)
      ChipSelector.module.css ← Chip styles
    ChatInterface/
      ChatInterface.jsx       ← Main chat logic (INTEGRATED WITH BACKEND!)
      ChatInterface.module.css ← Chat container styles
    MusicPlayer/
      MusicPlayer.jsx         ← Music player component
      MusicPlayer.module.css  ← Music player styles
  context/
    AnalyzeContext.jsx        ← Context provider for backend API calls
  pages/
    HomePage/
      HomePage.jsx            ← Uses ChatInterface
  App.jsx                     ← Wrapped with AnalyzeProvider
```

---

## Key Features

### Multiple Selection for Feelings:
- Users can select multiple feelings
- Selected feelings are highlighted
- "סיימתי ✓" button appears when at least one feeling is selected
- Feelings are sent as an array to backend

### Hebrew Values:
- All backend values use Hebrew:
  - Channel: "פרטי" / "קבוצה"
  - SenderType: "זר" / "מוכר"
  - RiskLevel: "נמוך" / "בינוני" / "גבוה"
  - Feelings: Array of Hebrew strings

### User History Integration:
- Backend tracks reports by nickname
- Tone adjusts based on number of previous reports
- More direct responses for repeat users

### Report Storage:
- Each analysis is saved as a report
- Backend returns `reportId`, `userId`, `createdAt`
- Can be used for future features (history view, etc.)

---

## Testing

The frontend is fully integrated with the backend. To test:

1. Start the backend server: `cd server && npm run dev`
2. Start the frontend: `cd client && npm run dev`
3. Go through the chat flow:
   - Enter nickname
   - Select feelings (can select multiple)
   - Describe the incident
   - Select where it happened
   - Select who sent it
4. Backend will analyze and return response
5. UI will display explanation, support line, music, and reply options

---

That's it! The frontend is fully integrated with the backend reports API. 🎉
