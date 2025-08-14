import { Button } from "@/components/ui/button"
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal"

export default function TermsModal({ isOpen, onClose, type }) {
  const getContent = () => {
    if (type === "terms") {
      return (
        <div className="space-y-6">
          <div className="text-sm space-y-4">
            <div>
              <h3 className="font-bold mb-2">제1조 (목적)</h3>
              <p>이 약관은 작당연구소(이하 "회사")가 제공하는 서비스의 이용조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
              <p>회사는 서비스 제공을 위해 필요한 최소한의 개인정보를 수집하고, 이를 안전하게 처리하기 위한 개인정보 처리방침을 마련하고 있습니다.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">제2조 (정의)</h3>
              <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>"서비스"란 회사가 제공하는 모든 서비스를 말합니다.</li>
                <li>"이용자"란 회사의 서비스를 이용하는 회원을 말합니다.</li>
                <li>"계정"이란 이용자가 서비스 이용을 위해 회사에 등록한 이메일 주소를 말합니다.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold mb-2">제3조 (약관의 효력 및 변경)</h3>
              <ol className="list-decimal pl-5 space-y-1">
                <li>이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.</li>
                <li>회사는 필요한 경우 이 약관을 변경할 수 있으며, 변경된 약관은 웹사이트에 공지함으로써 효력이 발생합니다.</li>
                <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold mb-2">제4조 (서비스 이용 계약)</h3>
              <ol className="list-decimal pl-5 space-y-1">
                <li>서비스 이용 계약은 이용자가 약관에 동의하고 회원가입을 신청한 후, 회사가 이를 승낙함으로써 성립됩니다.</li>
                <li>회사는 다음 각 호에 해당하는 경우 회원가입을 승낙하지 않을 수 있습니다:
                  <ul className="list-disc pl-5 mt-1">
                    <li>실명이 아닌 경우</li>
                    <li>다른 사람의 명의를 사용한 경우</li>
                    <li>회원가입 신청서의 내용을 허위로 기재한 경우</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold mb-2">제5조 (서비스 이용)</h3>
              <ol className="list-decimal pl-5 space-y-1">
                <li>이용자는 서비스를 이용할 때 다음 행위를 해서는 안 됩니다:
                  <ul className="list-disc pl-5 mt-1">
                    <li>서비스의 정상적인 운영을 방해하는 행위</li>
                    <li>서비스를 통해 얻은 정보를 회사의 사전 승낙 없이 복제, 유통하는 행위</li>
                    <li>다른 이용자의 개인정보를 수집, 저장, 공개하는 행위</li>
                  </ul>
                </li>
                <li>회사는 이용자가 위와 같은 행위를 하는 경우 서비스 이용을 제한할 수 있습니다.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold mb-2">제6조 (서비스 제공의 중단)</h3>
              <p>회사는 다음 각 호에 해당하는 경우 서비스 제공을 중단할 수 있습니다:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>서비스용 설비의 보수 등 공사로 인한 부득이한 경우</li>
                <li>전기통신사업법에 규정된 기간통신사업자가 전기통신 서비스를 중단했을 경우</li>
                <li>기타 불가항력적 사유가 있는 경우</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold mb-2">제7조 (회원 탈퇴 및 자격 상실)</h3>
              <ol className="list-decimal pl-5 space-y-1">
                <li>이용자는 언제든지 회원 탈퇴를 요청할 수 있으며, 회사는 즉시 회원 탈퇴를 처리합니다.</li>
                <li>이용자가 다음 각 호의 사유에 해당하는 경우, 회사는 회원 자격을 제한 및 정지시킬 수 있습니다:
                  <ul className="list-disc pl-5 mt-1">
                    <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                    <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 경우</li>
                    <li>서비스를 이용하여 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="space-y-6">
          <div className="text-sm space-y-4">
            <div>
              <h3 className="font-bold mb-2">1. 개인정보의 수집 및 이용 목적</h3>
              <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>서비스 제공 및 운영</li>
                <li>회원 관리 및 서비스 이용에 따른 본인확인</li>
                <li>서비스 이용에 따른 통지사항 전달</li>
                <li>서비스 이용에 따른 문의사항 또는 불만 처리</li>
                <li>신규 서비스 개발 및 맞춤 서비스 제공</li>
                <li>서비스 이용에 따른 통계 및 분석</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">2. 수집하는 개인정보 항목</h3>
              <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
              <div className="space-y-2">
                <p className="font-semibold">필수항목:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>이메일 주소</li>
                  <li>비밀번호</li>
                  <li>닉네임</li>
                  <li>전화번호</li>
                </ul>
                <p className="font-semibold">선택항목:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>마케팅 정보 수신 동의</li>
                  <li>소셜 미디어 계정 정보</li>
                </ul>
                <p className="font-semibold">자동수집항목:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>IP 주소</li>
                  <li>쿠키</li>
                  <li>서비스 이용 기록</li>
                  <li>접속 로그</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">3. 개인정보의 보유 및 이용기간</h3>
              <p>회사는 이용자의 개인정보를 다음과 같이 보유 및 이용합니다:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>회원 탈퇴 시까지 (단, 관련 법령에 따라 일정 기간 보관이 필요한 정보는 해당 기간 동안 보관)</li>
                <li>회원 탈퇴 후에도 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 관계법령에서 정한 일정한 기간 동안 회원정보를 보관</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold mb-2">4. 개인정보의 파기</h3>
              <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">5. 이용자 권리와 행사방법</h3>
              <p>이용자는 다음과 같은 권리를 행사할 수 있습니다:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>개인정보 열람요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제요구</li>
                <li>처리정지 요구</li>
                <li>동의철회</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">6. 개인정보의 안전성 확보조치</h3>
              <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
                <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화</li>
                <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">7. 개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항</h3>
              <p>회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</p>
              <p>이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서 이용자는 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">8. 개인정보 보호책임자</h3>
              <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
              <div className="mt-2">
                <p>▶ 개인정보 보호책임자</p>
                <p>성명: [이름]</p>
                <p>직책: [직책]</p>
                <p>연락처: [전화번호]</p>
                <p>이메일: [이메일]</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <ModalHeader>
        <ModalTitle>{type === "terms" ? "이용약관" : "개인정보 처리방침"}</ModalTitle>
      </ModalHeader>
      <ModalBody className="max-h-[70vh] overflow-y-auto">
        {getContent()}
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          닫기
        </Button>
      </ModalFooter>
    </Modal>
  )
} 