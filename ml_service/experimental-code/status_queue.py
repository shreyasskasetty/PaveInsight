import time
import json
import pika

def send_keep_alive_message(channel, correlation_id, status_message):
    """Send a keep-alive message to the status queue."""
    message = {
        "status": status_message,
        "job_id": correlation_id,
        "timestamp": time.time()  # Optional: add a timestamp for the update
    }
    channel.basic_publish(
        exchange="",
        routing_key="status-queue",
        body=json.dumps(message),
        properties=pika.BasicProperties(
            correlation_id=correlation_id
        )
    )
    print(f"Sent keep-alive message: {status_message}")
