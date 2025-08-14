import React, { useEffect } from 'react';
import './infocss.css';

const MainInfo = () => {

  useEffect(() => {
  const script = document.createElement('script');
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=79b58ee4222355e39d5fd379b508e092&autoload=false`;
  script.async = true;

  script.onload = () => {
    window.kakao.maps.load(() => {
      const container = document.getElementById('kakao-map');
      const options = {
        center: new window.kakao.maps.LatLng(37.545285, 126.950369), // 마포구 백범로 23
        level: 3,
      };
      const map = new window.kakao.maps.Map(container, options);

      // 마커 추가
      const marker = new window.kakao.maps.Marker({
        position: options.center,
      });
      marker.setMap(map);
    });
  };

  document.head.appendChild(script);
}, []);


  return (
    <div className="info-container">
  <img src="/jakdanglabs_logo4x.png" alt="로고" className="logo" />

  {/* 네비게이션 메뉴 */}
  <div className="nav-menu">
    <div className="nav-item">작당연구소 소개</div>
    <div className="nav-item">서비스</div>
    <div className="nav-item">안내</div>
  </div>

  {/* 구분선 */}
  <div className="divider-line" />

  {/* 제목 */}
  <h1 className="info-title">
    AI활용으로 함께 만드는 창작의 흐름<br />
    모두가 연결되는 커뮤니티, <span className="highlight-orange">작당연구소</span>
  </h1>

  <div className="yellow-section">
  <img src="hands.png" alt="손 사진" className="hands-image" />
  </div>

  <div className="description-text">
  작당연구소는 공동의 관심사를 가진 인재들이 AI 기술을 활용해 창작 역량을 확장하고,  
  커뮤니티와 함께 성장하며, 커리어를 쌓아나가는 창의인재중심 연구소입니다.
  </div>

  <div className="about-section">
  {/* 왼쪽 이미지 */}
  <div className="about-image">
    <img src="/teaching.png" alt="교육 이미지" />
  </div>

  {/* 오른쪽 텍스트 박스 */}
  <div className="about-text-wrapper">
    <div className="about-label">
      <span>About 작당연구소</span>
      <div className="about-dot" />
    </div>

    <h2 className="about-title">
      기술이 창작을 돕고,<br />
      사람이 사람을 이끌어주는 곳
    </h2>

    <p className="about-description">
      작당연구소는 AI와 사람의 협업을 통해 창작의 새로운 패러다임을 제시하는 허브 플랫폼입니다.
      생성형 AI 도구를 활용한 콘텐츠 제작부터 커뮤니티 기반의 협업 프로젝트, 온·오프라인 교육과 창작 멘토링,
      프로젝트 중심의 커리어 성장, 그리고 작업물의 유통 및 수익화까지, 창작의 전 과정을 아우르는 지원을 제공합니다.
      기술이 창작을 돕고, 사람이 사람을 이끌며 함께 나아가는 이 흐름이 바로 작당연구소의 핵심입니다.
    </p>
  </div>
  </div>

{/* 🔽 Point Section (AI와 커뮤니티) */}
<div className="point-section">
  <div className="point-text-wrapper">
    <div className="point-label">
      <span>We believe</span>
      <div className="point-dot" />
    </div>
    <h2 className="point-title">
      AI와 커뮤니티,<br />
      창작을 확장하는 힘
    </h2>
    <p className="point-description">
      우리는 믿습니다. 창작은 더 이상 혼자가 아닌, 함께하는 시대라는 것을. 그리고 기술은 사람을 대체하는 것이 아니라, 사람을 확장시키는 도구라는 것을 말입니다.
      우리는 AI를 창작자에게 유용한 도구로 제공하고, 커뮤니티를 통해 아이디어를 나누며 창작의 가치와 가능성을 더욱 넓혀갑니다.
      사람과 사람이 연결될 때 아이디어는 더 풍부해지고, AI와의 협업은 그 가능성을 현실로 만듭니다.
      함께 나누는 배움과 실험, 연결되는 대화와 시도, 그리고 거기서 탄생하는 창작의 흐름이야말로 작당연구소가 지향하는 미래입니다.
    </p>
  </div>

  <div className="point-image-wrapper">
    <img src="/point.png" alt="마케팅 전략 회의 이미지" className="point-image" />
  </div>
</div>

{/* 🔽 공식 섹션 (Don’t just imagine. Create together!) */}
<div className="formula-section">
  <div className="formula-title-label">
    <span>작당연구소의 새로운 공식</span>
    <div className="formula-dot" />
  </div>

  <div className="formula-headline">
    <span className="headline-bold">Don’t just imagine.</span>
    <div className="headline-separator" />
    <span className="headline-bold">Create</span>
    <span className="headline-orange">together!</span>
  </div>

  <div className="formula-subtext">
    <span>AI와 함께</span>
    <span>커뮤니티와 함께</span>
  </div>

  <p className="formula-description">
    기술이 뒷받침하고, 커뮤니티가 함께 실현하며, 그 안에서 인재들의 재능이 성장합니다.
    작당연구소는 창의 인재들이 기술과 커뮤니티를 통해 더 큰 가능성을 펼치는 곳입니다.
  </p>
</div>

<div className="howwework-section">
  <div className="howwework-title">How we work</div>
  <div className="howwework-title-dot"></div>

  <div className="howwework-items">
    <div className="howwework-item">
      <div className="howwework-item-title">
        Create<span className="dot"></span>
      </div>
      <div className="howwework-item-desc">
        혼자보다 더 멀리, 함께 만드는 여정으로
      </div>
    </div>

    <div className="howwework-item">
      <div className="howwework-item-title">
        Connect<span className="dot"></span>
      </div>
      <div className="howwework-item-desc">
        관심사와 기술로 연결된 창작 커뮤니티로
      </div>
    </div>

    <div className="howwework-item grow-section">
      <div className="howwework-item-title">Grow</div>
      <div className="grow-circle">+AI</div>
    </div>
  </div>

  <div className="howwework-item-desc" style={{ position: 'absolute', top: '419px', left: '911px', width: '265px' }}>
    AI와 함께 발전하는 실력과 커리어로
  </div>
</div>

<div className="mobile-section">
  <div className="mobile-subtext">
    우리가 믿는 가치를 담아, 다음과 같은 서비스를 만들었어요
  </div>
  <div className="mobile-dot" />
  <div className="mobile-inner-container">
    <div className="mobile-left-content">
      <div className="mobile-title">
        <span className="highlight">작당랩스</span>
        <span>는 어떤 서비스인가요?</span>
      </div>
      <div className="mobile-description">
        <p>모든 배움의 순간이 더 즐겁고, 더 이어질 수 있도록 돕는 공간입니다...</p>
        <p>• 교육기관에서는 학생들의 학습 현황, 출결, 과제, 커뮤니티 활동까지...</p>
        <p>더 효율적으로, 더 즐겁게, 작당랩스가 배움의 질을 높이는 길을 함께 할게요.</p>
      </div>
    </div>
    <div className="mobile-image-wrapper">
      <img src="/mobile_screen4x.png" alt="모바일 예시" />
    </div>
  </div>
</div>

    <div className="guide-container">
      {/* 상단 텍스트 */}
      <p className="info-top-text">
        <span className="highlight-orange">작당랩스</span>는 교육, 커뮤니티, AI를 연결하는 혁신적인 플랫폼으로
        <br />
        교육의 새로운 경험을 만들어가고 있습니다.
      </p>

      {/* Box 1 */}
      <div className="guide-box box1">
        <img src="/main_open.png" alt="main open" className="main-open-img" />
        <img src="/tools.png" alt="tools" className="tools-img" />
        <div className="guide-text">
          <p className="guide-title">활발한 소통이 이루어지는 채널식 커뮤니티</p>
          <p className="guide-desc">
            학생들이 자유롭게 질문하고 소통하며, 서로의 경험을 공유하고 성장할 수 있는 유연한 커뮤니티 공간을 만듭니다.
            교육기관도 이 공간에서 학생들과 실시간으로 연결됩니다.
          </p>
        </div>
      </div>

      {/* Box 2 */}
      <div className="guide-box box2">
        <img src="/tools_chating.png" alt="tools chating" className="tools-chat-img" />
        <img src="/cat_chating.png" alt="cat chating" className="cat-img" />
        <div className="guide-text">
          <p className="guide-title">더 쉽고 간편한 올인원 서비스</p>
          <p className="guide-desc">
            기존 복잡한 교육 관리 시스템을 탈피해 직관적이고 간단한 인터페이스를 제공합니다.
            학생도, 관리자도 모두 쉽게 사용할 수 있어 학습과 소통에만 집중할 수 있습니다.
          </p>
        </div>
      </div>

      {/* Box 3 */}
      <div className="guide-box box3">
        <img src="/service_teamflow.png" alt="teamflow" className="teamflow-img" />
        <img src="/project_setting.png" alt="project setting" className="setting-img" />
        <div className="guide-text">
          <p className="guide-title">프로젝트 관리도 한번에 관리</p>
          <p className="guide-desc">
            프로젝트 관리를 효율적으로 할 수 있도록 팀플로우 서비스를 함께 제공합니다.
            팀프로젝트를 진행하면서 명확하고 체계적으로 진행상황을 공유할 수 있도록 했습니다.
          </p>
        </div>
      </div>
    </div>

    <div className="contact-section">
  {/* 좌측 텍스트 */}
  <div className="contact-label">
    <span className="contact-title">Contact us</span>
    <span className="yellow-dot" />
  </div>

  {/* 우측 주소 */}
  <div className="contact-address">
    <div className="address-kr">서울특별시 마포구 백범로23, 3층</div>
    <div className="address-en">
      23, Baekbeom-ro, Mapo-gu, Seoul, Republic of Korea
    </div>
  </div>

  {/* 지도 (이미지 대신 실제 API 적용할 영역) */}
  <div className="contact-map-wrapper">
    <div id="kakao-map" className="contact-map" />
  </div>
</div>


<div className="banner-section">
  <div className="banner-text-wrapper">
    <p className="banner-title">
      AI활용으로 함께 만드는 창작의 흐름<br />
      모두가 연결되는 커뮤니티, <span className="highlight-orange">작당연구소</span>
    </p>
  </div>
  <div className="banner-button">
    작당랩스 바로가기
  </div>
</div>


<div className="footer">
  <div className="footer-left">
    <img src="/jakdanglabs_logo4x.png" alt="logo" className="footer-logo" />
  </div>
  <div className="footer-right">
    <div className="footer-links">
      <span className="footer-link">공지사항</span>
      <span className="footer-link">개인정보처리방침</span>
      <span className="footer-link">이용약관</span>
      <span className="footer-link">고객센터</span>
    </div>
    <div className="footer-copy">© 2025 작당연구소. 모든 권리 보유.</div>
  </div>
</div>



     </div>
  );
};

export default MainInfo;