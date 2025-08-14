export default async function appleRegister(axios, appleUser, isSignup) {
  const strSignup = isSignup ? "회원가입" : "로그인";
  try {
    const res = await axios.fetchPost("/auth/join-sns", {
      accessToken: appleUser.idToken,
      'type': 'apple',
    });

    if (res?.result) {
      if (res.response.resultCode === 200) {
        alert(`${strSignup}에 성공했습니다.`);
      } else if (res.response.resultCode === 400) {
        console.error(
          `${strSignup} 실패: (${res.response.resultCode}) ${res.response.resultMessage}`
        );
        alert(`${res.response.resultMessage}`);
        return;
      } else {
        console.error(
          `${strSignup} 실패: (${res.response.resultCode}) ${res.response.resultMessage}`
        );
        alert(`${strSignup}에 실패했습니다. 다시 시도해주세요.`);
        return;
      }
    } else {
      console.error(`${strSignup} 실패: ${res.response}`);
      alert(`${strSignup}에 실패했습니다. 다시 시도해주세요.`);
      return;
    }

    const data = res.response.data;
    if (data.accessToken && data.refreshToken) {
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
    } else {
      console.error("토큰 정보 없음:", data);
      alert(`${strSignup}에 실패했습니다. 다시 시도해주세요.`);
      return null;
    }
  } catch (error) {
    console.error("서버 통신 오류:", error);
    return null;
  }
}
