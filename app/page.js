"use client";
import { useState } from "react";
import Broadcast from "./components/Broadcast";
import React, { Suspense } from "react";

export default function Home() {
  const [nowPlaying, setNowPlaying] = useState(false);
  const [participantToken, setParticipantToken] = useState("");
  const [streamKey, setStreamKey] = useState("");
  return (
    <div>
      {nowPlaying ? (
        <Suspense fallback={<div>Loading...</div>}>
          <Broadcast
            participantToken={participantToken}
            streamKey={streamKey}
          />
        </Suspense>
      ) : (
        <form action="">
          <input
            type="text"
            placeholder="Participant Token"
            value={participantToken}
            onChange={(e) => setParticipantToken(e.target.value)}
          />
          <input
            type="text"
            placeholder="Stream Key"
            value={streamKey}
            onChange={(e) => setStreamKey(e.target.value)}
          />
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              setNowPlaying(true);
            }}
          >
            {streamKey.length > 0 ? "Start Broadacst" : "Enter Stage"}
          </button>
        </form>
      )}
    </div>
  );
}
