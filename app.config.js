export default {
  expo: {
    name: "Quick_Draw",
    slug: "Quick_Draw",

    android: {
      package: "com.BeHold.Quick_Draw",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    },

    extra: {
      eas: {
        projectId: "4565f035-4bc5-4e15-83c8-c105a77e240b",
      },
    },
  },
};