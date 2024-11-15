import boto3
import yaml
from botocore.exceptions import NoCredentialsError, ClientError
from dotenv import load_dotenv
import os
import sys

load_dotenv(os.path.join(os.path.dirname(__file__), '../../../../', '.env'))
class S3Uploader:
    def __init__(self, config_path):
        # Load configuration from YAML file
        self.config = self._load_config(config_path)
        # Initialize the S3 client using configuration
        self.s3_client = boto3.client(
            's3',
            region_name=self.config['s3']['region'],
            aws_access_key_id=os.getenv('AWS_S3_ACCESS_KEY'),
            aws_secret_access_key=os.getenv('AWS_S3_SECRET_KEY')
        )
    
    def _load_config(self, file_path):
        with open(file_path, 'r') as config_file:
            config = yaml.safe_load(config_file)
        return config

    def upload_image(self, file_path):
        # Construct object key with optional folder
        object_key = f"{self.config['s3']['folder']}{file_path.split('/')[-1]}"
        
        try:
            # Additional arguments, including encryption if configured
            # extra_args = {'ACL': 'private'}
            # if self.config['s3'].get('encryption', False):
            #     extra_args['ServerSideEncryption'] = 'AES256'
            
            # Upload the file to the specified S3 bucket
            response = self.s3_client.upload_file(
                file_path,
                self.config['s3']['bucket_name'],
                object_key,
                # ExtraArgs=extra_args
            )
            print(f"Uploaded {file_path.split('/')[-1]} successfuly")
            url = f"https://{self.config['s3']['bucket_name']}.s3.{ self.config['s3']['region']}.amazonaws.com/{object_key}"
            return url
        except NoCredentialsError:
            print("Credentials not available.")
        except ClientError as e:
            print(f"Error uploading file: {e}")