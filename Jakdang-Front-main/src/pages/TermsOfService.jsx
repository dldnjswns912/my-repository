import React from 'react';

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">이용약관</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <div className="space-y-8">
          {/* 1. 목적 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">1. 목적</h2>
            <p className="text-gray-700 dark:text-gray-300">
              이 약관은 "(주)작당연구소"(이하 "회사"라 함)가 제공하는 "작당연구소" 웹사이트 및 관련 서비스(이하 "서비스"라 함)의 이용과 관련하여 회사와 회원 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 2. 용어의 정의 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">2. 용어의 정의</h2>
            <ul className="list-disc pl-6 space-y-3 text-gray-700 dark:text-gray-300">
              <li>
                <strong>서비스:</strong> 회원이 PC, 모바일, 태블릿 등 각종 유·무선 기기를 통해 이용할 수 있도록 회사가 제공하는 온라인 커뮤니티, 게시판, 정보 공유 등의 제반 서비스를 의미합니다.
              </li>
              <li>
                <strong>회원:</strong> 이 약관에 동의하고 회사가 제공하는 회원가입 절차를 완료한 자로서, 회사가 제공하는 서비스를 계속 이용할 수 있는 자를 말합니다.
              </li>
              <li>
                <strong>게시물:</strong> 회원이 서비스를 이용함에 있어 서비스 상에 게시한 문자, 사진, 동영상, 링크, 댓글, 각종 파일 및 링크 등 모든 형태의 정보나 자료를 의미합니다.
              </li>
              <li>
                <strong>계정(아이디, ID):</strong> 회원의 식별과 서비스 이용을 위해 회원이 설정하고 회사가 승인한 문자와 숫자의 조합을 의미합니다.
              </li>
              <li>
                <strong>비밀번호(Password):</strong> 계정과 일치된 회원임을 확인하고 회원의 권익 및 비밀보호를 위해 회원 스스로 설정하여 관리하는 문자와 숫자의 조합을 의미합니다.
              </li>
            </ul>
          </section>

          {/* 3. 약관의 게시와 개정 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">3. 약관의 게시와 개정</h2>
            <ul className="list-disc pl-6 space-y-3 text-gray-700 dark:text-gray-300">
              <li>회사는 이 약관의 내용을 회원이 쉽게 확인할 수 있도록 서비스 초기화면 또는 별도의 연결화면에 게시합니다.</li>
              <li>회사는 「약관의 규제에 관한 법률」, 「전자상거래 등에서의 소비자보호에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
              <li>회사가 약관을 개정할 경우 적용일자 및 개정사유를 명시하여 기존 약관과 함께 최소 7일 이전(회원에게 불리하거나 중대한 사항을 변경하는 경우 30일 이전)부터 공지합니다.</li>
              <li>회원이 개정된 약관의 효력 발생일 이후에도 서비스를 계속 이용하는 경우 개정된 약관에 동의한 것으로 봅니다. 회원이 개정 약관에 동의하지 않는 경우, 회원은 이용계약을 해지할 수 있습니다.</li>
            </ul>
          </section>

          {/* 4. 회원가입 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">4. 회원가입</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              회원가입은 이용자가 이 약관에 동의하고, 회사가 정한 회원가입 양식에 필요한 정보를 기입하여 회원가입을 신청한 후, 회사가 이를 승인함으로써 성립됩니다.
            </p>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              회사는 다음 각 호에 해당하는 신청에 대하여는 승인을 거부하거나 사후에 회원자격을 박탈할 수 있습니다.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>가입 신청 시 허위 내용을 기재하거나 타인의 정보를 도용한 경우</li>
              <li>기타 관련 법령이나 회사의 기준에 반하여 이용이 부적절하다고 판단되는 경우</li>
            </ul>
          </section>

          {/* 5. 회원 탈퇴 및 자격 상실 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">5. 회원 탈퇴 및 자격 상실</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              회원은 언제든지 서비스 내 회원 탈퇴 절차를 통하여 이용계약 해지를 요청할 수 있으며, 회사는 관련 법령이 정하는 바에 따라 신속히 처리합니다.
            </p>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              회사는 회원이 다음 각 호에 해당하는 행위를 하는 경우, 사전 통보 후 회원자격을 제한·정지하거나 상실시킬 수 있습니다. 단, 중대한 위반 행위인 경우에는 사전 통보 없이 조치할 수 있습니다.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>본 약관을 위반하거나 서비스 운영을 고의로 방해하는 행위를 한 경우</li>
              <li>관련 법령 위반 및 기타 부정한 행위를 하는 경우</li>
              <li>기타 회사가 합리적인 판단에 따라 서비스 제공을 거부할 필요가 있다고 인정하는 경우</li>
            </ul>
          </section>

          {/* 6. 회원의 의무 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">6. 회원의 의무</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              회원은 서비스 이용과 관련하여 다음 각 호에 해당하는 행위를 하여서는 안 됩니다.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>회원가입, 회원정보 변경, 게시물 등록 등 서비스 이용 과정에서 허위 정보를 기재하거나 타인의 정보를 무단으로 사용·수집하는 행위</li>
              <li>회사나 제3자의 저작권 등 지식재산권을 침해하거나 명예를 훼손하는 행위</li>
              <li>음란물, 폭력적인 내용, 차별·혐오 표현 등 공서양속에 반하는 정보, 문장, 도형 등을 게시·전송하는 행위</li>
              <li>회사나 다른 회원의 정상적인 서비스 이용을 방해하거나 시스템을 해킹하는 행위</li>
              <li>회사의 사전 허락 없이 영리적 목적을 위해 서비스를 이용하거나 광고성 정보를 전송하는 행위</li>
              <li>기타 관계 법령 및 이 약관, 회사의 운영정책 등에 위배되는 행위</li>
            </ul>
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              회원은 회사가 제공하는 서비스를 본래의 이용 목적 범위 내에서 성실하게 이용하여야 하며, 회사가 공지하는 운영정책이나 주의사항 등을 숙지하고 준수해야 합니다.
            </p>
          </section>

          {/* 7. 게시물의 저작권 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">7. 게시물의 저작권</h2>
            <ul className="list-disc pl-6 space-y-3 text-gray-700 dark:text-gray-300">
              <li>회원이 서비스 내에 게시한 게시물의 저작권은 해당 게시물의 저작권자에게 귀속됩니다.</li>
              <li>회사는 회원의 게시물을 서비스 운영, 홍보 등의 목적으로 사용할 수 있으며, 이 경우 회원의 개인정보는 관련 법령에 따라 적법하게 보호됩니다.</li>
              <li>회원은 자신이 게시한 게시물이 제3자의 저작권, 상표권 등 지식재산권을 침해하지 않도록 주의해야 하며, 관련 분쟁이 발생할 경우 모든 책임은 게시물을 등록한 회원 본인에게 있습니다.</li>
            </ul>
            <p className="mt-4 mb-2 text-gray-700 dark:text-gray-300">
              회사는 회원이 게시하거나 등록하는 게시물이 다음 각 호에 해당한다고 판단되는 경우 사전 통보 없이 삭제하거나 이동할 수 있습니다.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>불법, 음란, 명예훼손, 허위사실, 폭력적인 내용, 차별·혐오 표현 등이 포함된 경우</li>
              <li>타인의 권리를 침해하거나 사생활 침해 우려가 있는 경우</li>
              <li>기타 회사의 운영정책에 어긋나거나 관련 법령에 위배되는 경우</li>
            </ul>
          </section>

          {/* 8. 회사의 의무 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">8. 회사의 의무</h2>
            <ul className="list-disc pl-6 space-y-3 text-gray-700 dark:text-gray-300">
              <li>회사는 관련 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 계속적이고 안정적으로 서비스를 제공하기 위해 최선을 다합니다.</li>
              <li>회사는 회원이 안전하게 서비스를 이용할 수 있도록 개인정보 보호를 위해 노력하며, 개인정보처리방침을 제정·공개하고 준수합니다.</li>
              <li>회사는 회원으로부터 제기되는 의견이나 불만이 정당하다고 인정될 경우, 이를 처리하기 위해 노력합니다. 처리 과정 및 결과는 회원에게 통지합니다.</li>
            </ul>
          </section>

          {/* 9. 서비스의 제공 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">9. 서비스의 제공</h2>
            <ul className="list-disc pl-6 space-y-3 text-gray-700 dark:text-gray-300">
              <li>회사는 회원에게 회사가 정한 서비스(온라인 커뮤니티, 게시판, Q&A 등)를 제공합니다.</li>
              <li>회사는 업무상 또는 기술상의 장애 등 특별한 사정이 없는 한 서비스를 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.</li>
              <li>회사는 서비스의 내용과 운영 시간, 일부 혹은 전부의 기능 등을 회사의 정책이나 관련 법령에 따라 변경할 수 있으며, 중요한 변경사항에 대해서는 사전에 공지합니다.</li>
            </ul>
          </section>

          {/* 10. 개인정보 보호 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">10. 개인정보 보호</h2>
            <ul className="list-disc pl-6 space-y-3 text-gray-700 dark:text-gray-300">
              <li>회사는 회원의 개인정보를 보호하기 위해 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관계 법령에 따라 개인정보처리방침을 별도로 제정·공개하며, 회원의 개인정보를 보호하기 위해 노력합니다.</li>
              <li>회사는 회원이 서비스 이용 과정에서 제공한 개인정보를 회원의 동의 없이 제3자에게 제공하지 않으며, 개인정보처리방침에 명시된 목적 범위 내에서만 이용·처리합니다.</li>
            </ul>
          </section>

          {/* 11. 계약해지 및 이용제한 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">11. 계약해지 및 이용제한</h2>
            <ul className="list-disc pl-6 space-y-3 text-gray-700 dark:text-gray-300">
              <li>회원은 언제든지 서비스 내 회원 탈퇴 절차를 통해 이용계약을 해지할 수 있습니다.</li>
              <li>회사는 회원이 이 약관에 위배되는 행위를 할 경우 사전 통보 후 이용계약을 해지하거나 회원 자격을 제한·정지할 수 있습니다. 다만, 긴급하게 서비스 운영에 심각한 장애를 초래하거나 타인의 권리를 침해하는 경우 등 회사가 필요하다고 인정하는 경우에는 사전 통보 없이 즉시 조치할 수 있습니다.</li>
            </ul>
          </section>

          {/* 12. 책임제한 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">12. 책임제한</h2>
            <ul className="list-disc pl-6 space-y-3 text-gray-700 dark:text-gray-300">
              <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단, 기타 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 책임을 지지 않습니다.</li>
              <li>회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
              <li>회사는 회원 상호 간 또는 회원과 제3자 간에 서비스를 매개로 하여 발생한 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해에 대해서도 책임을 지지 않습니다.</li>
              <li>회사는 무료로 제공되는 서비스 이용과 관련하여 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.</li>
            </ul>
          </section>

          {/* 13. 준거법 및 관할 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">13. 준거법 및 관할</h2>
            <ul className="list-disc pl-6 space-y-3 text-gray-700 dark:text-gray-300">
              <li>회사와 회원 간에 제기된 소송은 대한민국 법령을 준거법으로 합니다.</li>
              <li>회사와 회원 간 발생한 분쟁에 관한 소송은 민사소송법 등 관련 법령이 정한 관할 법원에 제소합니다.</li>
            </ul>
          </section>

          {/* 14. 부칙 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">14. 부칙</h2>
            <ul className="list-disc pl-6 space-y-3 text-gray-700 dark:text-gray-300">
              <li>이 약관은 2025년 05월 01일부터 시행됩니다.</li>
              <li>회사는 필요하다고 인정될 경우 이 약관의 내용을 개정할 수 있으며, 개정 시에는 제3조의 절차에 따릅니다.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 