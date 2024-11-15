# app/workers/consumer.py

import pika
import json
import os
from time import sleep
from dotenv import load_dotenv
from core.pipeline import run_pipeline
load_dotenv(os.path.join(os.path.dirname(__file__), '.', '.env'))

# Configuration (replace with environment variables in production)
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST')

def process_job(job_data, jobId):
    """Simulate job processing and update stages in the MySQL database."""
    # job_id = job_data['job_id']
    if isinstance(job_data, str):
        job_data = json.loads(job_data)
    geojson_string = job_data.get('geoJson')
    try:
        result_image_url, result_shapefile_url = run_pipeline(geojson_string, jobId=jobId)
        return result_image_url, result_shapefile_url
    except Exception as e:
        raise Exception(f"An error occured processing the job: {e}")

def callback(ch, method, properties, body):
    """Callback function to handle received messages."""
    job_data = json.loads(body)
    message = {
        "correlationId": properties.correlation_id,
        "resultImageURL": None,
        "resultShapefileURL": None,
        "jobStatus": None,
        "error": None
    }
    print(job_data)
    try:
        result_image_url, result_shapefile_url = process_job(job_data, properties.correlation_id)
        message["jobStatus"] = "complete"
        message["resultImageURL"] = result_image_url
        message["resultShapefileURL"] = result_shapefile_url
        message_body = json.dumps(message)
        ch.basic_publish(exchange="", routing_key="job-reply-queue", body=message_body)
    except Exception as e:
        print(e)
        message["jobStatus"] = "incomplete"
        message["error"] = str(e)
        message_body = json.dumps(message)
        ch.basic_publish(exchange="", routing_key="job-reply-queue", body=message_body)
    ch.basic_ack(delivery_tag=method.delivery_tag)

def start_consumer():
    """Set up RabbitMQ connection and start consuming messages from an exchange with progress updates."""
    connection_params = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        heartbeat=1800,                # Set heartbeat to 1 hour
        blocked_connection_timeout=7200  # Set connection timeout for blocked connections to 1 hour
    )

    connection = pika.BlockingConnection(connection_params)
    channel = connection.channel()

    # Declare the exchange
    channel.exchange_declare(exchange='pci-analysis', exchange_type='direct', durable=True)

    # Declare and bind the queue to the exchange with the specified routing key
    channel.queue_declare(queue='pci-analysis-queue', durable=True)
    channel.queue_bind(exchange='pci-analysis', queue='pci-analysis-queue', routing_key='pci-analysis-queue')

    # Declare a separate queue for status updates, if needed
    channel.queue_declare(queue='status-queue', durable=True)

    # Set prefetch to 1 to handle one message at a time
    channel.basic_qos(prefetch_count=1)
    
    # Start consuming messages from the bound queue
    channel.basic_consume(queue='pci-analysis-queue', on_message_callback=callback)
    print("Waiting for messages. To exit press CTRL+C")
    channel.start_consuming()

if __name__ == "__main__":
    start_consumer()