import { useEffect, useRef, useCallback, useState } from "react";
import { Peer, type MediaConnection, type DataConnection } from "peerjs";

type PeerOptions = {
  onLocalStream(localStream: MediaStream): void;
  onRemoteStream(remoteStream: MediaStream): void;
};

export const CallType = Object.freeze({
  VIDEO: {
    video: true,
    audio: true,
  },
  AUDIO: {
    video: false,
    audio: true,
  },
});
export type CallType = {
  video: boolean;
  audio: boolean;
};

export default function usePeer(id: string, opts: PeerOptions) {
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<CallType>(CallType.AUDIO);

  const peer = useRef<Peer>();
  const callRef = useRef<MediaConnection>();

  useEffect(() => {
    return () => {
      peer.current = undefined;
    };
  }, []);

  useEffect(() => {
    if (peer.current) {
      peer.current.reconnect();
    } else {
      peer.current = new Peer(id, {
        host: "192.168.1.3",
        port: 4000,
        path: "/peer/pressure",
      });
    }

    peer.current.on("connection", onConnect);
    peer.current.on("error", onError);
    peer.current.on("open", onOpen);
    peer.current.on("call", onIncomingCall);

    return () => {
      callRef.current?.close();
      peer.current?.off("call", onIncomingCall);
      peer.current?.off("open", onOpen);
      peer.current?.off("error", onError);
      peer.current?.off("connection", onConnect);
      // peer.current?.destroy();
    };
  }, [id]);

  // useEffect(() => {
  //   callRef.current?.localStream?.getVideoTracks().forEach((videoTrack) => {
  //     videoTrack.enabled = callType.video;
  //   });
  //   callRef.current?.localStream?.getAudioTracks().forEach((audioTrack) => {
  //     audioTrack.enabled = callType.audio;
  //   });
  // }, [callType]);

  function onOpen(id: string) {
    console.log({ id });
  }

  function onConnect(conn: DataConnection) {
    conn.on("data", (data) => {
      console.log(`received: ${data}`);
    });
    conn.on("open", () => {
      conn.send("hello!");
    });
    conn.on("close", () => {
      conn.send("bye!");
    });
    conn.on("error", (err) => {
      console.log("Connection error", err.message);
    });
  }

  function onIncomingCall(call: MediaConnection) {
    takeCall(call);
    callRef.current = call;
    console.log(call.metadata);
    if (call.metadata) {
      setCallType(call.metadata);
    }
    setIsIncomingCall(true);
  }

  function onError(err: Error) {
    console.log(err.message);
  }

  const call = useCallback(async (id: string, type = CallType.VIDEO) => {
    if (!peer.current) {
      return;
    }
    console.log("called", { id });

    try {
      console.log(navigator);
      const conn = peer.current.connect(id);
      onConnect(conn);
      const stream = await navigator.mediaDevices.getUserMedia(type);
      const call = peer.current.call(id, stream, { metadata: type });
      setCallType(type);
      setIsInCall(true);
      opts.onLocalStream(stream);
      console.log("streaming in local");
      call.on("error", console.log);
      call.on("close", () => console.log("closed"));
      call.on("iceStateChanged", console.log);
      call.on("stream", (str) => {
        console.log("local gas gas");
        opts.onRemoteStream(str);
      });
      callRef.current = call;
    } catch (err) {
      console.error("Failed to call", err);
    }
  }, []);

  const takeCall = useCallback(
    async (call: MediaConnection) => {
      try {
        console.log(navigator);
        const stream = await navigator.mediaDevices.getUserMedia(callType);
        call.answer(stream); // Answer the call with an A/V stream.
        setIsInCall(true);
        console.log("taking call", call);
        opts.onLocalStream(stream);
        call.on("stream", opts.onRemoteStream);
      } catch (err) {
        console.error("Failed to receive", err);
      } finally {
        setIsIncomingCall(false);
      }
    },
    [callType]
  );

  const receive = useCallback(async () => {
    if (!isIncomingCall || !callRef.current) {
      return;
    }
    takeCall(callRef.current);
  }, [isIncomingCall, takeCall]);

  const reject = useCallback(() => {
    callRef.current?.close();
    setIsIncomingCall(false);
    setIsInCall(false);
    callRef.current = undefined;
  }, []);

  return {
    call,
    receive,
    reject,
    isIncomingCall,
    isInCall,
    callType,
    setCallType,
  };
}
