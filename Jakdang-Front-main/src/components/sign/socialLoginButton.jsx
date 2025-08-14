import { Button } from "@/components/ui/button";
import { useAxios } from "@/hooks/useAxios";
import googleRegister from "@/lib/google/googleRegister";
import googleUserInfo from "@/lib/google/googleUserInfo";
import appleRegister from "@/lib/apple/appleRegister";
import appleUserInfo from "@/lib/apple/appleUserInfo";
import { accessTokenAtom, userInfoAtom } from "@/jotai/authAtoms";
import { useSetAtom } from "jotai";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import realAxios from "axios";

export default function SocialLoginButton({ provider, isSignup = false }) {
  const setAccessToken = useSetAtom(accessTokenAtom);
  const setUserInfo = useSetAtom(userInfoAtom);
  const navigate = useNavigate();
  const axios = useAxios();

  const getProviderInfo = (provider) => {
    switch (provider) {
      case "kakao":
        return {
          name: "카카오로 로그인",
          bgColor: "bg-[#FEE500]",
          textColor: "text-black",
          hoverColor: "hover:bg-[#F6DC00]",
          logo: "/kakao-logo.svg", // 카카오 아이콘 경로
          logoWidth: "w-6",
          logoHeight: "h-6",
        };
      case "naver":
        return {
          name: "네이버로 로그인",
          bgColor: "bg-[#03C75A]",
          textColor: "text-white",
          hoverColor: "hover:bg-[#02B350]",
          logo: "/naver-logo.svg",
          logoWidth: "w-6",
          logoHeight: "h-6",
        };
      case "google":
        return {
          name: "Google 계정으로 로그인",
          bgColor: "bg-white",
          textColor: "text-gray-800",
          hoverColor: "hover:bg-gray-50",
          logo: "/google-logo.svg", // Google 로고 경로
          logoWidth: "w-6",
          logoHeight: "h-6",
          border: "border border-gray-300",
        };
      case "apple":
        return {
          name: "Apple로 로그인",
          bgColor: "bg-black",
          textColor: "text-white",
          hoverColor: "hover:bg-gray-900",
          logo: "/apple-logo.svg", // Apple 로고 경로
          logoWidth: "w-6",
          logoHeight: "h-6",
        };
      default:
        return {
          name: "소셜 로그인",
          bgColor: "bg-gray-200",
          textColor: "text-gray-800",
          hoverColor: "hover:bg-gray-300",
          logo: "",
          logoWidth: "w-6",
          logoHeight: "h-6",
        };
    }
  };

  const {
    name,
    bgColor,
    textColor,
    hoverColor,
    logo,
    logoWidth,
    logoHeight,
    border,
  } = getProviderInfo(provider);

  const handleSocialLogin = async () => {
    // 실제 구현에서는 각 소셜 로그인 API 호출
    console.log(`${name} ${isSignup ? "회원가입" : "로그인"} 시도`);
    switch (provider) {
      case "google":
        try {
          const googleUser = await googleUserInfo();
          const res = await googleRegister(axios, googleUser, isSignup);
          if (res) {
            const token = res.accessToken;
            setAccessToken(token);
            const response = await realAxios.get(
              `${import.meta.env.VITE_API_URL}/auth/get-info`,
              {
                headers: {
                  Authorization: "Bearer " + token,
                },
              }
            );
            const decodedToken = jwtDecode(token);
            const userInfo = {
              ...response.data.data,
              userId: decodedToken.userId,
            };
            setUserInfo(userInfo);
            navigate("/");
          }
        } catch (error) {
          console.error("구글 로그인 에러:", error);
        }
        break;
      case "apple":
        try {
          const appleUser = await appleUserInfo();
          const res = await appleRegister(axios, appleUser, isSignup);
          if (res) {
            const token = res.accessToken;
            setAccessToken(token);
            const infoRes = await realAxios.get(
              `${import.meta.env.VITE_API_URL}/auth/get-info`,
              {
                headers: {
                  Authorization: "Bearer " + token,
                },
              }
            );
            const decodedToken = jwtDecode(token);
            const userInfo = {
              ...infoRes.data.data,
              userId: decodedToken.userId,
            };
            setUserInfo(userInfo);
            navigate("/");
          }
        } catch (error) {
          console.error("애플 로그인 에러:", error);
        }
        break;
      case "kakao":
        try {
          const kakaoAuthUrl = `${
            import.meta.env.VITE_BASE_API_URL
          }/api/oauth2/authorization/kakao`;
          console.log("카카오 로그인", kakaoAuthUrl);
          document.cookie =
            "origin_domain=jakdanglabs.com; path=/; max-age=3600;";
          window.location.href = kakaoAuthUrl;
        } catch (error) {
          console.error("카카오 로그인 에러:", error);
        }
        break;
      case "naver":
        try {
          const naverAuthUrl = `${
            import.meta.env.VITE_BASE_API_URL
          }/api/oauth2/authorization/naver`;
          console.log("네이버 로그인", naverAuthUrl);
          window.location.href = naverAuthUrl;
        } catch (error) {
          console.error("네이버 로그인 에러:", error);
        }
        break;
      default:
        break;
    }
  };

  // 모든 소셜 로그인 버튼에 일관된 디자인 적용
  return (
    <button
      onClick={handleSocialLogin}
      className={`w-full h-12 rounded-lg flex items-center relative px-4 transition-all duration-300 ${bgColor} ${textColor} ${hoverColor} ${
        border || ""
      } hover:scale-[1.01] hover:shadow-md hover:brightness-105`}
    >
      {logo && (
        <img
          src={logo}
          alt={`${name} 로고`}
          className={`${logoWidth} ${logoHeight} object-contain absolute left-4 transition-transform duration-300`}
        />
      )}
      <span className="font-medium w-full text-center">{name}</span>
    </button>
  );
}
