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

      <div className="about-container" id="intro">
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

{/* ================= How we work (boxed / container 1200) ================ */}
<section className="work-section work--boxed" id="how-we-work">
  <div className="work-wrap">
    {/* 제목: 라인 위 */}
    <div className="work-header">
      <span>How we work</span><i className="yellow-dot" />
    </div>

    {/* 라인 PNG: 컨테이너 폭 100%, 비율 유지 */}
    <div className="work-band" aria-hidden="true" />

    {/* 카드들: 컨테이너 내부에서 핀 바로 아래 절대 배치 */}
    <div className="work-cards">
      <div className="work-step step1">
        <h3 className="work-title">Create<i className="title-dot" /></h3>
        <div className="work-underline u-210" />
        <p className="work-desc">혼자보다 더 멀리, 함께 만드는 여정으로</p>
      </div>

      <div className="work-step step2">
        <h3 className="work-title">Connect<i className="title-dot" /></h3>
        <div className="work-underline u-252" />
        <p className="work-desc">관심사와 기술로 연결된 창작 커뮤니티로</p>
      </div>

      <div className="work-step step3">
        <div className="grow-row">
          <h3 className="work-title no-dot">Grow</h3>
          <div className="ai-badge">
            <span className="plus-vert" />
            <span className="plus-horz" />
            <span className="ai-text">AI</span>
          </div>
        </div>
        <div className="work-underline u-169" />
        <p className="work-desc">AI와 함께 발전하는 실력과 커리어로</p>
      </div>
    </div>
  </div>
