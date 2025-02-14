import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="container mx-auto py-10 px-5">
      <h1 className="text-3xl font-bold mb-5 text-center">개인정보처리방침</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">1. 개인정보의 처리 목적</h2>
        <p className="text-gray-700 leading-relaxed">
          저희는 다음과 같은 목적으로 개인정보를 처리합니다. 처리한 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경될 시에는 사전 동의를 구할 예정입니다.
        </p>
        <ul className="list-disc pl-5 mt-2 text-gray-700 leading-relaxed">
          <li>서비스 제공 및 관리</li>
          <li>회원 관리</li>
          <li>불만 처리 및 분쟁 해결</li>
          <li>마케팅 및 광고 활용 (동의 시)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">2. 처리하는 개인정보의 항목</h2>
        <p className="text-gray-700 leading-relaxed">
          저희는 다음과 같은 개인정보 항목을 처리하고 있습니다.
        </p>
        <ul className="list-disc pl-5 mt-2 text-gray-700 leading-relaxed">
          <li>필수 정보: 이메일 주소, 비밀번호, 닉네임</li>
          <li>선택 정보: 프로필 사진, 스타일 선호도, 사이즈</li>
          <li>자동 수집 정보: IP 주소, 쿠키, 방문 일시, 서비스 이용 기록</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">3. 개인정보의 처리 및 보유 기간</h2>
        <p className="text-gray-700 leading-relaxed">
          원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우에는 다음과 같이 관계법령에서 정한 기간 동안 개인정보를 보관합니다.
        </p>
        <ul className="list-disc pl-5 mt-2 text-gray-700 leading-relaxed">
          <li>보존 항목: 서비스 이용 기록</li>
          <li>보존 근거: 전자상거래 등에서의 소비자보호에 관한 법률</li>
          <li>보존 기간: 5년</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">4. 개인정보의 제3자 제공</h2>
        <p className="text-gray-700 leading-relaxed">
          저희는 정보주체의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
        </p>
        <ul className="list-disc pl-5 mt-2 text-gray-700 leading-relaxed">
          <li>정보주체로부터 별도의 동의를 받은 경우</li>
          <li>법률에 특별한 규정이 있는 경우</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">5. 개인정보 처리 위탁</h2>
        <p className="text-gray-700 leading-relaxed">
          저희는 서비스 향상을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.
        </p>
        <ul className="list-disc pl-5 mt-2 text-gray-700 leading-relaxed">
          <li>수탁업체: [수탁업체명]</li>
          <li>위탁 업무 내용: [위탁 업무 내용]</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">6. 정보주체의 권리·의무 및 행사방법</h2>
        <p className="text-gray-700 leading-relaxed">
          정보주체는 개인정보와 관련하여 다음과 같은 권리를 행사할 수 있습니다.
        </p>
        <ul className="list-disc pl-5 mt-2 text-gray-700 leading-relaxed">
          <li>개인정보 열람 요구</li>
          <li>개인정보 오류 등에 대한 정정 요구</li>
          <li>개인정보 삭제 요구</li>
          <li>개인정보 처리 정지 요구</li>
        </ul>
        <p className="mt-3 text-gray-700 leading-relaxed">
          권리 행사는 개인정보보호 담당 부서를 통해 가능합니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">7. 개인정보 보호책임자</h2>
        <p className="text-gray-700 leading-relaxed">
          개인정보 보호책임자는 다음과 같습니다.
        </p>
        <ul className="list-disc pl-5 mt-2 text-gray-700 leading-relaxed">
          <li>성명: [임세훈]</li>
          <li>소속: [DEF]</li>
          <li>이메일: [sakills914@gmail.com]</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">8. 개인정보 처리방침 변경</h2>
        <p className="text-gray-700 leading-relaxed">
          본 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;