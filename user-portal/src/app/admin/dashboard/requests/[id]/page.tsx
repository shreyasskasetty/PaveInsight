'use client'
import React, { use, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Spin, Typography, Button, Card, Row, Col, Space, Divider, Upload, message, Image, notification, Popconfirm, Table } from 'antd';
import { DownloadOutlined, UploadOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getRequestDetails } from '@/lib/api/request-api';
import { submitJob, deleteJob, finalizeJob, resetFinalizedJob } from '@/lib/api/job-api';
import ReactJson from 'react-json-pretty';
const { Title, Text } = Typography;
import { getRequestStatusString } from '@/lib/utils/requests';
import { useRouter } from 'next/navigation';
import { sendResultsEmail } from '@/lib/api/request-api';
import { useRefreshContext } from '@/app/context/RefreshContext';

interface Job {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  finalized: boolean;
}

interface RequestDetails extends Request {
  id: string;
  requestCreatedAt: string;
  requestUpdatedAt: string;
  username: string;
  email: string;
  geoJson: string;
  message: string;
  companyName: string;
  phoneNumber: string;
  status: string;
  jobs: Job[];
}

const RequestDetailsPage: React.FC = () => {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [satelliteImage, setSatelliteImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [finalizedJobId, setFinalizedJobId] = useState<string | null>(null);

  const fetchRequestDetails = async () => {
    const requestInfo = await getRequestDetails(id as string);
    setRequest({...requestInfo});
    console.log(requestInfo)
    setLoading(false);

    // Track the finalized job
    const finalizedJob = requestInfo.jobs.find((job: Job) => job.finalized);
    if (finalizedJob) {
      setFinalizedJobId(finalizedJob.id); // Store the ID of the finalized job
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const handleImageUpload = (info: any) => {
    const { status, originFileObj } = info.file;
    setFileList(info.fileList.slice(-1));

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

  const handleSubmitJob = async () => {
    const result = await submitJob(id as string);
    if (result.status === 200) {
      notification.success({
        message: 'Job Submission',
        description: 'Job submitted successfully!',
      });
      // Refresh the request details to show the new job
      const requestInfo = await getRequestDetails(id as string);
      setRequest(requestInfo);
    } else {
      notification.error({
        message: 'Job Submission Failed',
        description: result.message || 'Job submission failed. Please try again.',
      });
    }
  };

  const handleDeleteJob = async (requestId: string | undefined, jobId: number) => {
    fetchRequestDetails();
    if (!requestId) {
      throw new Error('Request ID is undefined');
    }
    if (!jobId) {
      throw new Error('Job ID is undefined');
    }
    const result = await deleteJob(requestId, jobId);
    if (result.status === 200) {
      notification.success({
        message: 'Job Deleted',
        description: 'Job deleted successfully!',
      });
      // Refresh the request details
      const requestInfo = await getRequestDetails(id as string);
      setRequest(requestInfo);
    } else {
      notification.error({
        message: 'Job Deletion Failed',
        description: result.message || 'Failed to delete job. Please try again.',
      });
    }
  };

  const handleFinalizeJob = async (requestId: string | undefined, jobId: number | undefined, isFinalized: boolean) => {
    if (!requestId) {
      throw new Error('Request ID is undefined');
    }
    if (!jobId) {
      throw new Error('Job ID is undefined');
    }
    const result = isFinalized
      ? await resetFinalizedJob(requestId, jobId)
      : await finalizeJob(requestId, jobId);

    if (result.status === 200) {
      notification.success({
        message: isFinalized ? 'Job Reset' : 'Job Finalized',
        description: isFinalized ? 'Job has been reset successfully!' : 'Job has been finalized successfully!',
      });
      // Refresh the request details
      fetchRequestDetails();
      // If the job was reset, update finalizedJobId to null or handle accordingly
      if (isFinalized) {
        setFinalizedJobId(null);  // Reset the finalizedJobId after reset
      } else {
        setFinalizedJobId(jobId?.toString() || null);  // Set the finalized job ID after finalization
      }
    } else {
      notification.error({
        message: isFinalized ? 'Job Reset Failed' : 'Job Finalization Failed',
        description: result.message || 'Operation failed. Please try again.',
      });
    }
  };

  const handleSendResultsEmail = async () => {
    try {
      const result = await sendResultsEmail(request?.id as string, `${window.location.origin}/results/`);
      notification.success({
        message: 'Email Sent',
        description: result || 'Results have been sent to the user successfully!',
      });
    } catch (error) {
      notification.error({
        message: 'Failed to Send Email',
        description: error || 'There was an issue sending the results email.',
      });
    }
  };  
  const handleDownload = () => {
    try {
      if (request?.geoJson == null) {
        notification.error({
          message: 'Download Failed',
          description: 'GeoJSON content not present in the request',
        });
        return;
      }
      const blob = new Blob([request.geoJson], { type: 'application/json' });
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
  };

  const jobColumns = [
    {
      title: "JobID",
      dataIndex: "id",
      key: 'id',
      render: (id: string) => <Text strong>{id}</Text>,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: Job) => (
        <Space>
          <Button
            type="primary"
            disabled={record.status === 'PENDING'}
            onClick={() => {
              const newUrl = `${window.location.origin}/results/${request?.id}/job/${record.id}`;
              router.push(newUrl);
            }}
          >
            View Results
          </Button>
          <Button
            type={record.finalized ? 'default' : 'primary'}
            icon={<CheckCircleOutlined />}
            disabled={finalizedJobId !== null && finalizedJobId !== record.id && !record.finalized}
            onClick={() => {
              try {
                handleFinalizeJob(request?.id, parseInt(record.id), record.finalized);
              } catch (error: any) {
                notification.error({
                  message: 'Finalize Job operation failed',
                  description: error.message || 'Operation failed. Please try again.',
                });
              }
            }}
          >
            {record.finalized ? 'Reset' : 'Finalize'}
          </Button>
          <Popconfirm
            title="Delete Job"
            description="Are you sure you want to delete this job?"
            onConfirm={() => {
              try {
                handleDeleteJob(request?.id, parseInt(record.id));
              } catch (e) {
                console.log(e);
                notification.error({
                  message: 'Delete Job operation failed',
                  description: 'Operation failed. Please try again.',
                });
              }
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

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

        <Card title="Jobs">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button type="primary" onClick={handleSubmitJob}>
              Submit New Job
            </Button>

            {/* Add the Send Email button here */}
            <Button type="default" onClick={handleSendResultsEmail}>
              Send Results via Email
            </Button>

            <Table
              dataSource={request.jobs}
              columns={jobColumns}
              rowKey="id"
            />
          </Space>
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
      </Space>
    </div>
  );
};

export default RequestDetailsPage;
