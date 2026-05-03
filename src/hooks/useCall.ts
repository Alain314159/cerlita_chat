// WebRTC calls disabled temporarily for build stability
export function useCall() {
  return {
    isCalling: false,
    activeCall: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoMuted: false,
    initiateCall: () => { console.log('Calls are temporarily disabled'); },
    answerCall: () => {},
    endCall: () => {},
    toggleMute: () => {},
    toggleVideo: () => {},
  };
}
