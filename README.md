# TaskFlow - Intelligent Task Management

A beautiful, production-ready ToDo application with Firebase authentication, real-time synchronization, and AI-powered task generation.

## Features

- **🔐 Firebase Authentication** - Secure email/password authentication
- **📝 Real-time Task Management** - Create, edit, delete, and organize tasks
- **✅ Subtask Support** - Break down complex tasks into manageable subtasks
- **🤖 AI Task Assistant** - Generate structured tasks using OpenAI
- **📱 Responsive Design** - Beautiful UI that works on all devices
- **⚡ Real-time Sync** - Changes sync instantly across devices
- **🎨 Modern UI** - Clean, production-ready design with smooth animations

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Authentication with Email/Password
4. Create a Firestore database
5. Copy your Firebase configuration

### 2. Environment Configuration

1. Copy `.env.example` to `.env`
2. Update the Firebase configuration in `src/services/firebase.ts` with your actual values
3. (Optional) Add your OpenAI API key for AI features

### 3. Firestore Security Rules

Add these security rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Install and Run

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TaskList.tsx
│   │   ├── AddTaskForm.tsx
│   │   └── SubtaskItem.tsx
│   └── ai/
│       └── AIHelper.tsx
├── context/
│   └── AuthContext.tsx
├── pages/
│   ├── LoginPage.tsx
│   └── TasksPage.tsx
├── services/
│   ├── firebase.ts
│   └── ai.ts
└── types/
    └── index.ts
```

## Firebase Firestore Structure

```
users/{userId}/
└── tasks/{taskId}
    ├── title: string
    ├── description?: string
    ├── done: boolean
    ├── createdAt: timestamp
    └── subtasks/{subtaskId}
        ├── title: string
        ├── done: boolean
        └── createdAt: timestamp
```

## Technologies Used

- **React 18** with TypeScript
- **Firebase 10** (Authentication & Firestore)
- **Tailwind CSS** for styling
- **Vite** for development and building
- **Lucide React** for icons
- **OpenAI API** for AI task generation

## License

MIT License - feel free to use this project for your own applications!