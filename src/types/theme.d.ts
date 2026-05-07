import 'react-native-paper';

declare module 'react-native-paper' {
  interface MD3Colors {
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    textPrimary: string;
    textTertiary: string;
    textInverse: string;
    textLink: string;
    border: string;
    online: string;
    offline: string;
    typing: string;
    messageSent: string;
    messageSentText: string;
    messageReceived: string;
    messageReceivedText: string;
    tickRead: string;
    tickDelivered: string;
  }

  interface MD3Theme {
    spacing: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    borderRadius: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
      full: number;
    };
  }
}
