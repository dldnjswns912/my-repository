import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'

export const CodeBlockWithLineNumbers = CodeBlockLowlight.extend({
  addNodeView() {
    return ({ node, editor, getPos }) => {
      // 기본 DOM 요소 생성
      const dom = document.createElement('div')
      dom.classList.add('code-block-with-line-numbers')
      
      // 라인 넘버 컨테이너
      const lineNumbersContainer = document.createElement('div')
      lineNumbersContainer.classList.add('line-numbers')
      dom.appendChild(lineNumbersContainer)
      
      // 코드 컨텐츠를 위한 pre 요소
      const contentDOM = document.createElement('pre')
      contentDOM.classList.add('code-content')
      dom.appendChild(contentDOM)
      
      // 코드 내용에서 라인 수 계산
      const lines = node.textContent.split('\n')
      
      // 라인 넘버 생성
      for (let i = 0; i < lines.length; i++) {
        const lineNumber = document.createElement('div')
        lineNumber.classList.add('line-number')
        lineNumber.textContent = i + 1
        lineNumbersContainer.appendChild(lineNumber)
      }
      
      // 업데이트 함수
      const update = (updatedNode) => {
        if (updatedNode.type.name !== this.name) return false
        
        // 라인 넘버 업데이트
        const newLines = updatedNode.textContent.split('\n')
        
        // 기존 라인 넘버 제거
        lineNumbersContainer.innerHTML = ''
        
        // 새 라인 넘버 추가
        for (let i = 0; i < newLines.length; i++) {
          const lineNumber = document.createElement('div')
          lineNumber.classList.add('line-number')
          lineNumber.textContent = i + 1
          lineNumbersContainer.appendChild(lineNumber)
        }
        
        return true
      }
      
      return {
        dom,
        contentDOM,
        update
      }
    }
  }
}) 