// Firebase Service Account Configuration
// Download your service account key from Firebase Console:
// 1. Go to Project Settings > Service Accounts
// 2. Click "Generate New Private Key"
// 3. Save it as serviceAccountKey.json in this directory

module.exports = {
  type: "service_account",
  project_id: "your-project-id",
  private_key_id: "your-private-key-id",
  private_key: "your-private-key",
  client_email: "firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com",
  client_id: "your-client-id",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxx%40your-project-id.iam.gserviceaccount.com"
};
