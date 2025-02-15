interface Window {
  google: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          context?: string;
          ux_mode?: 'popup' | 'redirect';
          redirect_uri?: string;
        }) => void;
        renderButton: (element: HTMLElement, options: object) => void;
        prompt: () => void;
      };
    };
  };
} 