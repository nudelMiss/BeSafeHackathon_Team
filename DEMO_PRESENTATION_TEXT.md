# Demo Presentation Text for Hackathon

## App Overview for Claude

I need help preparing a demo presentation for a tech hackathon. Here's what our app does:

**BeSafe - My Digital Sister** is a full-stack web application designed to help young girls (ages 12-18) handle mentally offensive online incidents. The app provides AI-powered analysis, emotional support, and actionable guidance through an empathetic chat interface.

### Key Features:

1. **Interactive Chat Interface**
   - Natural conversation flow with typing indicators showing verbs (מקלידה, מנתחת, חושבת, בודקת)
   - Personalized messages using the user's chosen nickname
   - Multiple-choice emotion selection at the beginning
   - Sequential question flow collecting incident details

2. **AI-Powered Risk Assessment**
   - Analyzes messages using OpenAI GPT-4o-mini
   - Categorizes incidents: גרומינג (grooming), הטרדה (harassment), לחץ מיני (sexual pressure), שיימינג (shaming), etc.
   - Assesses risk level: נמוך (low), בינוני (medium), גבוה (high)
   - Provides personalized explanations and support

3. **Reply Suggestions**
   - Offers three tone options: עדינה (gentle), נחרצת (assertive), לא להגיב (no reply)
   - Pre-written responses tailored to the situation
   - Explanations for why each tone fits the specific incident

4. **Email Alerts**
   - Automatically sends email to responsible adult when risk level is גבוה (high)
   - Includes incident details, risk assessment, and recommendations
   - Uses Resend email service

5. **User History**
   - Tracks all reports by nickname
   - Shows summary of previous incidents with dates and analysis
   - Adjusts response tone based on user history (more direct for repeat users)

6. **Emotional Support**
   - Supportive messages throughout the conversation
   - Music player at the end with feeling-specific relaxing music
   - Empathetic, non-judgmental language

### Technical Stack:
- **Frontend**: React (Vite), CSS Modules, Axios
- **Backend**: Node.js, Express, OpenAI API, Resend (email)
- **Data Storage**: JSON file-based storage (reports.json)

### User Flow:
1. User enters chat and provides nickname
2. Selects emotions (multiple choice)
3. Optionally provides email for responsible adult
4. Describes the incident message
5. Provides context (channel, sender type)
6. AI analyzes and provides:
   - Support line with nickname
   - Explanation
   - Risk level and category
   - Email confirmation (if sent)
7. User selects reply tone
8. Sees suggested response with explanation
9. Chooses to see report history or end chat
10. If ending: sees music player for relaxation

### Demo Scenarios:
- **High Risk**: Grooming attempts, sexual pressure, threats
- **Medium Risk**: Persistent harassment, boundary crossing
- **Low Risk**: Shaming, judgmental comments, uncomfortable situations

### What Makes It Special:
- **Empathetic Design**: Uses nickname throughout, supportive language, pink rounded UI
- **Context-Aware**: Considers user history, adjusts tone for repeat users
- **Actionable**: Provides specific reply suggestions, not just advice
- **Safe**: Automatic alerts for high-risk situations
- **Accessible**: Simple, clean interface suitable for young users

Please help me create:
1. A compelling 3-5 minute demo script
2. Key talking points highlighting the problem we're solving
3. Technical highlights to mention
4. Impact/benefits for the target audience
5. Next steps/future improvements to mention

