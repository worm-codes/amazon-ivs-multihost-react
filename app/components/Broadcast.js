"use client";
import React, { Suspense } from "react";
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

export default function Broadcast({ participantToken, streamKey }) {
  const ingestUrl = "435def77beb6.global-contribute.live-video.net";

  const client = IVSBroadcastClient.create({
    streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
    ingestEndpoint: ingestUrl,
  });

  const streamConfig = IVSBroadcastClient.BASIC_LANDSCAPE;

  const canvas = useRef(null);
  const participants = useRef([]);

  let stageRef = useRef();

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
  }, []);

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

          const audioContainer = document.getElementById("audio-container");
          //   audioContainer.appendChild(videoElement);

          //   await videoElement.play();
          console.log(participant.isLocal);
          console.log(existingAudio);

          if (!participant.isLocal && !existingAudio) {
            const audioElement = document.createElement("audio");
            audioElement.id = audioId;
            audioElement.autoplay = true;
            const streamAudio = streams.filter(
              (stream) => stream.streamType === StreamType.AUDIO
            );
            console.log(streamAudio);

            audioElement.srcObject = new MediaStream(
              streamAudio.map((stream) => stream.mediaStreamTrack)
            );
            audioContainer.appendChild(audioElement);

            await audioElement.play();
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
    await client.startBroadcast(streamKey);
  };
  console.log(canvas.current);

  return (
    <div>
      {streamKey && <button onClick={startBroadcast}>Start Broadcast</button>}
      <h1>Preview</h1>
      <canvas
        ref={canvas}
        style={{ width: "100%" }}
      ></canvas>
      <h1>participants</h1>

      <div id="audio-container"></div>
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
    </div>
  );
}
