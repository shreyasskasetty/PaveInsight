import json
import time
import threading
import websocket

def build_frame(command, headers=None, body=''):
    """Build a simple STOMP frame."""
    if headers is None:
        headers = {}
    frame = command + '\n'
    for k, v in headers.items():
        frame += f"{k}:{v}\n"
    frame += '\n' + body + '\0'
    return frame

def send_stomp_message(
    ws_url: str,
    destination: str,
    message_body,
    connect_headers=None
):
    """
    Connect to a WebSocket STOMP endpoint, send a single message, and disconnect.
    
    :param ws_url: WebSocket URL (e.g., "ws://localhost:8080/ws")
    :param destination: The STOMP destination to send the message to (e.g., "/app/application")
    :param message_body: A dictionary or string to send as the message body
    :param connect_headers: (Optional) dict of headers to include in the CONNECT frame
    """

    def on_message(ws, message):
        # If you want to handle any messages from the server (e.g., CONNECTED, RECEIPT), do so here
        print("Received from server:", message)

    def on_error(ws, error):
        print("WebSocket error:", error)

    def on_close(ws, close_status_code, close_msg):
        print("WebSocket closed")

    def on_open(ws):
        print("WebSocket connection opened")
        
        # --------------------------------------------------------
        # 1. Send STOMP CONNECT frame
        # --------------------------------------------------------
        default_connect_headers = {
            "accept-version": "1.2",
            "heart-beat": "0,0",
        }
        if connect_headers:
            default_connect_headers.update(connect_headers)

        connect_frame = build_frame("CONNECT", headers=default_connect_headers)
        ws.send(connect_frame)

        # --------------------------------------------------------
        # 2. Wait briefly, then send the message
        # --------------------------------------------------------
        def run(*args):
            # Naive sleep to allow time for a CONNECTED response
            time.sleep(1)  

            # Convert dict to JSON string if needed
            if isinstance(message_body, dict):
                body_str = json.dumps(message_body)
            else:
                body_str = str(message_body)

            send_frame = build_frame(
                command="SEND",
                headers={"destination": destination},
                body=body_str
            )
            ws.send(send_frame)
            print(f"Sent to {destination}: {body_str}")
            
            # Optionally allow some time for the server to process
            time.sleep(1)

            # Close the connection after sending
            ws.close()

        threading.Thread(target=run).start()

    # Create WebSocketApp with callbacks
    ws = websocket.WebSocketApp(
        ws_url,
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )

    # Run the WebSocket event loop (blocks until closed)
    ws.run_forever()


# -----------------------------------------
# Example usage (remove if not needed):
# -----------------------------------------
if __name__ == "__main__":
    ws_url = "ws://localhost:8080/ws"
    destination = "/app/application"
    message = {
        "id": 999,
        "title": "Automated Image Processing",
        "description": "Your image has been processed successfully!"
    }

    send_stomp_message(ws_url, destination, message)
