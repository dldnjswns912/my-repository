import React from 'react';

// 메모이제이션된 메시지 버블 아이콘 컴포넌트
const MessageBubbleIcon = ((props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
));

MessageBubbleIcon.displayName = 'MessageBubbleIcon';

export default MessageBubbleIcon;