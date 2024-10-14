'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Spin, Typography, Button, Steps, Card, Row, Col, Space, Divider, Upload, message, Image } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface RequestDetails extends Request {
  createdAt: string;
  updatedAt: string;
  stages: { name: string; status: 'wait' | 'process' | 'finish' | 'error' }[];
  fileContent: string;
}

const RequestDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [satelliteImage, setSatelliteImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    // TODO: Replace this with actual API call
    const fetchRequestDetails = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dummyData: RequestDetails = {
        id: id as string,
        userId: 'user123',
        username: 'johndoe',
        email: 'johndoe@example.com',
        jobStatus: 'In Progress',
        requestStatus: 'Approved',
        fileUrl: 'https://example.com/file.pdf',
        createdAt: '2023-04-15T10:30:00Z',
        updatedAt: '2023-04-15T11:45:00Z',
        stages: [
          { name: 'Submitted', status: 'finish' },
          { name: 'Processing', status: 'process' },
          { name: 'Completed', status: 'wait' },
        ],
        fileContent: 'This is a placeholder for the file content...',
      };

      setRequest(dummyData);
      setLoading(false);
    };

    fetchRequestDetails();
  }, [id]);

  const handleImageUpload = (info: any) => {
    const { status, originFileObj } = info.file;
    setFileList(info.fileList.slice(-1));  // Keep only the last file

    if (status === 'done') {
      setSatelliteImage(originFileObj);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(originFileObj);
      message.success(`${info.file.name} file uploaded successfully.`);
    } else if (status === 'removed') {
      setSatelliteImage(null);
      setImagePreview(null);
      message.info(`${info.file.name} file removed.`);
    } else if (status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const handleSubmitToML = async () => {
    if (!satelliteImage) {
      message.error('Please upload a satellite image before processing the job.');
      return;
    }
    // TODO: Implement ML pipeline submission with the uploaded image
    console.log('Submitting to ML pipeline with image:', satelliteImage);
  };

  const handleDownload = () => {
    // TODO: Implement file download
    console.log('Downloading file...');
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (!request) {
    return <Title level={3}>Request not found</Title>;
  }

  return (
    <div className="request-details-page">
      <Title level={2}>Request Details</Title>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Row gutter={[24, 24]} align="middle">
            <Col span={6}>
              {/* Placeholder for profile image */}
              <div style={{ width: 100, height: 100, background: '#f0f0f0', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Text strong>{request.username[0].toUpperCase()}</Text>
              </div>
            </Col>
            <Col span={18}>
              <Title level={4}>{request.username}</Title>
              <Text type="secondary">{request.email}</Text>
              <br />
              <Text type="secondary">User ID: {request.userId}</Text>
            </Col>
          </Row>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Request ID:</Text> {request.id}
            </Col>
            <Col span={12}>
              <Text strong>Process Status:</Text> {request.jobStatus}
            </Col>
            <Col span={12}>
              <Text strong>Analysis Status:</Text> {request.requestStatus}
            </Col>
            <Col span={12}>
              <Text strong>Created:</Text> {new Date(request.createdAt).toLocaleString()}
            </Col>
            <Col span={12}>
              <Text strong>Last Updated:</Text> {new Date(request.updatedAt).toLocaleString()}
            </Col>
          </Row>
        </Card>

        <Card title="ML Pipeline Stages">
          <Steps
            items={request.stages.map(stage => ({
              title: stage.name,
              status: stage.status,
            }))}
          />
        </Card>

        <Card title="File Content">
          <pre>{request.fileContent}</pre>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            Download File
          </Button>
        </Card>

        <Card title="Satellite Image Upload">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Upload
              accept="image/*"
              fileList={fileList}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('You can only upload image files!');
                }
                return isImage || Upload.LIST_IGNORE;
              }}
              onChange={handleImageUpload}
            >
              <Button icon={<UploadOutlined />} disabled={fileList.length >= 1}>
                Upload Satellite Image
              </Button>
            </Upload>
            {imagePreview && (
              <Image
                src={imagePreview}
                alt="Uploaded satellite image"
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
            )}
          </Space>
        </Card>

        <Button 
          type="primary" 
          onClick={handleSubmitToML} 
          disabled={!satelliteImage}
        >
          Submit Job
        </Button>
      </Space>
    </div>
  );
};

export default RequestDetailsPage;
