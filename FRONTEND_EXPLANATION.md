# Frontend Chat Implementation - Code Explanation

## Overview
This frontend chat interface is **fully integrated with the backend analyze API**. It collects user information about online incidents and sends it to the backend for AI-powered analysis and support.

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
- `options` - Array of strings or objects with `{label, value}`, e.g., `["פחד", "עצב"]` or `[{label: "שיחה פרטית", value: "private"}]`
- `onSelect` - Function that gets called when user clicks a chip. Receives the selected value
- `selectedValue` - Optional: highlights which chip is currently selected
- `multiple` - Boolean: if `true`, allows multiple selections (returns array)

**How it works**:
- Maps through `options` array and creates a button for each
- When clicked, calls `onSelect(option)` with the clicked option
- For object options, displays the `label` but saves the `value`
- Highlights selected chip(s) with different styling
- Supports both single and multiple selection modes

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
- Calls `POST /api/analyze` endpoint
- Handles backend response structure

#### State Variables (React useState):

1. **`messages`** - Array of all chat messages
   - Each message: `{ text: "...", isUser: true/false, isTyping: true/false }`
   - Used to display all messages in the chat

2. **`currentQuestionIndex`** - Number (0, 1, 2, 3...)
   - Tracks which question we're currently asking
   - Starts at 0, increments after each answer

3. **`userData`** - Object storing all user answers
   - Example: `{ feeling: "פחד", messageText: "what happened...", channel: "private", senderType: "stranger" }`
   - Each question has a `key` that becomes a property in this object
   - **Matches backend API structure**

4. **`showChips`** - Boolean
   - `true` when current question uses chips
   - `false` when current question uses text input

5. **`currentOptions`** - Array of strings
   - Stores the chip options for current question (display labels)
   - Only used when `showChips` is true

6. **`allowMultipleSelection`** - Boolean
   - `true` when current question allows multiple chip selections
   - Currently not used (all questions are single selection)

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
1. **Feeling** - Single selection: `["מבולבלת", "פחד", "עצב", "כעס", "חרדה", "תקווה", "אחר"]`
   - Maps to: `context.feeling` (string)

2. **What happened?** - Text input
   - Maps to: `messageText` (string)

3. **Where did it happen?** - Chips with object options
   - Options: `[{label: "שיחה פרטית", value: "private"}, {label: "קבוצה/צ'אט קבוצתי", value: "group"}]`
   - Maps to: `context.channel` ("private" or "group")

4. **Who sent it?** - Chips with object options
   - Options: `[{label: "מישהו שאני לא מכירה", value: "stranger"}, {label: "מישהו שאני מכירה", value: "known"}]`
   - Maps to: `context.senderType` ("stranger" or "known")

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
   - Adds user's selection as a message
   - Saves answer to `userData[question.key]`
   - Hides chips and calls `moveToNextQuestion()`

3. **`moveToNextQuestion()`**
   - Increments `currentQuestionIndex`
   - If more questions exist: shows next question
   - If all questions done: calls `submitData()`

4. **`submitData()`**
   - Prepares request body matching backend API structure:
     ```javascript
     {
       messageText: userData.messageText,
       context: {
         channel: userData.channel,
         senderType: userData.senderType,
         feeling: userData.feeling
       }
     }
     ```
   - Calls `analyzeMessage(requestBody)` from AnalyzeContext
   - Shows typing indicator

5. **`displayResponseInChunks(fullResponse)`**
   - Splits response into sentences
   - Displays each sentence with 1.5 second delay
   - Creates illusion of live typing

6. **`showFollowUpResources(severityLevel, replyOptions)`**
   - Called after backend response
   - Shows music player (feeling-specific)
   - Converts `replyOptions` object to chip options
   - Displays reply options as chips: gentle, assertive, noReply

7. **`handleResourceSelect(resource)`**
   - Called when user selects a reply option
   - Shows confirmation message
   - Ends the chat flow

#### useEffect Hooks:

1. **Auto-scroll**: Scrolls to bottom whenever `messages` array changes
2. **Initialize**: Shows welcome message and first question when component loads
3. **Handle Backend Response**: Watches `analyzeResponse`, `analyzeLoading`, and `analyzeError`
   - When response arrives: displays `explanation` and `supportLine`
   - Maps `riskLevel` to severity (High/Medium = severe, Low = mild)
   - Shows follow-up resources with music and reply options

---

## Data Flow Summary

```
1. Component loads → Welcome message + First question appears
2. User selects/types answer → Saved in userData + Added to messages
3. Next question appears → Repeat step 2
4. All questions answered → submitData() called
5. Request formatted to match backend:
   {
     messageText: "...",
     context: {
       channel: "private" | "group",
       senderType: "stranger" | "known",
       feeling: "פחד"
     }
   }
6. POST request to /api/analyze → Backend AI analyzes
7. Response received:
   {
     riskLevel: "Low" | "Medium" | "High",
     category: "Grooming" | "Harassment" | etc,
     explanation: "הסבר בעברית...",
     replyOptions: {
       gentle: "תשובה עדינה...",
       assertive: "תשובה תקיפה...",
       noReply: "לא להגיב..."
     },
     supportLine: "משפט תמיכה..."
   }
8. Display explanation + supportLine in chunks
9. Show music player (feeling-specific)
10. Show reply options as chips
11. User selects reply option → Confirmation message
```

---

## Backend API Integration

### Endpoint Used:
- **Route**: `POST /api/analyze`
- **Location**: Already exists in `server/routes/analyze.js`
- **Controller**: `server/controllers/analyzeController.js`

### Request Format:
```javascript
{
  messageText: string,  // The incident/message text
  context: {
    channel: "private" | "group",  // Where it happened
    senderType: "stranger" | "known",  // Who sent it
    feeling: string  // Single feeling string (Hebrew)
  }
}
```

### Response Format:
```javascript
{
  riskLevel: "Low" | "Medium" | "High",
  category: string,  // e.g., "Grooming", "Harassment"
  explanation: string,  // Main response text (Hebrew)
  replyOptions: {
    gentle: string,  // Gentle reply option
    assertive: string,  // Assertive reply option
    noReply: string  // No reply option
  },
  supportLine: string  // Support message (Hebrew)
}
```

### How It's Used:
- **`explanation`** → Displayed as main response in chunks
- **`supportLine`** → Displayed after explanation
- **`replyOptions`** → Converted to chips for user selection
- **`riskLevel`** → Mapped to severity (High/Medium = severe, Low = mild) for resource selection

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
  ]
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

## Key Changes from Initial Version

1. **Integrated with Backend**: Uses `AnalyzeContext` instead of mock
2. **Updated Questions**: Matched to backend API structure
   - Single feeling (not array)
   - `messageText` instead of `incident`
   - `channel` (private/group) instead of `location`
   - Added `senderType` (stranger/known)
   - Removed `wantsHelp`
3. **Backend Response Handling**: Uses `explanation`, `supportLine`, `replyOptions` from backend
4. **Severity Mapping**: Maps `riskLevel` (Low/Medium/High) to severity (mild/severe)
5. **Reply Options**: Backend provides reply options as chips instead of hardcoded resources

---

That's it! The frontend is fully integrated with the backend analyze API. 🎉
