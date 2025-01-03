import json
import threading
import time
import websocket


def build_frame(command, headers=None, body=''):
    """
    Build a simple STOMP frame.
    """
    if headers is None:
        headers = {}
    frame = command + '\n'
    for k, v in headers.items():
        frame += f"{k}:{v}\n"
    frame += '\n' + body + '\0'
    return frame


class STOMPConnectionManager:
    """
    Manages a long-lived STOMP-over-WebSocket connection.
    Allows sending multiple messages without reconnecting each time.
    """

    def __init__(self, ws_url, connect_headers=None, debug=False):
        """
        :param ws_url: WebSocket URL, e.g. 'ws://localhost:8080/ws'
        :param connect_headers: Optional dict for CONNECT frame (e.g. auth tokens)
        :param debug: If True, enables websocket-client debug logs
        """
        self.ws_url = ws_url
        self.connect_headers = connect_headers or {}
        self.debug = debug

        # WebSocketApp instance
        self.ws = None

        # Track whether we're STOMP-connected
        self.connected = False

        # An event to signal that we have received a STOMP CONNECTED frame
        self._connected_event = threading.Event()

        if self.debug:
            websocket.enableTrace(True)

    def connect(self, timeout=5):
        """
        Create the WebSocketApp, start it in a background thread, and wait
        up to 'timeout' seconds for a STOMP CONNECTED frame.
        """

        def on_open(ws):
            # Send STOMP CONNECT
            default_headers = {
                "accept-version": "1.2",
                "heart-beat": "0,0",
                "ack": "auto",
                "id": "sub-1",
            }
            default_headers.update(self.connect_headers)

            connect_frame = build_frame("CONNECT", headers=default_headers)
            ws.send(connect_frame)
            print("[STOMPConnectionManager] Sent CONNECT frame")

        def on_message(ws, message):
            # Check if it's a CONNECTED frame
            if message.startswith("CONNECTED\n"):
                print("[STOMPConnectionManager] Received CONNECTED frame")
                self.connected = True
                self._connected_event.set()
            else:
                # You could parse other STOMP frames here (RECEIPT, MESSAGE, etc.)
                print("[STOMPConnectionManager] Received message:", message)

        def on_error(ws, error):
            print("[STOMPConnectionManager] WebSocket error:", error)

        def on_close(ws, close_status_code, close_msg):
            print("[STOMPConnectionManager] WebSocket closed")
            # If the connection closes unexpectedly, set connected to False
            self.connected = False
            self._connected_event.set()

        # Create the WebSocketApp
        self.ws = websocket.WebSocketApp(
            self.ws_url,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )

        # Start WebSocket in a background thread
        self._thread = threading.Thread(target=self.ws.run_forever, daemon=True)
        self._thread.start()

        # Wait for 'CONNECTED' or timeout
        success = self._connected_event.wait(timeout)
        if not success:
            raise TimeoutError("Timed out waiting for STOMP CONNECTED frame.")

        if not self.connected:
            raise ConnectionError("Failed to connect and receive CONNECTED frame.")

        print("[STOMPConnectionManager] STOMP connection is fully established.")

    def send_message(self, destination, body):
        """
        Send a STOMP SEND frame. Raises an exception if not connected.
        
        :param destination: STOMP destination, e.g. '/app/topic'
        :param body: dict or string to send as the frame body
        """
        if not self.connected or not self.ws:
            raise ConnectionError("Not connected to STOMP server.")

        # Convert dict to JSON if needed
        if isinstance(body, dict):
            body_str = json.dumps(body)
        else:
            body_str = str(body)

        send_frame = build_frame(
            command="SEND",
            headers={"destination": "/all/messages"},
            body=body_str
        )
        self.ws.send(send_frame)
        print(f"[STOMPConnectionManager] Sent to {destination}: {body_str}")

    def disconnect(self):
        """
        Optionally send a DISCONNECT frame, then close the WebSocket cleanly.
        """
        if self.connected and self.ws:
            # Send DISCONNECT frame
            disconnect_frame = build_frame("DISCONNECT")
            self.ws.send(disconnect_frame)
            print("[STOMPConnectionManager] Sent DISCONNECT frame")

        # Close the WebSocket
        if self.ws:
            self.ws.close()
        self.connected = False
        print("[STOMPConnectionManager] Connection closed")

if __name__ == "__main__":
    manager = STOMPConnectionManager(
        ws_url="ws://localhost:8080/ws",
        connect_headers={"Authorization": "Bearer some-token"},
        debug=True
    )

    try:
        # 1. Connect (blocking until CONNECTED or timeout)
        manager.connect(timeout=5)

        manager.send_message(
            destination="/app/notify",
            body={ "title": "Automated Image Processing", 
                  "title": "Automated Image Processing",
                  "description": "Your image has been processed successfully!"}
        )

    except (TimeoutError, ConnectionError) as e:
        print("Failed to connect or send message:", e)
    finally:
        # 3. Disconnect
        manager.disconnect()
