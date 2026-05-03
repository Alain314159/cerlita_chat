// WebRTC Service disabled for build stability
export const webrtcService = {
  initiateCall: async () => {},
  answerCall: async () => {},
  endCall: async () => {},
  onRemoteStream: () => {},
  onCallEnd: () => {},
  muteAudio: () => {},
  muteVideo: () => {},
};
