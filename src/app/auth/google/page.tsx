"use client";
import { useEffect, useState } from "react";

export default function GoogleAuthPage() {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const initializeGoogle = () => {
      try {
        if (typeof window.google === 'undefined' || !window.google.accounts) {
          throw new Error('Google 객체 초기화 실패');
        }
        
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          context: 'signup',
          ux_mode: 'redirect',
          redirect_uri: process.env.GOOGLE_SIGNUP_CALLBACK_URI
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-button"),
          {
            type: 'standard',
            theme: 'filled_blue',
            size: 'large',
            text: 'signup_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          }
        );
      } catch (error) {
        console.error('Google 초기화 실패:', error);
      }
    };

    const loadGoogleScript = () => {
      if (!document.querySelector('script[src^="https://accounts.google.com"]')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setScriptLoaded(true);
          initializeGoogle();
          console.log('Google 스크립트 로드 완료', window.google);
        };
        script.onerror = () => {
          console.error('Google 스크립트 로드 실패');
          setScriptLoaded(false);
        };
        document.body.appendChild(script);
      }
    };

    loadGoogleScript();

    return () => {
      const scripts = document.querySelectorAll('script[src^="https://accounts.google.com"]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      if (!response?.credential) {
        throw new Error('유효하지 않은 응답입니다');
      }

      const res = await fetch('/api/auth/google/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });

      const result = await res.json();
      
      if (result.isNewUser) {
        window.location.href = `/auth/signup/completion?provider=google&userId=${result.user.id}`;
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('회원가입 처리 오류:', error);
      alert('회원가입 과정에서 오류가 발생했습니다');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {scriptLoaded ? (
        <div id="google-button" className="w-[300px] h-[50px]" />
      ) : (
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">Google 서비스 연결 중...</p>
          <div className="animate-pulse bg-gray-200 w-[300px] h-[50px] rounded-lg" />
        </div>
      )}
    </div>
  );
}
