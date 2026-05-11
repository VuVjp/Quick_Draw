# Quick Draw Backend Server

A Node.js Express server with Firebase integration for the Quick Draw application.

## Prerequisites

- Node.js 14+ and npm
- Firebase account
- Firebase project with Firestore database

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` with your configuration values

3. **Firebase Setup:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or use existing one
   - Navigate to **Project Settings** > **Service Accounts**
   - Click **Generate New Private Key**
   - Save the JSON file as `config/serviceAccountKey.json`

## Environment Variables

Create a `.env` file with:

```env
PORT=5000
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Project Structure

```
server/
├── config/
│   ├── firebaseConfig.example.js      # Firebase config template
│   └── serviceAccountKey.json         # Your Firebase credentials (git ignored)
├── routes/
│   └── drawings.js                    # Drawing endpoints
├── .env.example                       # Environment template
├── .gitignore                         # Git ignore file
├── index.js                           # Main server file
├── package.json                       # Dependencies
└── README.md                          # This file
```

## Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- **GET** `/` - Server status
- **GET** `/health` - Health check

### Drawings

#### Create Drawing
- **POST** `/api/drawings`
- Body:
  ```json
  {
    "title": "My Drawing",
    "data": "canvas_data_or_image_string",
    "userId": "user_id"
  }
  ```

#### Get User's Drawings
- **GET** `/api/drawings/user/:userId`

#### Get Single Drawing
- **GET** `/api/drawings/:drawingId`

#### Update Drawing
- **PUT** `/api/drawings/:drawingId`
- Body:
  ```json
  {
    "title": "Updated Title",
    "data": "updated_canvas_data"
  }
  ```

#### Delete Drawing
- **DELETE** `/api/drawings/:drawingId`

## Firestore Collections

### drawings
```
{
  title: string
  data: string (canvas data or base64 image)
  userId: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

## Development Tips

1. **Hot Reload:** Use `npm run dev` to auto-restart on file changes (requires nodemon)

2. **Testing Endpoints:** Use Postman or VS Code REST Client

3. **Firebase Emulator:** For local development without connecting to Firebase:
   ```bash
   npm install -g firebase-tools
   firebase emulators:start
   ```

4. **View Firestore Data:**
   - Open Firebase Console
   - Go to Firestore Database
   - View collections and documents in real-time

## Troubleshooting

**Firebase initialization error:**
- Ensure `config/serviceAccountKey.json` exists and is valid
- Check `.env` file has correct credentials

**Port already in use:**
- Change `PORT` in `.env`
- Or kill the process: `npx kill-port 5000`

**CORS issues:**
- Update `CORS_ORIGIN` in `.env` to match your client URL

## Dependencies

- **express** - Web framework
- **firebase-admin** - Firebase Admin SDK
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **nodemon** (dev) - Auto-reload server

## Next Steps

1. Set up Firebase authentication
2. Add input validation and error handling middleware
3. Implement rate limiting
4. Add logging system
5. Create deployment configuration (Docker, Heroku, etc.)

## License

ISC
