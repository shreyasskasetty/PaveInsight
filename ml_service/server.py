# app/workers/async_consumer.py

import asyncio
import json
import os
import logging
import pika
from pika.adapters.asyncio_connection import AsyncioConnection
from pika.exchange_type import ExchangeType
from dotenv import load_dotenv
from core.pipeline import run_pipeline

load_dotenv(os.path.join(os.path.dirname(__file__), '.', '.env'))

# Configuration (replace with environment variables in production)
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST')

LOG_FORMAT = '%(levelname)s - %(asctime)s - %(name)s - %(message)s'
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
LOGGER = logging.getLogger(__name__)

class AsyncConsumer:
    EXCHANGE = 'pci-analysis'
    QUEUE = 'pci-analysis-queue'
    ROUTING_KEY = 'pci-analysis-queue'
    STATUS_QUEUE = 'status-queue'
    EXCHANGE_TYPE = ExchangeType.direct
    REPLY_QUEUE = 'job-reply-queue'  

    def __init__(self, amqp_url):
        self._amqp_url = amqp_url
        self._connection = None
        self._channel = None
        self._reply_channel = None
        self._consumer_tag = None
        self.should_reconnect = False
        self._prefetch_count = 1

    def connect(self):
        """Establish an asynchronous connection to RabbitMQ."""
        LOGGER.info("Connecting to RabbitMQ at %s", self._amqp_url)
        connection_params = pika.ConnectionParameters(
            host=self._amqp_url,
            heartbeat=1800,  # Send heartbeat every 60 seconds
            blocked_connection_timeout=7200  # Timeout for blocked connection is 5 minutes
        )
    
        return AsyncioConnection(
            pika.URLParameters(self._amqp_url),
            on_open_callback=self.on_connection_open,
            on_open_error_callback=self.on_connection_open_error,
            on_close_callback=self.on_connection_closed
        )
    
        
    def on_connection_open(self, connection):
        """Callback when connection is opened successfully."""
        LOGGER.info("Connection opened")
        self._connection = connection
        self.open_channel()


    def on_connection_open_error(self, _unused_connection, error):
        """Callback for handling connection open errors."""
        LOGGER.error("Connection open failed: %s", error)
        self.reconnect()

    def on_connection_closed(self, connection, reason):
        """Callback for handling unexpected connection closures."""
        LOGGER.warning("Connection closed, reconnecting: %s", reason)
        self._channel = None
        if not self.should_reconnect:
            self.reconnect()

    def reconnect(self):
        """Initiates reconnection."""
        self.should_reconnect = True
        if self._connection:
            self._connection.ioloop.stop()

    def open_channel(self):
        """Opens the main and reply channels."""
        LOGGER.info("Opening the main channel")
        self._connection.channel(on_open_callback=self.on_channel_open)

        LOGGER.info("Opening the reply channel")
        self._connection.channel(on_open_callback=self.on_reply_channel_open)

    def on_channel_open(self, channel):
        """Callback when channel is opened successfully."""
        LOGGER.info("Channel opened")
        self._channel = channel
        self.setup_exchange()

    def on_reply_channel_open(self, channel):
        """Callback when the reply channel is opened successfully."""
        LOGGER.info("Reply channel opened")
        self._reply_channel = channel

    def setup_exchange(self):
        """Declares an exchange."""
        LOGGER.info("Declaring exchange: %s", self.EXCHANGE)
        self._channel.exchange_declare(
            exchange=self.EXCHANGE,
            exchange_type=self.EXCHANGE_TYPE,
            durable=True,
            callback=self.on_exchange_declared
        )

    def on_exchange_declared(self, _unused_frame):
        """Callback when the exchange is declared."""
        LOGGER.info("Exchange declared")
        self.setup_queue()

    def setup_queue(self):
        """Declares and binds the queue to the exchange."""
        LOGGER.info("Declaring and binding queue: %s", self.QUEUE)
        self._channel.queue_declare(queue=self.QUEUE, durable=True, callback=self.on_queue_declared)
    
    def on_qos_set(self, _unused_frame):
        """Callback when QoS is set. Begins message consumption."""
        LOGGER.info("QoS set, starting to consume messages")
        self._consumer_tag = self._channel.basic_consume(
            queue=self.QUEUE, on_message_callback=self.on_message_sync
    )
        
    def on_queue_declared(self, _unused_frame):
        """Callback when the queue is declared."""
        LOGGER.info("Queue declared, binding to exchange with routing key: %s", self.ROUTING_KEY)
        self._channel.queue_bind(
            exchange=self.EXCHANGE,
            queue=self.QUEUE,
            routing_key=self.ROUTING_KEY,
            callback=self.on_queue_bound
        )

    def on_queue_bound(self, _unused_frame):
        """Callback when the queue is bound. Sets QoS and starts consuming."""
        LOGGER.info("Queue bound, setting QoS")
        self._channel.basic_qos(prefetch_count=self._prefetch_count, callback=self.on_qos_set)

    def process_job(self, job_data, jobId):
        """Processes the job by running the pipeline and returns the result URLs."""
        geojson_string = job_data.get("geoJson")
        try:
            result_image_url, result_shapefile_url = run_pipeline(geojson_string, jobId=jobId)
            return result_image_url, result_shapefile_url
        except Exception as e:
            LOGGER.error(f"Error processing job: {e}")
            raise

    def on_message_sync(self, channel, method, properties, body):
        """Wraps the async on_message coroutine to be compatible with pika."""
        asyncio.create_task(self.on_message(channel, method, properties, body))

    async def process_job_async(self, job_data, jobId):
        """Run the synchronous process_job in a separate thread."""
        loop = asyncio.get_event_loop()
        result = await asyncio.to_thread(self.process_job, job_data, jobId)
        return result

    async def on_message(self, _unused_channel, basic_deliver, properties, body):
        """Handles incoming messages and processes them asynchronously."""
        LOGGER.info("Received message %s", body)
        job_data = json.loads(body)
        if isinstance(job_data, str):
            job_data = json.loads(job_data)
        
        message = {
            "correlationId": properties.correlation_id,
            "resultImageURL": None,
            "resultShapefileURL": None,
            "jobStatus": None,
            "jobId": job_data.get("id"),
            "error": None
        }
        print(message)
        try:
            result_image_url, result_shapefile_url = await self.process_job_async(job_data, properties.correlation_id)
            message["jobStatus"] = "complete"
            message["resultImageURL"] = result_image_url
            message["resultShapefileURL"] = result_shapefile_url
        except Exception as e:
            message["jobStatus"] = "incomplete"
            message["error"] = str(e)

        message_body = json.dumps(message)
        # Publishing the reply to the job-reply-queue on the separate reply channel
        if self._reply_channel:
            self._reply_channel.basic_publish(
                exchange="", routing_key=self.REPLY_QUEUE, body=message_body
            )
        else:
            LOGGER.error("Reply channel is not open. Unable to send reply.")
        
        # Acknowledge the message on the main consuming channel
        self._channel.basic_ack(basic_deliver.delivery_tag)

    def stop(self):
        """Stops the consumer and closes connections gracefully."""
        if self._channel:
            LOGGER.info("Stopping consumer")
            self._channel.basic_cancel(self._consumer_tag, callback=self.on_cancel)

    def on_cancel(self, _unused_frame):
        """Callback when consumer cancel is confirmed, closing the connection."""
        LOGGER.info("Consumer cancellation confirmed")
        self._channel.close()

    def run(self):
        """Starts the consumer's asynchronous connection loop."""
        self._connection = self.connect()
        self._connection.ioloop.run_forever()

class ReconnectingAsyncConsumer:
    """Wraps AsyncConsumer to manage reconnection logic with exponential backoff."""

    def __init__(self, amqp_url):
        self._amqp_url = amqp_url
        self._consumer = AsyncConsumer(amqp_url)
        self._reconnect_delay = 0

    def run(self):
        while True:
            try:
                self._consumer.run()
            except KeyboardInterrupt:
                self._consumer.stop()
                break
            self._maybe_reconnect()

    def _maybe_reconnect(self):
        if self._consumer.should_reconnect:
            self._consumer.stop()
            self._reconnect_delay = min(self._reconnect_delay + 1, 30)
            LOGGER.info("Reconnecting after %d seconds", self._reconnect_delay)
            asyncio.sleep(self._reconnect_delay)
            self._consumer = AsyncConsumer(self._amqp_url)

def main():
    amqp_url = f"amqp://{RABBITMQ_HOST}"
    consumer = ReconnectingAsyncConsumer(amqp_url)
    consumer.run()

if __name__ == "__main__":
    main()
