// app.config.js
import appJson from './app.json';

export default {
  ...appJson.expo,  // kế thừa toàn bộ app.json
  android: {
    ...appJson.expo.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
  },
  extra: {
    eas: {
      projectId: "4565f035-4bc5-4e15-83c8-c105a77e240b",
    },
  },
};