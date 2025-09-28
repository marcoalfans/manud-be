# ManudBE API

A powerful backend API for travel and destination management built with Node.js, Express, and Firebase.

## API Endpoints
|             Endpoint          | Method |                                      Body                                      |                     Description                   | JWT Token |
| :---------------------------: | :----: | :----------------------------------------------------------------------------: | :-----------------------------------------------: | :-------: |
|   /                           |   GET  |                                   -                                            | Accessing our root endpoints                      |  &#9744;  |
|   /auth/register              |  POST  |                           email, password, name                                | Register account for new user                     |  &#9744;  |
|   /auth/login                 |  POST  |                             email, password                                    | Login to access the feature in application        |  &#9744;  |
|   /auth/google                |   GET  |                                   -                                            | Login with Google Account                         |  &#9744;  |
|   /auth/forgot-password       |  POST  |                                email                                           | Send Forgot Password email for user               |  &#9744;  |
|   /auth/logout                |   GET  |                                   -                                            | Logout for user                                   |  &#9745;  |
|   /auth/token-validation      |   GET  |                                   -                                            | JWT Token Validation                              |  &#9745;  |
|   /users                      |   GET  |                                   -                                            | Show all users                                    |  &#9745;  |
|   /users/profile              |   GET  |                                   -                                            | Show the detail data from user                    |  &#9745;  |
|   /users/update               |   PUT  |`Anything you want to edit from:` name, gender, phone                           | Edit profile from user                            |  &#9745;  |
|   /users/delete               | DELETE |                                   -                                            | Delete profile from user                          |  &#9745;  |
|   /users/upload-image         |  POST  |                                image                                           | Upload profile image from user                    |  &#9745;  |
|   /destinations               |   GET  |                                   -                                            | Show all destinations                             |  &#9744;  |
|/destinations/detail/`{dataId}`|   GET  |                                   -                                            | Show the detail destinations                      |  &#9745;  |
|   /destinations/saved         |   GET  |                                   -                                            | Show all saved destinations                       |  &#9745;  |
|   /destinations/add           |  POST  |                                  id                                            | Add destination to saved                          |  &#9745;  |
|   /destinations/delete        | DELETE |                                  id                                            | Delete saved destination                          |  &#9745;  |
|   /chatbot                    |  POST  |                                prompt                                          | Ask travel tips/question for chatbot              |  &#9745;  |

## Firebase | Cloud Firestore
Database structure for ManudBE application using Firestore collections.

## Running Locally
```console
npm install
```
```console
npm run dev
```
> [!NOTE]
> Open http://localhost:7777 with `Postman` or your API testing tool.

## Environment Variables
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=7777
HOST=localhost

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30

# Google AI Configuration
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

## Deploy to Firebase Functions (Optional)
```console
npm install -g firebase-tools
```
```console
firebase init
```
```console
npm run deploy
```

## Deploy to Digital Ocean Droplet (Recommended)

> 📖 **Detailed deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step instructions.

### Quick Setup:
```console
# On your Digital Ocean droplet
git clone https://github.com/marcoalfans/manud-be.git
cd manud-be
npm install
cp .env.example .env
# Edit .env with your configuration
npm install -g pm2
pm2 start src/app.js --name "manudbe-api"
pm2 startup && pm2 save
```

## Alternative: Deploy to Google Cloud Run (Optional)
```console
docker build -t gcr.io/your-project-id/manudbe-api:latest .
```
```console
docker push gcr.io/your-project-id/manudbe-api:latest
```
```console
gcloud run deploy manudbe-api --image gcr.io/your-project-id/manudbe-api:latest --platform managed
```
