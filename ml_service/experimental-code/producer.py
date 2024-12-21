import pika
import uuid
import json

def on_reply_message_received(channel, method, properties, body):
    print(f"Reply received: {body.decode()}")
    # Stop consuming after receiving the reply
    channel.stop_consuming()

# Set up connection parameters
connection_params = pika.ConnectionParameters('localhost')

# Establish connection and channel
connection = pika.BlockingConnection(connection_params)
channel = connection.channel()

# Declare the reply queue
reply_queue = channel.queue_declare(queue="", exclusive=True)
reply_queue_name = reply_queue.method.queue

# Set up a consumer on the reply queue
channel.basic_consume(
    queue=reply_queue_name,
    auto_ack=True,
    on_message_callback=on_reply_message_received
)

# Ensure the target exchange exists with durable=True
channel.exchange_declare(exchange="pci-analysis", exchange_type="direct", durable=True)
channel.queue_declare(queue="pci-analysis-queue", durable=True)

# Prepare the message with unique correlation ID
message = {
    "geoJson": {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-96.35756492614746, 30.624765985790777],
                    [-96.35082721710205, 30.631745427412053],
                    [-96.33979797363281, 30.622550184776674],
                    [-96.34868144989014, 30.61497914860055],
                    [-96.35756492614746, 30.624765985790777]
                ]
            ]
        }
    },
    "id": "57",
}
cor_id = str(uuid.uuid4())
message_body = json.dumps(message)

# Publish the message to the exchange with the reply_to and correlation_id properties
channel.basic_publish(
    exchange="pci-analysis",
    routing_key="pci-analysis-queue",
    body=message_body,
    properties=pika.BasicProperties(
        reply_to=reply_queue_name,
        correlation_id=cor_id,
        content_type="application/json"
    )
)

print("Starting Client")
print(f"Sending Request: {cor_id}")

# Start consuming from the reply queue to listen for the response
channel.start_consuming()
