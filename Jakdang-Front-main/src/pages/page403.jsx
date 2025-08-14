import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const ForbiddenPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
            <div className="max-w-3xl w-full mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <div className="flex justify-center items-center mb-6">
                        {[4, 0, 3].map((num, index) => (
                            <motion.div
                                key={index}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 20,
                                    delay: index * 0.1 + 0.3,
                                }}
                                className="text-9xl font-bold text-navy-600 mx-2"
                            >
                                {num}
                            </motion.div>
                        ))}
                    </div>

                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                    >
                        접근 권한이 없습니다
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-gray-600 mb-8 max-w-md mx-auto"
                    >
                        요청하신 페이지에 접근할 수 있는 권한이 없습니다. 로그인이 필요하거나 접근 권한이 제한된 페이지입니다.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="mb-8"
                    >
                        <div className="relative w-64 h-64 mx-auto">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg
                                    className="w-full h-full text-red-100"
                                    viewBox="0 0 100 100"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                </svg>
                            </div>
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <svg
                                    className="w-32 h-32 text-navy-600"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    <circle cx="12" cy="16" r="1"></circle>
                                </svg>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                    className="flex flex-col sm:flex-row justify-center items-center gap-4"
                >
                    <Button
                        variant="default"
                        size="lg"
                        onClick={() => navigate("/")}
                        className="min-w-40"
                    >
                        홈으로 이동
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigate(-1)}
                        className="min-w-40"
                    >
                        이전 페이지로 이동
                    </Button>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    className="text-gray-500 text-sm mt-12"
                >
                    권한 관련 문제가 지속될 경우 관리자에게 문의해 주세요.
                </motion.p>
            </div>
        </div>
    );
};

export default ForbiddenPage;
