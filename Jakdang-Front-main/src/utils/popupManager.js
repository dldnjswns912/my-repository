/**
 * 팝업 윈도우 관리 유틸리티
 * 브라우저 팝업 윈도우를 생성하고 관리합니다
 */

class PopupManager {
  constructor() {
    this.popups = new Map(); // 팝업 윈도우들을 저장
    this.setupMessageListener();
  }

  /**
   * 팝업과 부모 윈도우 간의 메시지 통신 설정
   */
  setupMessageListener() {
    window.addEventListener("message", (event) => {
      // 같은 origin에서 온 메시지만 처리
      if (event.origin !== window.location.origin) return;

      const { type, data } = event.data;

      switch (type) {
        case "POPUP_READY":
          this.handlePopupReady(event.source, data);
          break;
        case "POPUP_CLOSING":
          this.handlePopupClosing(event.source, data);
          break;
        case "CHAT_MESSAGE":
          this.handleChatMessage(data);
          break;
        default:
          break;
      }
    });
  }
  /**
   * 채팅 리스트 팝업을 엽니다
   */
  openChatList() {
    console.log("채팅 리스트 팝업 열기 시도");

    // 고유한 팝업 ID 생성 (여러 개 팝업을 위해)
    const timestamp = Date.now();
    const popupId = `chat-list-${timestamp}`;

    console.log("새로운 채팅 리스트 팝업 생성:", popupId);
    const width = 400;
    const height = 700;

    // 기존 팝업들과 겹치지 않도록 위치 조정
    const existingChatListPopups = Array.from(this.popups.keys()).filter(
      (key) => key.startsWith("chat-list")
    );
    const offset = existingChatListPopups.length * 30;
    // 랜덤 위치 조정 (-200 ~ 200)
    const randomX = Math.floor(Math.random() * 401) - 200;
    const randomY = Math.floor(Math.random() * 401) - 200;
    const left = (screen.width - width) / 2 + offset + randomX;
    const top = (screen.height - height) / 2 + offset + randomY; // 팝업에서 localStorage에서 직접 토큰을 가져다 쓰도록 URL 파라미터 없이 열기
    const url = `/popup-chat`;

    const popup = window.open(
      url,
      popupId,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=no`
    );
    if (popup) {
      console.log("채팅 리스트 팝업 생성됨:", popupId);
      console.log("현재 열린 팝업 수:", this.popups.size + 1);
      this.popups.set(popupId, popup);

      // 팝업이 로드된 후 인증 정보 전달
      const checkLoaded = setInterval(() => {
        try {
          if (popup.document.readyState === "complete") {
            clearInterval(checkLoaded);
            console.log("팝업 로드 완료, 인증 정보 전달");
            // 팝업에 인증 정보 전달
            popup.postMessage(
              {
                type: "AUTH_INFO",
                data: {
                  token: localStorage.getItem("accessToken"),
                  userInfo: localStorage.getItem("userInfo"),
                },
              },
              window.location.origin
            );
          }
        } catch (e) {
          // 크로스 오리진 에러 무시
        }
      }, 100);

      // 팝업이 닫혔는지 주기적으로 체크
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log("채팅 리스트 팝업 닫힘:", popupId);
          console.log("남은 팝업 수:", this.popups.size - 1);
          this.popups.delete(popupId);
          clearInterval(checkClosed);
          clearInterval(checkLoaded);
        }
      }, 1000);
    } else {
      console.error("팝업 차단됨");
      alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
    }

    return popup;
  }
  /**
   * 특정 채팅방 팝업을 엽니다
   */
  openChatRoom(roomId, roomName) {
    console.log("채팅방 팝업 열기:", { roomId, roomName });
    const popupId = `chat-room-${roomId}`;

    if (this.popups.has(popupId) && !this.popups.get(popupId).closed) {
      console.log("기존 채팅방 팝업에 포커스");
      this.popups.get(popupId).focus();
      return;
    }
    const width = 512;
    const height = 700;
    // 여러 채팅창이 겹치지 않도록 위치 조정
    const offset = this.popups.size * 30;
    // 랜덤 위치 조정 (-200 ~ 200)
    const randomX = Math.floor(Math.random() * 401) - 200;
    const randomY = Math.floor(Math.random() * 401) - 200;
    const left = (screen.width - width) / 2 + offset + randomX;
    const top = (screen.height - height) / 2 + offset + randomY; // 팝업에서 localStorage에서 직접 토큰을 가져다 쓰도록 URL 파라미터 없이 열기
    const url = `/popup-chat/room/${roomId}`;

    const popup = window.open(
      url,
      popupId,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=no`
    );
    if (popup) {
      console.log("채팅방 팝업 생성됨");
      this.popups.set(popupId, popup);

      // 팝업이 닫혔는지 주기적으로 체크
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log("채팅방 팝업 닫힘:", roomId);
          this.popups.delete(popupId);
          clearInterval(checkClosed);
        }
      }, 1000);
    } else {
      console.error("채팅방 팝업 차단됨");
      alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
    }

    return popup;
  }

  /**
   * 팝업 준비 완료 처리
   */
  handlePopupReady(popupWindow, data) {
    console.log("팝업 준비 완료:", data);
    // 필요시 팝업에 초기 데이터 전송
  }

  /**
   * 팝업 닫기 처리
   */
  handlePopupClosing(popupWindow, data) {
    // 팝업이 닫힐 때 정리 작업
    for (const [id, popup] of this.popups.entries()) {
      if (popup === popupWindow) {
        this.popups.delete(id);
        break;
      }
    }
  }

  /**
   * 채팅 메시지 처리
   */
  handleChatMessage(data) {
    // 메인 윈도우에서 채팅 메시지 관련 처리
    console.log("채팅 메시지:", data);
  }

  /**
   * 모든 팝업 닫기
   */
  closeAllPopups() {
    for (const popup of this.popups.values()) {
      if (!popup.closed) {
        popup.close();
      }
    }
    this.popups.clear();
  }

  /**
   * 특정 팝업 닫기
   */
  closePopup(popupId) {
    const popup = this.popups.get(popupId);
    if (popup && !popup.closed) {
      popup.close();
      this.popups.delete(popupId);
    }
  }

  /**
   * 열린 팝업 목록 반환
   */
  getOpenPopups() {
    const openPopups = [];
    for (const [id, popup] of this.popups.entries()) {
      if (!popup.closed) {
        openPopups.push({ id, popup });
      }
    }
    return openPopups;
  }
}

// 싱글톤 인스턴스 생성
const popupManager = new PopupManager();

export default popupManager;
