import {
  Container,
  styled,
  Button,
  Input,
  Modal,
  Text,
} from "@nextui-org/react";
import { useDebugValue, useLayoutEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import usePeer from "../hooks/use-peer";

const Box = styled("div");

const VideoContainer = styled(Box, {
  position: "relative",
  maxW: "calc(100% - 12rem)",
  isolation: "isolate",
});

const RemoteStream = styled("video", {
  display: "block",
  width: "100%",
});
const LocalStream = styled(RemoteStream, {
  transform: "scaleX(-1)",
  position: "absolute",
  top: "$4",
  right: "$4",
  maxW: "$48",
  zIndex: 1,
});

export default function PeerPage() {
  const remoteRef = useRef<HTMLVideoElement>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const { call, receive, reject, isIncomingCall, isInCall } = usePeer(
    params.get("id") as string,
    {
      onLocalStream: renderLocalVideo,
      onRemoteStream: renderRemoteVideo,
    }
  );

  useDebugValue(isInCall, (val) => `Call status: ${val}`);

  useLayoutEffect(() => {
    if (!params.has("id")) {
      navigate("/", { replace: true, state: location });
    }
  }, [params]);

  function renderLocalVideo(stream: MediaStream) {
    console.log("stream:", stream.id);
    if (localRef.current) {
      console.log("has video ref");
      localRef.current.srcObject = stream;
    }
  }
  function renderRemoteVideo(stream: MediaStream) {
    console.log("stream:", stream.id);
    if (remoteRef.current) {
      console.log("has video ref");
      remoteRef.current.srcObject = stream;
    }
  }

  function handleCall(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!formData.has("peerId")) {
      return;
    }
    return call(formData.get("peerId")! as string);
  }

  return (
    <Container fluid>
      <Box as="form" onSubmit={handleCall} aria-label="Demo">
        <Input aria-label="Peer ID" placeholder="Receiver ID" name="peerId" />
        <Button type="submit">Call</Button>
      </Box>
      {/* <Modal closeButton open={isIncomingCall} onClose={reject}>
        <Modal.Header>
          <Text id="modal-title" size={18}>
            You are getting a{" "}
            <Text b size={18} color="#0078e7">
              Call
            </Text>
          </Text>
        </Modal.Header>
        <Modal.Footer>
          <Button auto flat color="error" onPress={reject}>
            Reject
          </Button>
          <Button auto onPress={receive}>
            Receive
          </Button>
        </Modal.Footer>
      </Modal> */}
      <VideoContainer>
        <RemoteStream ref={remoteRef} autoPlay />
        <LocalStream ref={localRef} autoPlay />
        {/* {isInCall && (
          <Button auto flat color="error" onPress={reject}>
            Close
          </Button>
        )} */}
      </VideoContainer>
    </Container>
  );
}
