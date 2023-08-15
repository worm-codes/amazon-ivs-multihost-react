"use client";
import IVSBroadcastClient, {
  LocalStageStream,
  Stage,
  StageEvents,
  StageParticipantInfo,
  StageStream,
  StreamType,
  SubscribeType,
} from "amazon-ivs-web-broadcast";
import { createRef, useEffect, useRef, useState } from "react";

export default function Home() {
  const ingestUrl = "435def77beb6.global-contribute.live-video.net";

  const participantToken =
    "eyJhbGciOiJLTVMiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE2OTIxMTU0NTYsImlhdCI6MTY5MjA4OTIzNiwianRpIjoiQ1JyVjNqZDNUMldkIiwicmVzb3VyY2UiOiJhcm46YXdzOml2czpldS1jZW50cmFsLTE6NDYxMDc0NzU1NzI2OnN0YWdlL1BnM2tBVWtYNDN3aiIsInRvcGljIjoiUGcza0FVa1g0M3dqIiwiZXZlbnRzX3VybCI6IndzczovL2V1LWNlbnRyYWwtMS5ldmVudHMubGl2ZS12aWRlby5uZXQiLCJ3aGlwX3VybCI6Imh0dHBzOi8vNDM1ZGVmNzdiZWI2Lmdsb2JhbC53aGlwLmxpdmUtdmlkZW8ubmV0IiwidXNlcl9pZCI6IjEiLCJhdHRyaWJ1dGVzIjp7ImRpc3BsYXlOYW1lIjoiQWxpIEthYW4gS2lyacWfIn0sImNhcGFiaWxpdGllcyI6eyJhbGxvd19wdWJsaXNoIjp0cnVlLCJhbGxvd19zdWJzY3JpYmUiOnRydWV9LCJ2ZXJzaW9uIjoiMC4zIn0.MGQCMCW1dmZNTeOPYiZG4R4C8oasDibtukuEam0qo1t5tI5Zz_H_oViUMqlhD0CKIKKgoQIwfsJ1xYODJyEk9JLzaq7WBzqqQRS8dpHsnwIv4b4gs_24hKfOfIXE1McF2pop1jjU";

  const client = IVSBroadcastClient.create({
    streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
    ingestEndpoint: ingestUrl,
  });

  const streamConfig = IVSBroadcastClient.BASIC_LANDSCAPE;

  const canvas = useRef(null);
  // const [participants, setParticipants] = useState([]);
  const participants = useRef([]);
  const videos = useRef([]);
  let stageRef = useRef();
  const audios = useRef([]);
  const [participantState, setParticipantState] = useState([]);

  const [stateRefresh, setStateRefresh] = useState(false);

  const addToVideoRefs = (el) => {
    if (el && !videos.current.includes(el)) {
      videos.current.push(el);
    }
  };
  const addToAudioRefs = (el) => {
    if (el && !audios.current.includes(el)) {
      audios.current.push(el);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      await usePermissions();

      await loadSelfInitials();
    };

    loadInitial();

    return () => {
      console.log("cleanup runss");
      stageRef.current?.leave();
      client?.detachPreview();
      client?.stopBroadcast();
    };
  }, [audios, videos]);

  const loadSelfInitials = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === "videoinput");
    const audioDevices = devices.filter((d) => d.kind === "audioinput");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: audioDevices[0].deviceId },
      video: { deviceId: videoDevices[0].deviceId },
    });
    const audioTrack = new LocalStageStream(stream.getAudioTracks()[0]);
    const videoTrack = new LocalStageStream(stream.getVideoTracks()[0]);

    stageRef.current = new Stage(participantToken, {
      stageStreamsToPublish() {
        return [audioTrack, videoTrack];
      },
      shouldPublishParticipant(participant) {
        return true;
      },
      shouldSubscribeToParticipant(participant) {
        return SubscribeType.AUDIO_VIDEO;
      },
    });

    client.enableVideo();
    client.enableAudio();

    if (canvas.current) {
      client.attachPreview(canvas.current);
    }

    stageRef.current?.on(
      StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED,
      async (participant, streams) => {
        console.log("STAGE_PARTICIPANT_STREAMS_ADDED", participant);

        // add participants to broadcast if participant not exists
        if (!participants.current.find((p) => p.id === participant.id)) {
          participants.current = [...participants.current, participant];
        }

        // wait render video elements that is created by vue convert it to reactjs
        //set time out 1 sec
        // Wrap the code that needs to interact with DOM in a setTimeout
        // setParticipantState((prev) => [...prev, participant]);
        setTimeout(async () => {
          // const videoId = `video-${participant.id}`;
          const audioId = `audio-${participant.id}`;
          // const existingVideo = document.getElementById(videoId);
          const existingAudio = document.getElementById(audioId);
          // if (!existingVideo) {
          //   const videoElement = document.createElement("video");
          //   videoElement.id = videoId;
          //   videoElement.autoplay = true;
          //   const streamsToDisplay = streams.filter(
          //     (stream) => stream.streamType === StreamType.VIDEO
          //   );
          //   videoElement.srcObject = new MediaStream(
          //     streamsToDisplay.map((stream) => stream.mediaStreamTrack)
          //   );

          const videoContainer = document.getElementById("video-container");
          //   videoContainer.appendChild(videoElement);

          //   await videoElement.play();

          if (!participant.isLocal && !existingAudio) {
            const audioElement = document.createElement("audio");
            audioElement.id = audioId;
            audioElement.autoplay = true;
            const streamAudio = streams.filter(
              (stream) => stream.streamType === StreamType.AUDIO
            );

            audioElement.srcObject = new MediaStream(
              streamAudio.map((stream) => stream.mediaStreamTrack)
            );

            await audioElement.play();

            videoContainer.appendChild(audioElement);
          }
          // }

          // const video = videos.current.find(
          //   (v) => v.dataset.participantId === participant.id
          // );
          // console.log(videos.current);

          // if (!video) return;

          // const streamsToDisplay = streams.filter(
          //   (stream) => stream.streamType === StreamType.VIDEO
          // );

          // // const streamVideo = streams.filter(
          // //   (stream) => stream.streamType === StreamType.VIDEO
          // // );
          // video.srcObject = new MediaStream(
          //   streamsToDisplay.map((stream) => stream.mediaStreamTrack)
          // );

          // await video.play();
          // console.log(audios.current);
          // if (!participant.isLocal) {
          //   const audio = audios.current.find(
          //     (v) => v.dataset.participantId === participant.id
          //   );
          //   const streamAudio = streams.filter(
          //     (stream) => stream.streamType === StreamType.AUDIO
          //   );
          //   audio.srcObject = new MediaStream(
          //     streamAudio.map((stream) => stream.mediaStreamTrack)
          //   );

          //   await audio.play();
          // }
        }, 1000);
        setTimeout(async () => {
          await Promise.all([
            ...streams
              .filter((stream) => stream.streamType === StreamType.VIDEO)
              .map(
                async (stream) =>
                  await client.addVideoInputDevice(
                    new MediaStream([stream.mediaStreamTrack]),
                    `video-${participant.id}`,
                    {
                      index: 0,
                      width:
                        streamConfig.maxResolution.width / participants.length,
                      x:
                        (participants.length - 1) *
                        (streamConfig.maxResolution.width /
                          participants.length),
                    }
                  )
              ),
            ...streams
              .filter((stream) => stream.streamType === StreamType.AUDIO)
              .map(
                async (stream) =>
                  await client.addAudioInputDevice(
                    new MediaStream([stream.mediaStreamTrack]),
                    `audio-${participant.id}`
                  )
              ),
          ]);

          console.log("participants", participants.current);
          refreshVideoPositions();
        }, 1000);
      }
    );

    stageRef.current?.on(
      StageEvents.STAGE_PARTICIPANT_STREAMS_REMOVED,
      async (participant) => {
        console.log("STAGE_PARTICIPANT_STREAMS_REMOVED:", participant);

        // remove participant from broadcast
        participants.current = participants.current.filter(
          (p) => p.id !== participant.id
        );

        client.removeVideoInputDevice(`video-${participant.id}`);
        client.removeAudioInputDevice(`audio-${participant.id}`);
        refreshVideoPositions();
        // stageRef.current?.refreshStrategy();
      }
    );

    await stageRef.current.join();
  };

  const refreshVideoPositions = () => {
    console.log("refreshVideoPositions:");

    participants.current.forEach((participant, index) =>
      client.updateVideoDeviceComposition(`video-${participant.id}`, {
        index: 0,
        width: streamConfig.maxResolution.width / participants.current.length,
        x:
          index *
          (streamConfig.maxResolution.width / participants.current.length),
      })
    );
  };

  const usePermissions = async () => {
    let permissions = {
      audio: false,
      video: false,
    };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      for (const track of stream.getTracks()) {
        track.stop();
      }
      permissions = { video: true, audio: true };
    } catch (err) {
      permissions = { video: false, audio: false };
      console.error(err);
    }
    // If we still don't have permissions after requesting them display the error message
    if (!permissions.video) {
      alert("Failed to get video permissionss.");
    } else if (!permissions.audio) {
      alert("Failed to get audio permissions.");
    }
  };

  const startBroadcast = async () => {
    client.config.ingestEndpoint = ingestUrl;
    await client.getAudioContext().resume();
    await client.startBroadcast(
      "sk_eu-central-1_RjoxdrtHZKjf_jshOEBiJiLpgcnCgFUhq0EE7Jaaj7r"
    );
  };
  console.log(canvas.current);

  return (
    <div>
      <h1>canvas</h1>
      <canvas
        ref={canvas}
        style={{ width: "100%" }}
      ></canvas>
      <h1>participants</h1>

      <div id="video-container"></div>
      {/* {participants.current?.map((participant, index) => (
        <div key={index}>
          <video
            data-participant-id={participant.id}
            ref={addToVideoRefs}
            playsInline
            autoPlay
          ></video>
          {!participant.isLocal && (
            <audio
              data-participant-id={participant.id}
              ref={addToAudioRefs}
              autoPlay
            />
          )}
        </div>
      ))} */}
      <h1>start broadcast</h1>
      <button onClick={startBroadcast}>start broadcast</button>
    </div>
  );
}
