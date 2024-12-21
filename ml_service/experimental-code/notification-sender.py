import json
import time
import threading
import websocket

# Basic skeleton for STOMP frames
def build_frame(command, headers=None, body=''):
    if headers is None:
        headers = {}
    frame = command + '\n'
    for k, v in headers.items():
        frame += f"{k}:{v}\n"
    frame += '\n'
    frame += body + '\0'
    return frame

def on_message(ws, message):
    print("Received message from server:", message)

def on_error(ws, error):
    print("Error:", error)

def on_close(ws, close_status_code, close_msg):
    print("WebSocket closed")

def on_open(ws):
    print("WebSocket connection opened")
    # --------------------------------------------------------
    # 1. Send STOMP CONNECT frame
    # --------------------------------------------------------
    connect_frame = build_frame(
        command="CONNECT",
        headers={
            "accept-version": "1.2",
            "heart-beat": "0,0",
        }
    )
    ws.send(connect_frame)

    # We should wait for a CONNECTED frame. Because we're
    # not using a full STOMP client, we have to parse it ourselves.
    # For demonstration, just sleep a bit and then subscribe/send:
    def run(*args):
        time.sleep(1)

        # --------------------------------------------------------
        # 2. Subscribe to /all/messages
        # --------------------------------------------------------
        subscribe_frame = build_frame(
            command="SUBSCRIBE",
            headers={
                "id": "sub-1",
                "destination": "/all/messages",
                "ack": "auto",
            }
        )
        ws.send(subscribe_frame)
        print("Subscribed to /all/messages")

        # --------------------------------------------------------
        # 3. Send a message (equivalent to stompClient.send)
        # --------------------------------------------------------
        body = json.dumps({
        "id": 1,
        "title": "New Project Assignment",
        "description": "You've been assigned to the Project Alpha development team",
        })
        send_frame = build_frame(
            command="SEND",
            headers={
                "destination": "/app/application"
            },
            body=body
        )
        ws.send(send_frame)
        print(f"Sent: {body}")

    threading.Thread(target=run).start()

if __name__ == "__main__":
    ws_url = "ws://localhost:8080/ws"  # If plain WebSocket is allowed
    ws = websocket.WebSocketApp(
        ws_url,
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )

    ws.run_forever()
