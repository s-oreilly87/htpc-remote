# HTPC desktop viewer

The PC remote includes a mobile desktop viewer backed by noVNC 1.7.0. When the
viewer opens in a self-hosted deployment, it dynamically loads the noVNC
`RFB` browser module and connects to the same origin at:

```text
/desktop/websockify
```

Caddy must proxy that path as a WebSocket endpoint to the websockify service on
the HTPC. The client chooses `wss://` for an HTTPS page and `ws://` for an HTTP
page, preserving the current host and port.

The viewer starts in control mode with local viewport scaling. The explicit
Control and View only buttons update noVNC's `viewOnly` property; View only
disables the mobile keyboard and remote pointer events. The mobile Keyboard
control sends text and backspaces through noVNC keysyms so punctuation, spaces,
and Unicode input remain intact. Enter, Escape, Tab, and an empty-buffer
Backspace also dispatch to the HTPC. The mobile input disables autocorrection
and capitalization so URLs are preserved. Touch handling belongs to the modal
surface so desktop gestures do not trigger the remote panel's ancestor swipe
navigation.

The Rotate button rotates the local desktop viewport in 90-degree steps. Mouse,
wheel, and touch coordinates are inverse-mapped before noVNC receives them, so
clicks and gestures continue to address the same remote locations after a
rotation. This is a viewport rotation; it does not change the physical display
orientation on the HTPC.

VNC credentials are requested only when the server emits
`credentialsrequired`. Username and password fields live in component state,
are sent with `RFB.sendCredentials`, and are cleared immediately after submit
or close. The viewer waits up to 15 seconds for loading or connection handshakes
and reports a websockify reachability error if that deadline expires; the timer
pauses while credentials are being entered and restarts after submission. A
connection closes on modal close and component unmount; failed or unexpected
disconnects expose a Reconnect action.

Demo mode never imports noVNC or opens a socket. It shows a clear simulated
state explaining that a real HTPC connection is disabled.

## Host endpoint

The HTPC host needs a websockify listener reachable by Caddy. The endpoint
contract intentionally stays same-origin so the browser does not need a
second origin or CORS configuration. Verify the host-side service and Caddy
proxy before testing the viewer from a phone.
