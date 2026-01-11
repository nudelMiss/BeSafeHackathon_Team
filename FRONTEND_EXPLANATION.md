# Frontend Chat Implementation - Code Explanation

## Overview
This frontend chat interface is **fully integrated with the backend reports API**. It collects user information about online incidents and sends it to the backend for AI-powered analysis and support. The backend uses user history to provide personalized responses.

## Components Created

### 1. `ChatBubble.jsx` - Message Display Component

**Location**: `client/src/components/ChatBubble/ChatBubble.jsx`

**What it does**: Displays a single message bubble in the chat

**Props explained**:
- `message` - The text to display inside the bubble (supports line breaks with `\n`)
- `isUser` - `true` if it's the user's message (pink, right side), `false` if bot's message (white, left side)
- `isTyping` - Optional: shows typing indicator "..." if true
- `isEmailBadge` - Optional: `true` to display as email confirmation badge (green background)

**How it works**:
- Simple component that receives props and displays them
- Uses CSS classes to style differently based on `isUser`
- Has a fade-in animation when message appears
- Handles line breaks in messages (e.g., for combined severity/category display)
- Supports email badge styling when `isEmailBadge` is true

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

1. **Opening Acknowledgment** - Single selection chip
   - Question: "שלום, אני האחות הדיגיטלית שלך ברשת. אני כאן כדי לעזור לך להתמודד עם אירועים לא נעימים שחווית ברשת. אני שמחה שהחלטת לפנות אליי, בואי ננסה להבין מה קרה."
   - Options: `["אוקי, בואי נתחיל"]`
   - Maps to: `openingAck` (just a confirmation, not sent to backend)

2. **User Identifier (Nickname)** - Text input
   - Question: "איך היית רוצה שאני אקרא לך? את יכולה לתת את השם שלך או כל כינוי שתבחרי."
   - Maps to: `userIdentifier` → sent as `nickname` (string, **required by backend**)

3. **Feeling** - Multiple selection chips
   - Question: "שלום! אני כאן כדי לעזור לך. בואי נתחיל - איך את מרגישה עכשיו? (אפשר לבחור כמה רגשות)"
   - Options: `["מבולבלת", "מבוכה", "סכנה", "פחד", "עצב", "כעס", "חרדה", "רגועה", "תקווה", "אחר"]`
   - Maps to: `feeling` → converted to `context.feelings` (array of Hebrew strings, can be multiple)
   - User can select multiple feelings, must click "סיימתי ✓" to proceed

4. **Responsible Adult Email (Optional)** - Conditional chips → text input
   - Question: "אם יש דבר שמעורר דאגה, אנחנו אולי נרצה ליצור קשר עם מבוגר אחראי שנוכל לסמוך עליו."
   - Options: `["אזין מייל של מבוגר אחראי", "מעדיפה לא לתת מייל"]`
   - If user chooses to provide email: shows text input "אוקיי, הזיני את המייל:"
   - Maps to: `trustedAdultEmail` → sent as `ResponsibleAdultEmail` (optional string)
   - Only sent to backend if user provides an email
   - **Note**: This question appears immediately after the feelings question (reordered flow)

5. **What happened?** - Text input
   - Question: "כתבי כאן את ההודעה שקיבלת שאת רוצה שאני אנתח"
   - Maps to: `messageText` (string)

6. **Where did it happen?** - Single selection chips
   - Question: "באיזה ערוץ זה קרה?"
   - Options: `["רשתות חברתיות", "קבוצה", "פרטי"]`
   - Maps to: `channel` → converted to `context.channel` ("פרטי" or "קבוצה" - **Hebrew values**)
   - Note: "רשתות חברתיות" is mapped to "קבוצה"

