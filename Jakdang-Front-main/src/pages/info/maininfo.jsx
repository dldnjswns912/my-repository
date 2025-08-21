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
          center: new window.kakao.maps.LatLng(37.545285, 126.950369),
          level: 3,
        };
        const map = new window.kakao.maps.Map(container, options);

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
      <header className="header-container">
        <img src="/jakdanglabs_logo4x.png" alt="Jakdang Labs Logo" className="logo" />
        <nav className="nav-menu">
          <a href="#intro" className="nav-item">작당연구소 소개</a>
          <a href="#service" className="nav-item">서비스</a>
          <a href="#info" className="nav-item">안내</a>
        </nav>
        <div className="header-divider"></div>
      </header>

      {/* HERO */}
      <section className="section-hero">
        <h1 className="hero-title">
          <span className="highlight">AI활용</span>으로 함께 만드는 창작의 흐름<br />
          모두가 연결되는 커뮤니티, <span className="highlight">작당연구소</span>
        </h1>

        <div className="hero-image-box">
          <img src="/hands.png" alt="hands" className="hero-background-image" />
        </div>

        <p className="hero-description">
          작당연구소는<br />
          공동의 관심사를 가진 인재들이 <span className="highlight">AI 기술을 활용</span>해 창작 역량을 확장하고,<br />
          커뮤니티와 함께 성장하며, 커리어를 쌓아나가는 <span className="highlight">창의인재중심</span> 연구소입니다.
        </p>
      </section>

      <div className="about-container">
        <img src="/teaching.png" alt="teaching" className="about-image" />
        <div className="about-text">
          <div className="about-label">
            About 작당연구소 <span className="about-dot"></span>
          </div>
          <h2 className="about-title">
            기술이 창작을 돕고,<br />
            사람이 사람을 이끌어주는 곳
          </h2>
          <p className="about-description">
            작당연구소는 AI와 사람의 협업을 통해 창작의 새로운 패러다임을 제시하는 허브 플랫폼입니다.
            생성형 AI 도구를 활용한 콘텐츠 제작부터 커뮤니티 기반의 협업 프로젝트,
            온·오프라인 교육과 창작 멘토링, 프로젝트 중심의 커리어 성장,
            그리고 작업물의 유통 및 수익화까지, 창작의 전 과정을 아우르는 지원을 제공합니다.
            기술이 창작을 돕고, 사람이 사람을 이끌며 함께 나아가는 이 흐름이
            바로 작당연구소의 핵심입니다.
          </p>
        </div>
      </div>

      <div className="believe-container">
        <div className="believe-text">
          <span className="believe-label">
            We believe
            <span className="believe-dot"></span>
          </span>
          <h2 className="believe-title">
            AI와 커뮤니티,<br />
            창작을 확장하는 힘
          </h2>
          <p className="believe-description">
            우리는 믿습니다. 창작은 더 이상 혼자가 아닌, 함께하는 시대라는 것을. 그리고 기술은 사람을 대체하는 것이 아니라, 사람을 확장시키는 도구라는 것을 말입니다. 우리는 AI를 창작자에게 유용한 도구로 제공하고, 커뮤니티를 통해 아이디어를 나누며 창작의 가치와 가능성을 더욱 넓혀갑니다. 사람과 사람이 연결될 때 아이디어는 더 풍부해지고, AI와의 협업은 그 가능성을 현실로 만듭니다. 함께 나누는 배움과 실험, 연결되는 대화와 시도, 그리고 거기서 탄생하는 창작의 흐름이야말로 작당연구소가 지향하는 미래입니다.
          </p>
        </div>
        <img src="/point.png" alt="point" className="believe-image" />
      </div>

<div class="slogan-section">
  <div class="slogan-container">
    <div class="slogan-header">
      <span>작당연구소의 새로운 공식</span>
      <div class="yellow-dot"></div>
    </div>

    <div class="slogan-title">
      Don’t just <span class="orange">imagine.</span> Create
      <span class="line"></span>
      <span class="orange">together!</span>
    </div>

    <div class="slogan-sub">
      <span>AI와 함께</span>
      <span>커뮤니티와 함께</span>
    </div>

    <div class="slogan-description">
      기술이 뒷받침하고, 커뮤니티가 함께 실현하며, 그 안에서 인재들의 재능이 성장합니다.<br />
      작당연구소는 창의 인재들이 기술과 커뮤니티를 통해 더 큰 가능성을 펼치는 곳입니다.
    </div>
  </div>
</div>
      {/* HOW WE WORK */}
      <div className="how-we-work">
        <h2>How we work</h2>
        <div className="work-items">
          <div className="item">
            <h3>Create<span className="dot"></span></h3>
            <p>혼자보다 더 멀리, 함께 만드는 여정으로</p>
          </div>
          <div className="item">
            <h3>Connect<span className="dot"></span></h3>
            <p>관심사와 기술로 연결된 창작 커뮤니티로</p>
          </div>
          <div className="item">
            <h3>Grow</h3>
            <div className="circle">+AI</div>
            <p>AI와 함께 발전하는 실력과 커리어로</p>
          </div>
        </div>
      </div>

      {/* SERVICE */}
      <div className="service">
        <h2>
          작당랩스는 어떤 서비스인가요?
        </h2>
        <p>
          모든 배움의 순간이 더 즐겁고, 더 이어질 수 있도록 돕는 공간입니다.<br />
          교육기관에서는 학생들의 학습 현황, 출결, 과제, 커뮤니티 활동까지 효율적으로 관리할 수 있습니다.
        </p>
        <img src="/mobile_screen4x.png" alt="모바일" className="service-img" />
      </div>

      {/* GUIDE (3 box) */}
      <div className="guide">
        <div className="guide-box">
          <img src="/main_open.png" alt="메인화면" />
          <img src="/tools.png" alt="도구" />
          <h3>활발한 소통이 이루어지는 채널식 커뮤니티</h3>
          <p>
            학생들이 자유롭게 질문하고 소통하며, 서로의 경험을 공유하고 성장할 수 있는 공간입니다.
            교육기관도 실시간으로 연결됩니다.
          </p>
        </div>

        <div className="guide-box">
          <img src="/tools_chating.png" alt="툴채팅" />
          <img src="/cat_chating.png" alt="고양이채팅" />
          <h3>더 쉽고 간편한 올인원 서비스</h3>
          <p>
            복잡한 교육 시스템에서 벗어나, 누구나 직관적으로 쓸 수 있는 인터페이스를 제공합니다.
          </p>
        </div>

        <div className="guide-box">
          <img src="/service_teamflow.png" alt="팀플로우" />
          <img src="/project_setting.png" alt="설정" />
          <h3>프로젝트 관리도 한번에</h3>
          <p>
            팀프로젝트를 체계적으로 관리하고 공유할 수 있는 팀플로우 서비스를 함께 제공합니다.
          </p>
        </div>
      </div>

      {/* CONTACT */}
      <div className="contact">
        <h2>Contact us</h2>
        <p>서울특별시 마포구 백범로23, 3층</p>
        <p>23, Baekbeom-ro, Mapo-gu, Seoul, Republic of Korea</p>
        <div id="kakao-map" className="map"></div>
      </div>

      {/* FOOTER */}
      <div className="footer">
        <div className="footer-left">
          <img src="/jakdanglabs_logo4x.png" alt="logo" />
        </div>
        <div className="footer-right">
          <span>공지사항</span>
          <span>개인정보처리방침</span>
          <span>이용약관</span>
          <span>고객센터</span>
          <p>© 2025 작당연구소. 모든 권리 보유.</p>
        </div>
      </div>
    </div>
  );
};

export default MainInfo;
