# Firebase research notes

## Official sources checked

- Firebase pricing: https://firebase.google.com/pricing
- Google sign-in for web: https://firebase.google.com/docs/auth/web/google-signin

## Findings

Firebase's official pricing page currently lists a no-cost Spark plan with no payment method needed. For Authentication, non-phone authentication services are included and monthly active users are listed as no-cost up to 50,000. For Cloud Firestore Standard edition, the listed no-cost limits are 1 GiB stored data, 10 GiB/month network egress, 20,000 document writes/day, 50,000 reads/day, and 20,000 deletes/day. This is more than enough for a small personal vinyl catalog, provided the project stays within the quotas.

The official Google sign-in guide says to enable the Google provider in Firebase Console under Authentication > Sign-in method, then use the Firebase Web Auth SDK. The implementation must also use the deployed GitHub Pages hostname as an authorized domain in Firebase Authentication settings. The app should avoid phone authentication because the pricing page marks phone auth as billed per SMS.

Recommended independent stack: GitHub Pages for static hosting, Firebase Authentication with Google provider, and Cloud Firestore for the shared collection. No Manus login or Manus database is needed. The user will need to create/select a Firebase project and provide the web app configuration values through GitHub Actions secrets or a checked-in non-secret Firebase config object; Firebase web config values are identifiers, while Firestore rules and Auth settings provide the security boundary.