7. **Who sent it?** - Single selection chips
   - Question: "מי שלח זאת - מישהו שאת מכירה או זר?"
   - Options: `["מישהו שאני מכירה", "זר"]`
   - Maps to: `senderType` → converted to `context.senderType` ("זר" or "מוכר" - **Hebrew values**)
   - Note: "מישהו שאני מכירה" is mapped to "מוכר"


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
       nickname: userData.userIdentifier || "anonymous",  // Required
       messageText: userData.messageText,
       context: {
         channel: "פרטי" | "קבוצה",  // Hebrew value (mapped from user selection)
         senderType: "זר" | "מוכר",  // Hebrew value (mapped from user selection)
         feelings: userData.feeling  // Array of Hebrew strings (can be multiple)
       },
       ResponsibleAdultEmail: userData.trustedAdultEmail || undefined  // Optional, only if provided
     }
     ```
   - **Mapping Logic**:
     - Channel: "רשתות חברתיות" → "קבוצה", "קבוצה" → "קבוצה", "פרטי" → "פרטי"
     - SenderType: "מישהו שאני מכירה" → "מוכר", "זר" → "זר"
     - Feelings: Already an array (from multiple selection), or converted to array if single
   - Removes `ResponsibleAdultEmail` if undefined (not sent to backend)
   - Calls `analyzeMessage(requestPayload)` from AnalyzeContext
   - Shows typing indicator "אני מעבדת את המידע שלך..."

6. **`showMessageWithTyping(messageText, delay, isEmailBadge)`**
   - Helper function to display messages with typing indicators
   - Shows typing indicator (3 dots) for specified delay (default 1000ms)
   - Replaces typing indicator with actual message after delay
   - Supports email badge styling when `isEmailBadge` is true
   - Used for displaying server response messages sequentially

7. **`startToneSelection(replyOptions)`**
   - Called after backend response is displayed
   - Prompts user: "חשבתי על כמה תגובות שתוכלי לשלוח. באיזה סגנון תרצי להשתמש?"
   - Shows chips: ["תגובה עדינה", "תגובה נחרצת", "לא להגיב"]
   - Sets `isToneSelection` state to true
   - Uses `replyOptions` from backend or `replyOptionsData` from state

8. **`showContinuationPrompt()`**
   - Called after tone selection is completed
   - Displays: "מה תרצי שנעשה מכאן?"
   - Shows chips: ["לעשות משהו נוסף", "לסיים לעת עתה"]
   - Sets `isContinuationPrompt` state to true

9. **`handleContinuationChoice(choice)`**
   - Called when user selects from continuation prompt
   - If "לסיים לעת עתה": displays closing message and shows music player
   - If "לעשות משהו נוסף": displays "איך עוד אוכל לעזור לך?" and enables follow-up help mode

10. **`handleFollowUpQuestion(followUpText)`**
    - Called when user submits a follow-up question in help mode
    - Constructs request payload with existing userData and new follow-up text
    - Sends to backend for analysis
    - Displays response with typing indicators

11. **`handleResourceSelect(resource)`**
    - Called when user selects a reply option in tone selection
    - Maps chip label to key: "תגובה עדינה" → "gentle", "תגובה נחרצת" → "assertive", "לא להגיב" → "noReply"
    - Retrieves reply text from `replyOptionsData[selectedKey]`
    - Shows user's selection as a message
    - If not "noReply", displays the suggested reply text
    - Calls `showContinuationPrompt()` after displaying reply

#### useEffect Hooks:

1. **Auto-scroll**: Scrolls to bottom whenever `messages` array changes
2. **Initialize**: Shows welcome message and first question (nickname) when component loads
3. **Handle Backend Response**: Watches `analyzeResponse`, `analyzeLoading`, and `analyzeError`
   - When response arrives:
     - Removes typing indicator
     - Extracts `riskLevel`, `category`, `explanation`, `replyOptions`, `supportLine`, `emailReport`
     - Saves `replyOptions` to `replyOptionsData` state for tone selection
     - Displays response messages sequentially with typing indicators (1 second delay between each):
       1. Combined message: "רמת הסיכון שמצאנו: [riskLevel]\nהקטגוריה שמצאנו: [category]"
       2. Explanation text
       3. Support line (if exists)
       4. Email confirmation badge (if email sent) or error message (if email failed)
     - After all messages displayed, calls `startToneSelection(replyOptions)`
   - On error: displays user-friendly error message in Hebrew

---

## Data Flow Summary

```
1. Component loads → Opening acknowledgment message + "אוקי, בואי נתחיל" chip appears
2. User clicks chip → User identifier question appears
3. User enters nickname → Saved in userData.userIdentifier
4. Feeling question appears → User can select multiple feelings, clicks "סיימתי ✓" when done
5. Feelings saved → Responsible adult email question appears
6. User chooses to provide email or not → If email chosen, text input appears, user enters email → Saved in userData.trustedAdultEmail
7. What happened question appears → User types messageText → Saved in userData.messageText
8. Where question appears → User selects channel ("רשתות חברתיות", "קבוצה", or "פרטי")
9. Channel saved → Who sent it question appears
10. User selects senderType → Saved in userData.senderType
11. All questions answered → submitData() called
13. Request formatted to match backend:
    {
      nickname: "user123",  // From userIdentifier
      messageText: "...",
      context: {
        channel: "פרטי" | "קבוצה",  // Hebrew (mapped from user selection)
        senderType: "זר" | "מוכר",  // Hebrew (mapped from user selection)
        feelings: ["פחד"]  // Array with single Hebrew string
      },
      ResponsibleAdultEmail: "email@example.com"  // Optional, only if provided
    }
