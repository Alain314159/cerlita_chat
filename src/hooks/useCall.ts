// WebRTC calls disabled temporarily for build stability
export function useCall() {
  return {
    isCalling: false,
    activeCall: null,
    currentCall: null as any,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoMuted: false,
    isVideoOff: false,
    duration: 0,
    initiateCall: () => { console.log('Calls are temporarily disabled'); },
    answerCall: () => {},
    endCall: () => {},
    toggleMute: () => {},
    toggleVideo: () => {},
  };
}
