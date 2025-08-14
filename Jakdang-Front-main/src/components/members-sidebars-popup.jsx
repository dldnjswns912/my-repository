"use client";

import { MembersSidebar } from "./members-sidebars";

export function MembersSidebarPopup(props) {
  // 팝업 전용: 헤더 숨김, 스타일 조정 등 필요시 추가
  return <MembersSidebar {...props} hideHeader={true} sourceType="chat" />;
}
