import CodeBlock from "@/components/code-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileText, Hash, ImageIcon, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const categories = [
  { id: "general", name: "일반 질문" },
  { id: "technical", name: "기술 질문" },
  { id: "career", name: "커리어 질문" },
  { id: "study", name: "스터디 질문" },
];

export default function QuestionWritePage() {
  const navigate = useNavigate(); // Next.js의 useRouter 대신 React Router의 useNavigate 사용
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeBlocks, setCodeBlocks] = useState([]);

  // 이미지 삭제 함수
  const removeImage = (imageId) => {
    setImages(images.filter((img) => img.id !== imageId));
  };

  // 글 등록 함수
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !category) {
      alert("제목, 내용, 카테고리는 필수 입력 항목입니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 실제 구현에서는 API 호출로 데이터 저장
      console.log({
        title,
        content,
        category,
        images: images.map((img) => img.url),
        codeBlocks,
      });

      navigate("/organizations");
    } catch (error) {
      console.error("질문 등록 실패:", error);
      alert("질문 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCodeBlock = () => {
    setCodeBlocks([
      ...codeBlocks,
      { id: Date.now(), code: "", language: "javascript" },
    ]);
  };

  const updateCodeBlock = (id, code) => {
    setCodeBlocks(
      codeBlocks.map((block) => (block.id === id ? { ...block, code } : block))
    );
  };

  const updateCodeLanguage = (id, language) => {
    setCodeBlocks(
      codeBlocks.map((block) =>
        block.id === id ? { ...block, language } : block
      )
    );
  };

  const removeCodeBlock = (id) => {
    setCodeBlocks(codeBlocks.filter((block) => block.id !== id));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                navigate("/organization?tab=classroom&filter=question")
              }
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">질문하기</h1>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-navy-600 text-white hover:bg-navy-700"
          >
            등록
          </Button>
        </div>
      </header>

      <main className="pt-14 pb-20">
        <div className="px-4 space-y-4 max-w-[800px] mx-auto">
          {/* 카테고리 선택 */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="카테고리를 선택해주세요" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 제목 입력 */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="어떤 내용이 궁금하신가요?"
            className="border-0 border-b rounded-none px-0 h-12 text-lg placeholder:text-gray-400"
          />

          {/* 내용 입력 */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="질문 내용을 자세히 작성해주세요.
            
• 질문 배경과 목적
• 시도해본 방법
• 원하는 해결 방향
            
자세한 설명을 통해 더 좋은 답변을 받을 수 있습니다."
            className="border-0 min-h-[300px] resize-none px-0 placeholder:text-gray-400"
          />

          {/* 코드 블록 */}
          {codeBlocks.map((block) => (
            <div key={block.id} className="relative">
              <div className="relative z-10">
                <CodeBlock
                  code={block.code}
                  language={block.language}
                  editable={true}
                  onChange={(language) =>
                    updateCodeLanguage(block.id, language)
                  }
                />
              </div>
              <div className="mt-2">
                <Textarea
                  value={block.code}
                  onChange={(e) => updateCodeBlock(block.id, e.target.value)}
                  placeholder="코드를 입력하세요..."
                  className="font-mono text-sm w-full min-h-[200px]"
                  style={{ whiteSpace: "pre", tabSize: 2 }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/30 dark:text-red-400"
                onClick={() => removeCodeBlock(block.id)}
              >
                코드 블록 삭제
              </Button>
            </div>
          ))}

          {/* 이미지 표시 영역 */}
          {images.map((image) => (
            <div key={image.id} className="relative">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.url || "/placeholder.svg"}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => removeImage(image.id)}
                className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* 하단 툴바 */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="flex items-center h-16 px-4 gap-6">
          <button className="text-gray-600">
            <ImageIcon className="w-6 h-6" />
          </button>
          <button className="text-gray-600" onClick={addCodeBlock}>
            <FileText className="w-6 h-6" />
          </button>
          <button className="text-gray-600">
            <Hash className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