14. POST request to /api/reports → Backend AI analyzes (uses user history)
15. Response received:
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
      emailReport: {  // Only if ResponsibleAdultEmail was provided and riskLevel is "גבוה"
        sent: true | false,
        error: "error message"  // Only if sent is false
      },
      userId: "...",  // Backend returns (can ignore)
      nickname: "...",  // Backend returns (can ignore)
      reportId: "...",  // Backend returns (can ignore)
      createdAt: "..."  // Backend returns (can ignore)
    }
16. Display response messages sequentially with typing indicators (1 second delay):
    - Combined: "רמת הסיכון שמצאנו: [riskLevel]\nהקטגוריה שמצאנו: [category]"
    - Explanation text
    - Support line (if exists)
    - Email confirmation badge (if email sent) or error message (if email failed)
17. Show tone selection prompt: "חשבתי על כמה תגובות שתוכלי לשלוח. באיזה סגנון תרצי להשתמש?"
18. User selects reply option → Shows selected reply text
19. Show continuation prompt: "מה תרצי שנעשה מכאן?" with options ["לעשות משהו נוסף", "לסיים לעת עתה"]
20. If "לסיים לעת עתה": Display closing message + show music player (feeling-specific)
21. If "לעשות משהו נוסף": Display "איך עוד אוכל לעזור לך?" → User can ask follow-up question → Send to backend for analysis
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
  nickname: string,  // REQUIRED - User's nickname/identifier (from userIdentifier question)
  messageText: string,  // The incident/message text
  context: {
    channel: "פרטי" | "קבוצה",  // Where it happened (Hebrew, mapped from user selection)
    senderType: "זר" | "מוכר",  // Who sent it (Hebrew, mapped from user selection)
    feelings: string[]  // Array with single Hebrew feeling string (from feeling question)
  },
  ResponsibleAdultEmail?: string  // OPTIONAL - Only included if user provided email
}
```

**Value Mapping**:
- Channel: User selects "רשתות חברתיות" → sent as "קבוצה", "קבוצה" → "קבוצה", "פרטי" → "פרטי"
- SenderType: User selects "מישהו שאני מכירה" → sent as "מוכר", "זר" → "זר"
- Feelings: Single selection converted to array (e.g., "פחד" → `["פחד"]`)

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
  emailReport?: {  // Only present if ResponsibleAdultEmail was provided and riskLevel is "גבוה"
    sent: boolean,  // true if email sent successfully, false if failed
    error?: string  // Error message if sent is false
  },
  userId: string,  // Backend-generated (can ignore in UI)
  nickname: string,  // Echoed back (can ignore in UI)
  reportId: string,  // Backend-generated (can ignore in UI)
  createdAt: string  // Timestamp (can ignore in UI)
}
```

