"use client";

import { useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogContent2,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SelectionCopyDialog({ isOpen, onOpenChange, selectedText }) {
    const textAreaRef = useRef(null);

    // 복사 기능
    const handleCopy = () => {
        if (selectedText) {
            navigator.clipboard
                .writeText(selectedText)
                .then(() => {
                    alert("텍스트가 복사되었습니다.");
                })
                .catch((err) => {
                    console.error("텍스트 복사 중 오류 발생:", err);
                });
        }
    };

    // 다이얼로그가 열릴 때 텍스트 자동 선택
    useEffect(() => {
        if (isOpen && textAreaRef.current) {
            // 약간의 지연 후 텍스트 선택 (DOM이 완전히 렌더링된 후)
            setTimeout(() => {
                textAreaRef.current.focus();
                textAreaRef.current.select();
            }, 50);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent2 className="p-0 border border-gray-200 shadow-md rounded-lg max-w-sm w-full overflow-hidden">
                <DialogHeader className="p-3 border-b bg-[#FEE500] rounded-t-lg flex justify-between items-center">
                    <DialogTitle className="text-sm font-medium">선택 복사</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 max-h-[200px] overflow-y-auto">
                        <textarea
                            ref={textAreaRef}
                            className="w-full resize-none border-none focus:outline-none focus:ring-0 p-0 text-sm"
                            value={selectedText}
                            readOnly
                            rows={Math.min(8, selectedText.split("\n").length + 1)}
                            style={{ minHeight: "80px" }}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={handleCopy}
                            className="bg-[#FEE500] text-black hover:bg-[#FDD835] rounded-md"
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            복사하기
                        </Button>
                    </div>
                </div>
            </DialogContent2>
        </Dialog>
    );
}
