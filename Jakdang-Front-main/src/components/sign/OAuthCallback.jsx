import { useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useSetAtom } from "jotai";
import { accessTokenAtom, userInfoAtom } from "@/jotai/authAtoms";
import realAxios from "axios";
import { jwtDecode } from "jwt-decode";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { provider } = useParams(); // ✅ 여기 수정!
  const setAccessToken = useSetAtom(accessTokenAtom);
  const setUserInfo = useSetAtom(userInfoAtom);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (!token) {
      console.error("code가 없습니다.");
      navigate("/login");
      return;
    }

    const handleOAuth = async () => {
      try {
        setAccessToken(token);
        const decoded = jwtDecode(token);
        const userInfoRes = await realAxios.get(
          `${import.meta.env.VITE_API_URL}/auth/get-info`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUserInfo({
          ...userInfoRes.data.data,
          userId: decoded.userId,
        });
        navigate("/");
      } catch (error) {
        console.error(`${provider} 로그인 실패`, error);
        navigate("/login");
      }
    };

    handleOAuth();
  }, [location, provider, navigate, setAccessToken, setUserInfo]);

  return <div>로그인 중입니다...</div>;
}