### How It's Used:
- **`explanation`** → Displayed as main response in chunks (sentence by sentence, 1.5s delay)
- **`supportLine`** → Displayed after explanation in chunks (if exists)
- **`replyOptions`** → Saved to `replyOptionsData` state, then converted to chips for tone selection
- **`riskLevel`** → Mapped to severity (גבוה/בינוני = severe, נמוך = mild) for resource selection
- **`emailReport`** → Logged to console (sent/failed status), not displayed to user
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

### Change Typing Indicator Delay:
In `ChatInterface.jsx`, find `showMessageWithTyping()` calls:
```javascript
await showMessageWithTyping(messageText, 1000); // Change 1000 to different milliseconds
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

## UI/UX Features

### Typing Indicators:
- Shows animated typing indicator (3 dots) before each server response message
- Creates illusion of live chat experience
- Standard delay of 1 second between messages
- Typing indicator is replaced with actual message after delay

### Combined Response Display:
- Risk level and category are displayed together in a single message bubble
- Format: "רמת הסיכון שמצאנו: [riskLevel]\nהקטגוריה שמצאנו: [category]"
- Uses line breaks for clean display

### Email Badge:
- Email confirmation messages use special green badge styling
- Distinct from regular chat bubbles
- Only shown when email is successfully sent

### Layout and Spacing:
- Chat window fits within viewport without scrolling
- Balanced margins from header and footer (20px each)
- Rounded corners on all sides of chat container
- Responsive design with max-width of 800px

### Continuation Flow:
- After tone selection, user is prompted: "מה תרצי שנעשה מכאן?"
- Options: "לעשות משהו נוסף" (continue with follow-up) or "לסיים לעת עתה" (end chat)
- If ending: shows closing message and music player
- If continuing: allows free text input for follow-up questions

### Music Player:
- Appears at the end of chat when user chooses "לסיים לעת עתה"
- Feeling-specific music based on user's selected feelings
- User-controlled (no autoplay)
- Provides relaxation support

## Key Features

### Multiple Selection for Feelings:
- Users can select multiple feelings from the options
- Selected feelings are highlighted
- User must click "סיימתי ✓" button to proceed
- Feelings are stored as an array format for backend: `[feeling1, feeling2, ...]`
- Backend expects `feelings` as an array (can contain multiple items)

### Hebrew Values:
- All backend values use Hebrew:
  - Channel: "פרטי" / "קבוצה"
  - SenderType: "זר" / "מוכר"
  - RiskLevel: "נמוך" / "בינוני" / "גבוה"
  - Feelings: Array of Hebrew strings

### Email Reporting:
- If user provides `ResponsibleAdultEmail` and backend determines `riskLevel === "גבוה"`, backend attempts to send email
- Email status is returned in `emailReport` object:
  - `{ sent: true }` if email sent successfully
  - `{ sent: false, error: "..." }` if email failed (e.g., missing email config)
- Email status is displayed in chat as a badge:
  - Green badge: "✅ נשלח מייל למבוגר אחראי" (if sent successfully)
  - Error message: "לא הצלחתי לשלוח את המייל כרגע, אבל נמשיך הלאה. את יכולה לנסות שוב מאוחר יותר." (if failed)
- Email service requires `RESEND_API_KEY` and `EMAIL_FROM` in backend `.env` file

### User History Integration:
- Backend tracks reports by nickname (userIdentifier)
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
   - Select feelings (can select multiple, must click "סיימתי ✓")
   - Choose to provide email or not (if high risk, email will be sent)
   - Describe the incident
   - Select where it happened
   - Select who sent it
4. Backend will analyze and return response
5. UI will display:
   - Combined risk level and category (with typing indicator)
   - Explanation (with typing indicator)
   - Support line (with typing indicator)
   - Email confirmation badge (if email sent, with typing indicator)
6. User selects reply tone option
7. User chooses to continue or end chat
8. If ending: music player appears
9. If continuing: user can ask follow-up questions

---

That's it! The frontend is fully integrated with the backend reports API. 🎉
