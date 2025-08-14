import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { all, createLowlight } from 'lowlight'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { CodeBlockWithLineNumbers } from '@/components/editor/CodeBlockWithLineNumbers'
import { EditorContent, useEditor } from "@tiptap/react"
import { useEffect, useRef } from 'react'
import Youtube from '@tiptap/extension-youtube'

// 코드 블록 스타일 불러오기
import "../write-modal/write-modal.css"
import "highlight.js/styles/github-dark.css"

// YouTube 확장을 안전하게 처리하는 커스텀 확장 생성
const SafeYoutube = Youtube.extend({
  renderHTML({ HTMLAttributes }) {
    try {
      const { src, ...rest } = HTMLAttributes;
      
      // src가 없거나 유효하지 않은 경우 안전하게 처리
      if (!src) {
        return ['div', { class: 'youtube-embed-error' }, '유효하지 않은 YouTube URL입니다.'];
      }

      return ['div', { class: 'youtube-embed-wrapper', style: 'position:relative;padding-bottom:56.25%;height:0;overflow:hidden;' },
        ['iframe', {
          ...rest,
          src,
          frameborder: 0,
          allowfullscreen: rest.allowfullscreen,
          style: 'position:absolute;top:0;left:0;width:100%;height:100%;border-radius:0.5rem;'
        }]
      ];
    } catch (error) {
      console.error('YouTube 렌더링 오류:', error);
      return ['div', { class: 'youtube-embed-error' }, '동영상을 표시할 수 없습니다.'];
    }
  }
})

export default function TipTabViewer({ post }) {
  const editorRef = useRef(null);

  const lowlight = createLowlight(all)
  const editor = useEditor({
    shouldRerenderOnTransaction: false,
    extensions: [
      Document,
      Paragraph,
      Text,
      CodeBlockWithLineNumbers.configure({
        lowlight,
        HTMLAttributes: {
          class: 'code-block-with-line-numbers',
        },
      }),
      // 안전한 YouTube 확장 사용
      SafeYoutube.configure({
        nocookie: false,
        allowFullscreen: true,
        HTMLAttributes: {
          class: 'rounded-lg my-4',
        },
      }),
    ],
    editable: false,
    content: post?.contents,
    // 오류 방지를 위한 추가 설정
    parseOptions: {
      preserveWhitespace: 'full',
    },
    // editorProps: {
    //   attributes: {
    //     class: 'text-sm placeholder:text-gray-400 no-ring pt-3 min-h-[500px] custom-editor-style h-auto',
    //   },
    // },
  });

  useEffect(() => {
    if (post?.contents) {
      try {
        editor?.commands.setContent(post.contents, false)
      } catch (error) {
        console.error('콘텐츠 설정 오류:', error);
        // 오류 발생 시 기본 텍스트만 표시
        const safeContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '내용을 표시할 수 없습니다.' }] }] };
        editor?.commands.setContent(safeContent, false);
      }
    }
  }, [post]);

  // 컴포넌트 언마운트 시 에디터 정리
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    }
  }, [editor]);

  return (
    <div ref={editorRef} className="tiptap-viewer prose max-w-none">
      {editor && <EditorContent editor={editor} />}
    </div>
  )
}