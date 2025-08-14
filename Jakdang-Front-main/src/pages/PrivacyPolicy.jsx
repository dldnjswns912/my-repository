import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">개인정보처리방침</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 mb-8">
          (주)작당연구소(이하 "회사"라 함)는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하고 있습니다. 본 개인정보처리방침은 회사가 운영하는 "작당연구소" 웹사이트 및 관련 서비스(이하 "서비스"라 함)에 적용되며, 회사가 이용자의 개인정보를 어떠한 목적으로, 어떤 방식으로 수집·이용·보관·파기하는지, 그리고 이용자의 권리를 어떤 방법과 절차를 통해 행사할 수 있는지 안내해 드립니다.
        </p>

        <div className="space-y-8">
          {/* 1. 수집하는 개인정보 항목 및 수집 방법 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">1. 수집하는 개인정보 항목 및 수집 방법</h2>
            <h3 className="text-lg font-medium mb-2">수집 항목</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>회원 가입 시: (필수) 아이디(이메일), 비밀번호, 닉네임 등</li>
              <li>서비스 이용 과정에서: 접속 로그, 쿠키, IP 주소, 기기정보, 브라우저 유형, 방문 일시 등 자동생성정보</li>
              <li>선택 항목: 프로필 사진, 휴대전화번호, 지역 등 (선택적으로 제공한 경우에 한함)</li>
            </ul>
            
            <h3 className="text-lg font-medium mt-4 mb-2">수집 방법</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>회원 가입 및 서비스 이용 과정에서 이용자가 직접 입력</li>
              <li>자동으로 생성·수집: 웹사이트 접속 시 기기정보, IP 주소, 쿠키 등</li>
              <li>고객센터 문의, 이벤트 참여 등을 통해 이용자가 자발적으로 제공</li>
            </ul>
          </section>

          {/* 2. 개인정보의 수집·이용 목적 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">2. 개인정보의 수집·이용 목적</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">회사는 다음과 같은 목적을 위해 개인정보를 수집·이용합니다.</p>
            
            <h3 className="text-lg font-medium mb-2">회원 관리</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>회원 식별 및 가입의사 확인, 본인 확인 절차</li>
              <li>회원 탈퇴 의사 확인, 회원 문의·불만 처리</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">서비스 제공 및 운영</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>게시판, 커뮤니티, Q&A 등 서비스 이용을 위한 본인 인증</li>
              <li>이용자의 서비스 이용기록, 접속 빈도 분석 등 통계적 활용</li>
              <li>서비스 기능 개선 및 맞춤형 서비스 제공</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">마케팅 및 광고 (선택 동의 시)</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>이벤트, 프로모션, 광고성 정보 제공</li>
              <li>서비스 개선을 위한 만족도 조사 등</li>
            </ul>
          </section>

          {/* 3. 개인정보의 보유·이용 기간 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">3. 개인정보의 보유·이용 기간</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">회사는 개인정보의 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만, 다음의 정보는 아래의 이유로 명시한 기간 동안 보관합니다.</p>

            <h3 className="text-lg font-medium mb-2">내부 정책에 의한 보존</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>회원 탈퇴 후 재가입 방지 및 불법·부정 이용 방지를 위해 아이디, 닉네임 등 최소한의 식별정보를 ○○일 동안 보관 (정책에 따라 기간 설정)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">관련 법령에 의한 보존</h3>
            <p className="mb-2 text-gray-700 dark:text-gray-300">「전자상거래 등에서의 소비자보호에 관한 법률」 등 법령에서 일정 기간 정보의 보관을 규정하는 경우, 회사는 해당 기간 동안 법령의 규정에 따라 정보를 보관합니다. 예시)</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
              <li>전자금융 거래에 관한 기록: 5년</li>
              <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
              <li>웹사이트 방문에 관한 기록(로그기록, 접속지 정보 등): 3개월</li>
            </ul>
          </section>

          {/* 4. 개인정보의 파기 절차 및 방법 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">4. 개인정보의 파기 절차 및 방법</h2>
            
            <h3 className="text-lg font-medium mb-2">파기 절차</h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              목적 달성, 보유 기간 경과 등 파기 사유가 발생한 개인정보는 내부 방침 및 관련 법령에 따라 즉시 파기됩니다.
            </p>

            <h3 className="text-lg font-medium mb-2">파기 방법</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>전자적 파일 형태: 복구·재생 불가능한 방법으로 영구 삭제</li>
              <li>종이 문서 형태: 분쇄기로 분쇄하거나 소각</li>
            </ul>
          </section>

          {/* 5. 개인정보의 제3자 제공 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">5. 개인정보의 제3자 제공</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              회사는 원칙적으로 이용자의 개인정보를 "2. 개인정보의 수집·이용 목적" 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다. 다만, 다음과 같은 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              <li>기타 관계 법령에서 허용하는 범위 내에서 정보가 필요한 경우</li>
            </ul>
          </section>

          {/* 6. 개인정보 처리의 위탁 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">6. 개인정보 처리의 위탁</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              회사는 서비스 운영 및 향상 등을 위하여 아래와 같이 개인정보 처리를 위탁할 수 있으며, 위탁 시에는 관련 법령에 따라 수탁자와 개인정보 보호 관련 의무사항을 명시하고 관리·감독합니다.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>수탁 업체: ○○○ (예시)</li>
              <li>위탁 업무 내용: 데이터 보관 및 서버 운영, 고객 문의 대응, 이벤트 운영 등</li>
              <li>보유 및 이용 기간: 위탁 계약 종료 시까지 또는 관련 법령에서 정한 기간</li>
            </ul>
          </section>

          {/* 7. 이용자 및 법정대리인의 권리와 행사 방법 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">7. 이용자 및 법정대리인의 권리와 행사 방법</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>이용자 및 법정대리인은 언제든지 본인 혹은 만 14세 미만 아동의 개인정보를 조회하거나 수정, 처리정지, 삭제를 요청할 수 있습니다.</li>
              <li>이를 위하여 서비스 내 "회원정보 수정" 기능을 이용하거나, 고객센터를 통해 연락하시면 지체 없이 필요한 조치를 하겠습니다.</li>
              <li>회사는 이용자 혹은 법정대리인의 요청에 따라 필요한 조치를 취할 때, 법령에서 정하는 바에 따라 정당한 사유가 있는 경우 일부 또는 전부를 제한·거절할 수 있으며, 이 경우 사유를 안내해 드립니다.</li>
            </ul>
          </section>

          {/* 8. 개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">8. 개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항</h2>
            
            <h3 className="text-lg font-medium mb-2">쿠키(Cookie)의 사용 목적</h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              이용자의 접속 정보를 저장·관리하여 이용자에게 맞춤형 서비스를 제공하고, 접속 빈도 및 방문 시간 분석 등에 활용합니다.
            </p>

            <h3 className="text-lg font-medium mb-2">쿠키 설정 거부 방법</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>웹 브라우저 상단의 "도구 {'>'} 인터넷 옵션 {'>'} 개인정보" 메뉴를 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다.</li>
              <li>쿠키 저장을 거부할 경우 일부 서비스 이용이 제한될 수 있습니다.</li>
            </ul>
          </section>

          {/* 9. 개인정보의 기술적·관리적 보호 대책 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">9. 개인정보의 기술적·관리적 보호 대책</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              회사는 이용자의 개인정보를 안전하게 보호하기 위해 다음과 같은 조치를 취하고 있습니다.
            </p>

            <h3 className="text-lg font-medium mb-2">기술적 대책</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>개인정보는 암호화하여 저장·관리하며, 중요한 데이터는 전송 시 암호화 기술을 사용</li>
              <li>백신 프로그램 및 보안 솔루션 설치·운영, 해킹·컴퓨터 바이러스 등에 대비한 보안시스템 운영</li>
              <li>개인정보 접근 권한 부여, 변경, 말소 등 접근 통제 시스템 운영</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">관리적 대책</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>개인정보 취급자를 최소화하고, 정기적인 내부 교육 및 감사 시행</li>
              <li>개인정보처리시스템에 대한 접근 권한을 부여·변경·말소에 관한 기준을 수립하고 이행</li>
              <li>개인정보보호책임자 지정 및 운영</li>
            </ul>
          </section>

          {/* 10. 개인정보 보호책임자 및 담당부서 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">10. 개인정보 보호책임자 및 담당부서</h2>
            
            <h3 className="text-lg font-medium mb-2">개인정보 보호책임자</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>이름: 정복교</li>
              <li>직책: 책임연구원</li>
              <li>연락처: kmight@jakdanglabs.com</li>
            </ul>

            <p className="mt-4 text-gray-700 dark:text-gray-300">
              이용자는 회사의 서비스 이용 중 발생하는 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다. 회사는 이용자의 문의에 대해 신속하고 성실하게 답변 및 처리해 드립니다.
            </p>
          </section>

          {/* 11. 개인정보 열람청구 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">11. 개인정보 열람청구</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              이용자는 아래의 기관에 대해 개인정보 열람청구를 할 수 있습니다. 회사와는 별개의 기관이므로, 회사의 자체적인 개인정보 불만처리, 피해구제 결과에 만족하지 못하시거나 보다 자세한 도움이 필요하시면 문의하시기 바랍니다.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 / www.kopico.go.kr</li>
              <li>개인정보침해신고센터: (국번없이) 118 / privacy.kisa.or.kr</li>
              <li>대검찰청 사이버수사과: (국번없이) 1301 / www.spo.go.kr</li>
              <li>경찰청 사이버안전국: (국번없이) 182 / cyberbureau.police.go.kr</li>
            </ul>
          </section>

          {/* 12. 고지의 의무 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">12. 고지의 의무</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>본 개인정보처리방침은 2025년 05월 01일부터 적용됩니다.</li>
              <li>회사는 개인정보처리방침을 개정하는 경우, 개정 내용 및 시행일자를 명시하여 시행 최소 7일 전부터 공지합니다. 다만, 이용자 권리의 중대한 변경이 발생할 경우 최소 30일 전부터 공지합니다.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 