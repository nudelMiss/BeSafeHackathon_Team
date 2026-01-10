# Frontend Chat Implementation - Code Explanation

## What Was Created (Frontend Only)

I've created **only the frontend components**. The backend endpoint needs to be created separately.

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
- `options` - Array of strings, e.g., `["רשתות חברתיות", "אפליקציות הודעות"]`
- `onSelect` - Function that gets called when user clicks a chip. Receives the selected value
- `selectedValue` - Optional: highlights which chip is currently selected

**How it works**:
- Maps through `options` array and creates a button for each
- When clicked, calls `onSelect(option)` with the clicked option
- Highlights selected chip with different styling

---

### 3. `ChatInterface.jsx` - Main Chat Logic Component

**Location**: `client/src/components/ChatInterface/ChatInterface.jsx`

**This is the main component that orchestrates everything!**

#### State Variables (React useState):

1. **`messages`** - Array of all chat messages
   - Each message: `{ text: "...", isUser: true/false, isTyping: true/false }`
   - Used to display all messages in the chat

2. **`currentQuestionIndex`** - Number (0, 1, 2, 3...)
   - Tracks which question we're currently asking
   - Starts at 0, increments after each answer

3. **`userData`** - Object storing all user answers
   - Example: `{ incident: "what happened", location: "רשתות חברתיות", feeling: "פחד" }`
   - Each question has a `key` that becomes a property in this object

4. **`isLoading`** - Boolean
   - `true` when waiting for backend response
   - `false` otherwise

5. **`showChips`** - Boolean
   - `true` when current question uses chips
   - `false` when current question uses text input

6. **`currentOptions`** - Array of strings
   - Stores the chip options for current question
   - Only used when `showChips` is true

7. **`inputText`** - String
   - Stores what user types in text input
   - Cleared after submission

#### Questions Array:

Defined at the top of component. Each question object has:
- `text` - The question to ask
- `type` - `"text"` or `"chips"`
- `key` - Where to save the answer in `userData`
- `options` - Only if type is `"chips"`, array of choices

#### Key Functions:

1. **`handleTextSubmit(text)`**
   - Called when user submits text input
   - Adds user message to `messages` array
   - Saves answer to `userData[question.key]`
   - Calls `moveToNextQuestion()`

2. **`handleChipSelect(value)`**
   - Called when user clicks a chip
   - Adds user's selection as a message
   - Saves answer to `userData[question.key]`
   - Hides chips
   - Calls `moveToNextQuestion()`

3. **`moveToNextQuestion()`**
   - Increments `currentQuestionIndex`
   - If more questions exist: shows next question
   - If all questions done: calls `submitData()`

4. **`submitData()`**
   - Sets `isLoading = true`
   - Shows typing indicator
   - **Sends `userData` to backend**: `axiosInstance.post('/incidents', userData)`
   - Waits for response
   - Calls `displayResponseInChunks()` with response

5. **`displayResponseInChunks(fullResponse)`**
   - Splits response into sentences
   - Displays each sentence with 1.5 second delay
   - Creates illusion of live typing

#### useEffect Hooks:

1. **Auto-scroll**: Scrolls to bottom whenever `messages` array changes
2. **Initialize**: Shows welcome message when component first loads

---

## Data Flow Summary

```
1. Component loads → Welcome message appears
2. User types/selects answer → Saved in userData + Added to messages
3. Next question appears → Repeat step 2
4. All questions answered → submitData() called
5. POST request to /incidents → Backend processes (YOU NEED TO CREATE THIS!)
6. Response received → Split into chunks
7. Chunks displayed one by one → Simulates live chat
```

---

## What You Need to Create (Backend)

The frontend is trying to call: `POST /incidents`

**Expected Request Body**:
```javascript
{
  incident: "what happened...",
  location: "רשתות חברתיות",
  feeling: "פחד",
  wantsHelp: "כן, אני רוצה עזרה"
}
```

**Expected Response**:
```javascript
{
  success: true,
  message: "תודה ששיתפת... [full response text]"
}
```

**Where to create it**:
- Create route: `server/routes/incidents.js`
- Create controller: `server/controllers/incidentController.js`
- Register route in: `server/server.js`

---

## How to Customize

### Change Questions:
Edit the `questions` array in `ChatInterface.jsx`:
```javascript
{
  text: "Your question",
  type: "text" or "chips",
  key: "uniqueKey",
  options: ["Option 1", "Option 2"]  // Only if type is "chips"
}
```

### Change Colors:
Edit the `.module.css` files:
- `ChatBubble.module.css` - Bubble colors
- `ChipSelector.module.css` - Chip colors  
- `ChatInterface.module.css` - Container colors

### Change Chunking Speed:
In `ChatInterface.jsx`, find `displayResponseInChunks()`:
```javascript
await new Promise(resolve => setTimeout(resolve, 1500)); // Change 1500 to different milliseconds
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
      ChipSelector.jsx        ← Chip buttons component
      ChipSelector.module.css ← Chip styles
    ChatInterface/
      ChatInterface.jsx       ← Main chat logic (THIS IS THE BIG ONE!)
      ChatInterface.module.css ← Chat container styles
  pages/
    HomePage/
      HomePage.jsx            ← Now uses ChatInterface
```

---

## Testing Without Backend

The frontend will work, but when it tries to submit data, you'll get an error. To test the UI flow:

1. Comment out the `submitData()` function call
2. Or create a mock response for testing
3. Or create the backend endpoint first!

---

That's it! All the frontend code is ready. The backend is your job! 🎉

