import SocialLoginButton from "@/components/sign/socialLoginButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "@/hooks/useLogin"; // 로그인 훅 임포트

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(""); // 이메일을 username으로 변경
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const loginMutation = useLogin();
  const isLoading = loginMutation.isPending;

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      console.log("로그인 시도:", { username, password });
      // useLogin 훅 실행
      await loginMutation.mutateAsync({
        username,
        password,
      });

      // 로그인 성공 로직은 훅 내부에서 처리됨 (토큰 설정 및 경로 이동)

      if (rememberMe) {
        // 로그인 상태 유지 처리 (필요시)
        localStorage.setItem("rememberMe", "true");
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">로그인</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 md:p-8">
          {/* 로고 */}
          <div className="flex justify-center mb-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-rPNOL4x5R207uiAJwotp3sB3Bsc2wj.png"
              alt="JAKDANG LABS"
              width={150}
              height={40}
              className="object-contain"
            />
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  이메일
                </label>
                <Input
                  id="username"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  비밀번호
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked)}
                />
                <label htmlFor="remember-me" className="text-sm text-gray-600">
                  로그인 상태 유지
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                비밀번호 찾기
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-navy-600 text-white hover:bg-navy-700 dark:bg-navy-500 dark:hover:bg-navy-600"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          {/* 소셜 로그인 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">간편 로그인</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              <SocialLoginButton provider="kakao" />
              <SocialLoginButton provider="google" />
              <SocialLoginButton provider="apple" />
            </div>
          </div>

          {/* 회원가입 링크 */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              아직 계정이 없으신가요?{" "}
              <Link
                to="/signup"
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
