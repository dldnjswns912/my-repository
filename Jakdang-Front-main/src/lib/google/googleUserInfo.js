import { initializeApp } from "@firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "@firebase/auth";

export default async function googleUserInfo() {
  // Firebase 구성 정보
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    authDomain: import.meta.env.VITE_GOOGLE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_GOOGLE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_GOOGLE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_GOOGLE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_GOOGLE_APP_ID,
    measurementId: import.meta.env.VITE_GOOGLE_MEASURE_ID
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();

  const result = await signInWithPopup(auth, googleProvider);

  // Firebase 사용자 정보 가져오기
  const user = result.user;
  //const credential = GoogleAuthProvider.credentialFromResult(result);
  const firebaseToken = await user.getIdToken();

  const userInfo = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    providerId: user.providerId
  }

  const googleUser = {
    accessToken: firebaseToken,
    userInfo,
  }

  // 로그인 정보 표시
  //console.log(googleUser);

  return googleUser;
}