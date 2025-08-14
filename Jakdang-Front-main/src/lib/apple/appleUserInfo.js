import { getAuth, OAuthProvider, signInWithPopup } from "@firebase/auth";

export default async function appleUserInfo() {
  // 애플 로그인 프로바이더 설정
  const auth = getAuth();
  const appleProvider = new OAuthProvider("apple.com");
  appleProvider.addScope("email");
  appleProvider.addScope("name");

  try {
    const result = await signInWithPopup(auth, appleProvider);

    // Firebase 사용자 정보 가져오기
    const user = result.user;
    const idToken = await user.getIdToken(); // Firebase-issued ID token

    const appleUser = {
      idToken: idToken,
      user: user,
    };

    return appleUser;
  } catch (error) {
    console.error("애플 로그인 에러:", error);
    throw error;
  }
}
