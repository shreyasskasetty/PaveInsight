'use client'
import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Input, Popconfirm, Form } from 'antd';
import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getRequests, deleteRequest, updateRequestStatus } from '@/lib/api/request-api';
import { notification } from 'antd';
import { getRequestStatusString } from '@/lib/utils/requests';

interface Request {
  id: string;
  userId: string;
  username: string;
  email: string;
  geoJson: string;
  jobStatus: 'In Progress' | 'Completed' | 'Pending';
  requestStatus: 'In Progress' | 'Completed' | 'Pending';
  fileUrl: string;
}

const { Option } = Select;

const RequestsPage: React.FC = () => {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState<Request[]>([]);
  const [form] = Form.useForm();

  const fetchRequests = async () => {
    try {
      const data = await getRequests();
      console.log(data);
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  useEffect(() => {
    fetchRequests(); // Call fetchRequests when the component mounts
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteRequest(id); // Wait for the delete request to complete
      fetchRequests(); // Re-fetch the requests from the backend
    } catch (error) {
      console.error('Failed to delete request:', error);
      notification.error({
        message: 'Delete Failed',
        description: 'There was an error deleting the request.',
      });
    }
  };

  const handleStatusChange = async (value: string, record: Request) => {
    try {
      await updateRequestStatus(record.id, value.toUpperCase()); // Make an API call to update the status
      fetchRequests();
      const updatedRequests = requests.map(req =>
        req.id === record.id ? { ...req, requestStatus: value as Request['requestStatus'] } : req
      );
      setRequests(updatedRequests);
    } catch (error) {
      console.error('Failed to update request status:', error);
      notification.error({
        message: 'Update Failed',
        description: 'There was an error updating the request status.',
      });
    }
  };

  const handleRowClick = (record: Request) => {
    router.push(`/admin/dashboard/requests/${record.id}`);
  };

  const columns = [
    {
      title: 'User ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email ID',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Process Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: string, record: Request) => {
        const displayStatus = text === 'PENDING' ? 'Pending' : 
        text === 'IN PROGRESS' ? 'In Progress' : 
        text === 'COMPLETED' ? 'Completed' : text; // Convert status to user-friendly format
        return (
        <Form.Item
          name={['requestStatus', record.id]}
          initialValue={displayStatus}
          style={{ margin: 0 }}
          onClick={(e: any) => e.stopPropagation()}
        >
          <Select
            style={{ width: 120 }}
            onChange={(value) => handleStatusChange(value, record)}
            onClick={(e) => e.stopPropagation()}
          >
            <Option value="In Progress">In Progress</Option>
            <Option value="Completed">Completed</Option>
            <Option value="Pending">Pending</Option>
          </Select>
        </Form.Item>
      )
    },
    },
    {
      title: 'Analysis Status',
      dataIndex: 'jobStatus',
      key: 'jobStatus',
      render: (text: string) => text || 'Not Submitted',
    },
    {
      title: 'Download',
      key: 'download',
      render: (text: string, record: Request) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          />
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: Request) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Popconfirm
            title="Are you sure you want to delete this request?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </span>
      ),
    },
  ];

  const handleDownload = async (record: Request) => {
    const geoJsonData = record?.geoJson; // Assuming fileUrl contains the GeoJSON string

    // notification.info({
    //   message: 'Download Started',
    //   description: 'Your GeoJSON file is being downloaded.',
    // });

    try {
      // Create a Blob from the GeoJSON string
      const blob = new Blob([geoJsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.geojson';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // notification.success({
      //   message: 'Download Complete',
      //   description: 'Your GeoJSON file has been downloaded successfully.',
      // });
    } catch (error) {
      notification.error({
        message: 'Download Failed',
        description: 'There was an error downloading your file.',
      });
      console.error('Download error:', error);
    }
  };

  const filteredRequests = requests.filter((request: any) => {
    const matchesFilter =
      filter === 'All' || getRequestStatusString(request.status) === filter;
    const matchesSearch =
      request.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="requests-page">
      <h1>Requests</h1>
      <div className="filters">
        <Select
          defaultValue="All"
          style={{ width: 120, marginRight: 16 }}
          onChange={(value) => setFilter(value)}
        >
          <Option value="All">All</Option>
          <Option value="In Progress">In Progress</Option>
          <Option value="Completed">Completed</Option>
          <Option value="Pending">Pending</Option>
        </Select>
        <Input
          placeholder="Search by username or email"
          style={{ width: 250 }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Form form={form} component={false}>
        <Table
          columns={columns}
          dataSource={filteredRequests}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Form>
    </div>
  );
};

export default RequestsPage;
