'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Spin, Typography, Button, Steps, Card, Row, Col, Space, Divider, Upload, message, Image, notification } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { getRequestDetails } from '@/lib/api/request-api';
import { submitJob } from '@/lib/api/submit-job-api';
import ReactJson from 'react-json-pretty'; // Import the alternative JSON viewer
const { Title, Text } = Typography;
import { getRequestStatusString } from '@/lib/utils/requests';
interface RequestDetails extends Request {
  id: string;
  requestCreatedAt: string;
  requestUpdatedAt: string;
  jobUpdatedAt: string;
  jobCreatedAt: string;
  username: string;
  email: string;
  geoJson: string;
  message: string;
  companyName: string;
  phoneNumber: string;
  jobStatus: string;
  status: string;
  jobId: string;
}

const RequestDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [satelliteImage, setSatelliteImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const stages = [
    { name: 'Stage 1', status: 'finish' },
    { name: 'Stage 2', status: 'process' },
    { name: 'Stage 3', status: 'wait' },
    { name: 'Stage 4', status: 'wait' }
  ];
  useEffect(() => {
    const fetchRequestDetails = async () => {
      const requestInfo = await getRequestDetails(id as string);
      console.log(requestInfo.status)
      setRequest(requestInfo);
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
    // if (!satelliteImage) {
    //   message.error('Please upload a satellite image before processing the job.');
    //   return;
    // }
    // // TODO: Implement ML pipeline submission with the uploaded image
    // console.log('Submitting to ML pipeline with image:', satelliteImage);
    const result = await submitJob(id as string);
    if (result.status === 200) {
      notification.success({
        message: 'Job Submission',
        description: 'Job submitted successfully!',
      });
    } else {
      notification.error({
        message: 'Job Submission Failed',
        description: result.message || 'Job submission failed. Please try again.',
      });
    }
  };

  const handleDownload = () => {
    //Note: This is duplicate code as line number 146 in requests page put this in utils and remove redundancy later
    try {
      // Create a Blob from the GeoJSON string
      if (request?.geoJson == null){
        notification.error({
          message: 'Download Failed',
          description: 'GeoJSON content not present in the request',
        });
      }
      const blob = new Blob([request?.geoJson!], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.geojson';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      notification.error({
        message: 'Download Failed',
        description: 'There was an error downloading your file.',
      });
      console.error('Download error:', error);
    }
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
              <Text type="secondary">User ID: {request.id}</Text>
            </Col>
          </Row>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Request ID:</Text> {request.id}
            </Col>
            <Col span={12}>
              <Text strong>Analysis Status:</Text> {request.jobStatus? request.jobStatus:"Pending Job Submission"}
            </Col>
            <Col span={12}>
              <Text strong>Process Status:</Text> {getRequestStatusString(request.status)}
            </Col>
            <Col span={12}>
              <Text strong>Created:</Text> {new Date(request.requestCreatedAt).toLocaleString()}
            </Col>
            <Col span={12}>
              <Text strong>Last Updated:</Text> {new Date(request.requestUpdatedAt).toLocaleString()}
            </Col>
            <Col span={12}>
              <Text strong>Company Name:</Text> {request.companyName}
            </Col>
            <Col span={12}>
              <Text strong>Phone Number:</Text> {request.phoneNumber}
            </Col>
            <Col span={12}>
              <Text strong>Message:</Text> {request.message || "N/A"}
            </Col>
          </Row>
        </Card>

        <Card title="ML Pipeline Stages">
          <Steps
            items={stages.map(stage => ({
              title: stage.name,
              status: stage.status,
            })) as Array<{ title: string; status: 'wait' | 'process' | 'finish' }>}
          />
        </Card>

        <Card title="File Content">
          <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <ReactJson data={JSON.parse(request.geoJson)} theme="monokai" />
          </div>
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
          // disabled={!satelliteImage}
        >
          Submit Job
        </Button>
      </Space>
    </div>
  );
};

export default RequestDetailsPage;
