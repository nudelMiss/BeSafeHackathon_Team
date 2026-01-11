# BeSafe - My Digital Sister

A full-stack web application that helps young girls handle mentally offensive online incidents. The app provides AI-powered analysis, support, and guidance through an interactive chat interface.

## 🚀 Tech Stack

**Frontend:**
- React (Vite)
- CSS Modules
- Axios

**Backend:**
- Node.js
- Express
- OpenAI API (GPT-4o-mini)
- Resend (Email service)

## 📁 Project Structure

```
BeSafeHackathon_Team/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components (ChatInterface, ChatBubble, etc.)
│   │   ├── context/       # React context (API calls)
│   │   ├── pages/         # Page components
│   │   └── services/      # API service layer
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── controllers/       # Request handlers (analyzeController, etc.)
│   ├── routes/             # API routes
│   ├── services/          # Business logic (email, report storage)
│   ├── utils/             # Utilities (email templates)
│   └── package.json
│
└── README.md
```

## 🛠️ Installation

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BeSafeHackathon_Team
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

## ⚙️ Configuration

### Server Environment Variables (`server/.env`)
```env
PORT=5000
CLIENT_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_verified_email@domain.com
```

### Client Environment Variables (`client/.env`)
```env
VITE_SERVER_API_URL=http://localhost:5000
```

## 🎯 Usage

### Start the Server
```bash
cd server
npm run dev
```
Server runs on `http://localhost:5000`

### Start the Client
```bash
cd client
npm run dev
```
Client runs on `http://localhost:3000`

## 💬 How It Works

1. User enters chat and provides incident details
2. System analyzes the message using AI
3. Provides risk assessment, category, and support guidance
4. Offers reply suggestions (gentle, assertive, or no reply)
5. Optionally sends email alert to responsible adult (if high risk)

## 📝 Key Features

- **Interactive Chat Interface**: Natural conversation flow with typing indicators
- **AI-Powered Analysis**: Risk level assessment and categorization
- **Reply Suggestions**: Pre-written responses for different situations
- **Email Alerts**: Automatic notifications to responsible adults for high-risk cases
- **User History**: Personalized responses based on previous reports
- **Music Support**: Relaxing music based on user's emotional state

## 📚 Documentation

- **Frontend Details**: See `FRONTEND_EXPLANATION.md` for component architecture
- **Best Practices**: See `BestPractices.md` for team guidelines

## 🐛 Troubleshooting

- Ensure both server and client `.env` files are configured
- Check that ports 3000 and 5000 are available
- Verify API keys are set correctly in server `.env`
- Check browser console and server logs for errors

## 📧 Support

For issues or questions, contact: [queenb.community@gmail.com](mailto:queenb.community@gmail.com)

**Happy Coding! 💙**