</section>

      {/* 서비스 섹션 헤더 */}
      <div className="svc-head">
        <p className="svc-head__text">
          우리가 믿는 가치를 담아, 다음과 같은 서비스를 만들었어요
        </p>
        <span className="svc-head__dot" aria-hidden="true"></span>
      </div>

      <section className="svc-card" id="service">
        <div className="svc-left">
          {/* 아이콘 */}
          <div className="svc-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="68"
              height="68"
              viewBox="0 0 68 68"
              fill="none"
            >
              <path d="M34.6657 52.6304C20.6371 52.6304 9.22607 41.2194 9.22607 27.1907C9.22607 13.1621 20.6371 1.75098 34.6657 1.75098C48.6944 1.75098 60.1054 13.1621 60.1054 27.1907C60.1054 41.2194 48.6944 52.6304 34.6657 52.6304Z" fill="#FFE68A" />
              <path d="M34.6655 3.48387C47.7347 3.48387 58.3633 14.1125 58.3633 27.1817C58.3633 40.2509 47.7347 50.8795 34.6655 50.8795C21.5964 50.8795 10.9678 40.2509 10.9678 27.1817C10.9678 14.1125 21.5964 3.48387 34.6655 3.48387ZM34.6655 0C19.6495 0 7.47461 12.1749 7.47461 27.191C7.47461 42.207 19.6495 54.382 34.6655 54.382C49.6815 54.382 61.8564 42.207 61.8564 27.191C61.8564 12.1749 49.6815 0 34.6655 0Z" fill="#4A2F14" />
              <path d="M33.7715 38.9463C29.3934 38.9463 25.835 35.3879 25.835 31.0098H28.6295C28.6295 33.8416 30.9397 36.1517 33.7715 36.1517C36.6033 36.1517 38.9134 33.8416 38.9134 31.0098H41.708C41.708 35.3879 38.1496 38.9463 33.7715 38.9463Z" fill="#4A2F14" />
              <path d="M25.9466 28.2246C23.9532 28.2246 21.9597 27.4607 20.4414 25.9423C17.4046 22.9056 17.4046 17.9592 20.4414 14.9225C20.963 14.4008 21.8945 14.4008 22.4162 14.9225L31.4612 23.9675C32.0108 24.5171 32.0108 25.3927 31.4612 25.9423C29.9428 27.4607 27.9494 28.2246 25.9559 28.2246H25.9466ZM21.5592 18.0338C20.5159 19.934 20.7953 22.3653 22.4069 23.9768C24.0091 25.579 26.4496 25.8678 28.3499 24.8245L21.5592 18.0338Z" fill="#4A2F14" />
              <path d="M40.6738 28.2344C38.5965 28.2344 36.6403 27.424 35.1685 25.9522C34.6189 25.4026 34.6189 24.527 35.1685 23.9774L44.2135 14.9323C44.4744 14.6715 44.8283 14.5225 45.2009 14.5225C45.5736 14.5225 45.9275 14.6715 46.1884 14.9323C49.2251 17.9691 49.2251 22.9154 46.1884 25.9522C44.7166 27.424 42.7604 28.2344 40.6831 28.2344H40.6738ZM38.2705 24.825C38.9971 25.2256 39.8261 25.4398 40.6831 25.4398C42.0152 25.4398 43.2727 24.9182 44.2229 23.9774C45.8251 22.3752 46.1138 19.9346 45.0705 18.0343L38.2798 24.825H38.2705Z" fill="#4A2F14" />
              <path d="M66.823 31.7137L58.9817 27.1865L47.1701 47.6449L55.0114 52.1721L66.823 31.7137Z" fill="#4A2F14" />
              <path d="M55.0101 53.2178C54.8331 53.2178 54.6561 53.1712 54.4884 53.078L46.645 48.5509C46.4028 48.4111 46.2259 48.1876 46.1607 47.9174C46.0861 47.6473 46.1234 47.3678 46.2631 47.1256L58.0747 26.6695C58.3635 26.1665 59.0062 25.9988 59.5093 26.2876L67.3526 30.8148C67.5948 30.9545 67.7718 31.1781 67.837 31.4482C67.9115 31.7183 67.8743 31.9978 67.7345 32.24L55.9229 52.6961C55.7273 53.0315 55.3733 53.2178 55.0194 53.2178H55.0101ZM48.5919 47.256L54.6188 50.7399L65.3871 32.1003L59.3602 28.6164L48.5919 47.256Z" fill="#4A2F14" />
              <path d="M47.0737 56.6741L54.945 52.1283L47.0737 47.5918V56.6741Z" fill="#FFE68A" />
              <path d="M47.0736 57.7167C46.8966 57.7167 46.7103 57.6702 46.5519 57.577C46.2259 57.3907 46.0303 57.046 46.0303 56.6734V47.5912C46.0303 47.2185 46.2259 46.8739 46.5519 46.6876C46.878 46.5013 47.2785 46.5013 47.5952 46.6876L55.4665 51.2334C55.7926 51.4197 55.9882 51.7643 55.9882 52.137C55.9882 52.5096 55.7926 52.8542 55.4665 53.0405L47.5952 57.5863C47.4369 57.6795 47.2506 57.7261 47.0736 57.7261V57.7167ZM48.1169 49.3983V54.857L52.8397 52.1276L48.1169 49.3983Z" fill="#4A2F14" />
              <path d="M47.2131 56.4404L50.0263 54.8103L47.2131 53.1895V56.4404Z" fill="#231815" />
              <path d="M47.2132 57.4841C47.0362 57.4841 46.8499 57.4375 46.6916 57.3443C46.3655 57.158 46.1699 56.8134 46.1699 56.4408V53.1898C46.1699 52.8172 46.3655 52.4725 46.6916 52.2862C47.0176 52.0999 47.4181 52.0999 47.7349 52.2862L50.548 53.9164C50.8741 54.1027 51.0697 54.4473 51.0697 54.8199C51.0697 55.1925 50.8741 55.5372 50.548 55.7235L47.7349 57.3537C47.5765 57.4468 47.3902 57.4934 47.2132 57.4934V57.4841Z" fill="#4A2F14" />
              <path d="M59.8072 52.8072C63.3672 52.8072 66.2532 49.9212 66.2532 46.3611C66.2532 42.8011 63.3672 39.915 59.8072 39.915C56.2471 39.915 53.3611 42.8011 53.3611 46.3611C53.3611 49.9212 56.2471 52.8072 59.8072 52.8072Z" fill="#FFE68A" />
              <path d="M59.7886 54.5494C58.3727 54.5494 56.9661 54.1768 55.7086 53.4502C51.7962 51.1959 50.4548 46.1751 52.7091 42.2627C53.799 40.3717 55.5688 39.0117 57.6834 38.4435C59.7979 37.8752 62.0056 38.164 63.8966 39.2632C65.7876 40.3624 67.1476 42.123 67.7158 44.2375C68.284 46.352 67.9952 48.5597 66.8961 50.4507C65.8062 52.3417 64.0363 53.7017 61.9218 54.2699C61.2138 54.4562 60.4965 54.5494 59.7886 54.5494ZM59.8072 41.6572C59.3974 41.6572 58.9875 41.7131 58.587 41.8156C57.376 42.1416 56.3606 42.9148 55.7365 44.0046C54.4417 46.2496 55.2149 49.128 57.4598 50.4228C58.5497 51.0469 59.8072 51.2146 61.0275 50.8885C62.2385 50.5625 63.2538 49.7893 63.8779 48.6995C64.5021 47.6096 64.6697 46.3427 64.3437 45.1318C64.0177 43.9208 63.2445 42.9054 62.1547 42.2813C61.4281 41.8621 60.627 41.6479 59.8165 41.6479L59.8072 41.6572Z" fill="#4A2F14" />
              <path d="M21.9599 65.3179L2.72412 61.359V40.2881L21.9599 44.247V65.3179Z" fill="#4A2F14" />
              <path d="M21.9598 66.017C21.9132 66.017 21.8667 66.017 21.8201 65.9984L2.58429 62.0487C2.25826 61.9835 2.02539 61.6947 2.02539 61.3687V40.2978C2.02539 40.0835 2.11854 39.8879 2.28621 39.7575C2.44457 39.6271 2.65881 39.5712 2.86375 39.6178L22.0995 43.5767C22.4256 43.6419 22.6584 43.9307 22.6584 44.2567V65.3277C22.6584 65.5419 22.5653 65.7375 22.3976 65.8679C22.2765 65.9704 22.1182 66.0263 21.9598 66.0263V66.017ZM3.42266 60.7912L21.2612 64.4613V44.8157L3.42266 41.1455V60.7912Z" fill="#4A2F14" />
              <path d="M22.3789 65.3179L41.6147 61.359V40.2881L22.3789 44.247V65.3179Z" fill="#4A2F14" />
              <path d="M22.3791 66.0166C22.2207 66.0166 22.0624 65.9607 21.9413 65.8583C21.7829 65.7279 21.6804 65.5229 21.6804 65.318V44.2471C21.6804 43.9117 21.9133 43.6323 22.2393 43.5671L41.4751 39.6081C41.68 39.5709 41.8943 39.6174 42.0527 39.7479C42.211 39.8783 42.3135 40.0832 42.3135 40.2881V61.359C42.3135 61.6944 42.0806 61.9738 41.7546 62.0391L22.5188 65.9887C22.5188 65.9887 22.4256 66.0073 22.3791 66.0073V66.0166ZM23.0777 44.8153В64.461L40.9162 60.7908V41.1451L23.0777 44.8153Z" fill="#4A2F14" />
              <path d="M8.19193 65.691C11.752 65.691 14.638 62.805 14.638 59.2449C14.638 55.6848 11.752 52.7988 8.19193 52.7988C4.63186 52.7988 1.74585 55.6848 1.74585 59.2449C1.74585 62.805 4.63186 65.691 8.19193 65.691Z" fill="#FFE68A" />
              <path d="M8.17336 67.4328C6.78541 67.4328 5.37883 67.0788 4.09334 66.3336C0.180977 64.0793 -1.16041 59.0585 1.09386 55.1461C3.34813 51.2337 8.36899 49.8923 12.2813 52.1466C16.1937 54.4009 17.5351 59.4217 15.2808 63.3341C13.7625 65.961 11.0052 67.4235 8.17336 67.4235V67.4328ZM8.20132 54.5499C6.58049 54.5499 4.99691 55.3883 4.12128 56.8973C2.82648 59.1423 3.59963 62.0207 5.84458 63.3155C8.08953 64.6103 10.9679 63.8371 12.2627 61.5922C13.5575 59.3472 12.7844 56.4688 10.5394 55.174C9.80352 54.7455 8.99311 54.5499 8.20132 54.5499Z" fill="#4A2F14" />
            </svg>
          </div>

          <div className="svc-left__text">
            <h2 id="svc-title" className="svc-title">
              <span className="accent">작당랩스</span>
              <span>는 어떤 서비스인가요?</span>
            </h2>

            <p className="svc-desc">
              <span className="emph">모든 배움의 순간이 더 즐겁고, 더 이어질 수 있도록 돕는 공간입니다.</span>
              교육기관의 선생님, 수강생, 그리고 함께 배우는 사람들 모두가 편하게 이야기 나누고,
              자연스럽게 연결될 수 있도록 만든 도구예요.
            </p>

            <ul className="svc-bullets">
              <li>교육기관에서는 학생들의 학습 현황, 출결, 과제, 커뮤니티 활동까지 전반적인 과정을 한눈에 쉽고 편하게 관리할 수 있어요.</li>
              <li>
                교육생들은 자유롭게 소통하며 서로의 배움을 나누고,<br />
                함께 성장할 수 있답니다.
              </li>
            </ul>

            {/* 마지막 줄 한 줄로 */}
            <p className="svc-desc strong last-line">
              더 효율적으로, 더 즐겁게, 작당랩스가 배움의 질을 높이는 길을 함께 할게요.
            </p>
          </div>
        </div>

        <div className="svc-right">
          <img src="/mobile_screen4x.png" alt="Jakdang Labs Mobile Screen" className="svc-mock" />
        </div>
      </section>


      {/* 작당랩스는 교육 ~ */}
      <section className="svc-strap" id="info">
        <p className="svc-strap__text">
          <span className="accent">작당랩스는</span>{' '}
          교육, 커뮤니티, AI를 연결하는 <span className="nowrap">혁신적인 플랫폼으로</span><br className="br-desktop" />
          교육의 새로운 경험을 만들어가고 있습니다.
        </p>
      </section>


      <section className="svc-split svc-split--chan" aria-labelledby="chan-title">
        {/* 좌측 카드 */}
        <div className="svc-split__media">
          {/* 빨간 원 2개 (배경 장식) */}
          <span aria-hidden className="blob blob-lg"></span>
          <span aria-hidden className="blob blob-sm"></span>

          {/* 폰 화면 */}
          <img
            src="/main_open.png"              /* image 677 */
            alt="메인 오픈 화면"
            className="split-phone"
            width="374"
            height="450"
            loading="lazy"
            decoding="async"
          />

          {/* 툴바 */}
          <img
            src="/tools.png"                  /* image 678 */
            alt="채널 도구 바"
            className="split-tools"
            width="611"
            height="55"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* 우측 텍스트 */}
        <div className="svc-split__copy">
          <h3 id="chan-title" className="svc-split__title">활발한 소통이 이뤄지는 채널식 커뮤니티</h3>
          <p className="svc-split__desc lead">
            학생들이 자유롭게 질문하고 소통하며, 서로의 경험을 공유하고 성장할 수 있는 유연한 커뮤니티 공간을 만듭니다.
          </p>
          <p className="svc-split__desc">
            교육기관도 이 공간에서 학생들과 실시간으로 연결됩니다.
          </p>
        </div>
      </section>

      {/* 고양이 부분 */}
      <section className="svc-allin" aria-labelledby="allin-title">
        {/* 좌측 텍스트 */}
        <div className="allin-copy">
          <h3 id="allin-title" className="allin-title">더 쉽고 간편한 올인원 서비스</h3>
          <p className="allin-desc">
            기존 복잡한 교육 관리 시스템을 탈피해 직관적이고 간단한 인터페이스를 제공합니다.
            학생도, 관리자도 모두 쉽게 사용할 수 있어 학습과 소통에만 집중할 수 있습니다.
          </p>
        </div>

        {/* 우측 카드 */}
        <div className="allin-media allin-card">
          {/* 빨간 원 2개 */}
          <span aria-hidden className="blob blob-lg"></span>
          <span aria-hidden className="blob blob-sm"></span>

          {/* image 680 */}
          <img
            src="/tools_chating.png"
            alt="툴 메뉴"
            className="allin-menu"
            width="239"
            height="348"
            loading="lazy"
            decoding="async"
          />
          {/* image 686 */}
          <img
            src="/cat_chating.png"
            alt="채팅 화면"
            className="allin-phone"
            width="252"
            height="410"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

      <section className="svc-manage" aria-labelledby="manage-title">
        {/* 왼쪽 카드 */}
        <div className="manage-card">
          {/* Ellipse 장식(맨 위) */}
          <span aria-hidden className="blob blob-lg"></span>
          <span aria-hidden className="blob blob-sm"></span>

          {/* image 684 */}
          <img
            src="/service_teamflow.png"
            alt="팀플로우 서비스 화면"
            className="manage-phone"
            width="302" height="451"
            loading="lazy" decoding="async"
          />

          {/* image 685 */}
          <img
            src="/project_setting.png"
            alt="프로젝트 설정 보드"
            className="manage-board"
            width="1024" height="254"
            loading="lazy" decoding="async"
          />
        </div>

        {/* 오른쪽 텍스트 */}
        <div className="manage-copy">
          <h3 id="manage-title" className="manage-title">프로젝트 관리도 한번에 관리</h3>
          <p className="manage-desc">
            프로젝트 관리도 효율적으로 할 수 있도록 팀플로우 서비스를 함께 제공합니다.
            팀프로젝트를 진행하면서 명확하고 체계적으로 진행상황을 공유할 수 있도록 했습니다.
          </p>
        </div>
      </section>

      <section className="cta-band" aria-labelledby="cta-title">
        <div className="cta-band__inner">
          <h3 id="cta-title" className="cta-band__title">
            <span className="accent">AI활용</span>으로 함께 만드는 창작의 흐름<br />
            모두가 연결되는 커뮤니티, <span className="accent">작당연구소</span>
          </h3>

          {/* 메인으로 이동 (현재 localhost:4173/info → / 로 이동) */}
          <a
            href="/"
            className="cta-band__btn"
            onClick={(e) => {
              e.preventDefault();
              window.location.assign(`${location.origin}/`);
            }}
          >
            작당랩스 바로가기
          </a>
        </div>
      </section>

      <footer className="site-footer" role="contentinfo">
  <div className="footer-inner">
    {/* Left: Logo */}
    <a href="/" className="footer-logo" aria-label="JAKDANGLABS 홈으로">
      <img
        src="/jakdanglabs_logo4x.png"
        alt="JAKDANG LABS"
        width="324"
        height="36"
        decoding="async"
        loading="lazy"
      />
    </a>

    {/* Right: Links + Copyright */}
    <div className="footer-right">
      <nav aria-label="푸터">
        <ul className="footer-links">
          <li><a href="#">공지사항</a></li>
          <li><a href="#">개인정보처리방침</a></li>
          <li><a href="#">이용약관</a></li>
          <li><a href="#">고객센터</a></li>
        </ul>
      </nav>
      <small className="copyright">© 2025 작당연구소. 모든 권리 보유.</small>
    </div>
  </div>
</footer>

    </div>
  );
};

export default MainInfo;
