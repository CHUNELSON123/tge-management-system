# Shared audio and video calls

Members, mentors and administrators can call from a direct conversation. The call stays open when navigating inside the application and can be minimized. Calls are one-to-one.

The browser needs permission for the microphone and, for video calls, the camera. Media access requires HTTPS, except on localhost. Incoming call notifications and ringtones also depend on browser permissions and audio autoplay rules; an incoming call is shown while the application is open.

The default connection uses a public STUN server. Some networks block direct connections. For those networks, configure a TURN relay before building the client:

```text
NEXT_PUBLIC_WEBRTC_TURN_URLS=turn:relay.example.org:3478,turns:relay.example.org:5349
NEXT_PUBLIC_WEBRTC_TURN_USERNAME=<relay-username>
NEXT_PUBLIC_WEBRTC_TURN_CREDENTIAL=<relay-credential>
```

`NEXT_PUBLIC_` values are included in browser code and visible to users. Do not use a private long-lived provider secret here; use a relay account designed for client exposure or implement short-lived TURN credentials before production. Rebuild the client after changing these variables. Verify relay connectivity from the networks and devices TGE will use.

Call signaling currently lives in the server process. A server restart interrupts signaling, and multiple server instances do not share it; a shared signaling service is needed before deploying multiple instances. Incoming calls are not delivered when the application is closed.
