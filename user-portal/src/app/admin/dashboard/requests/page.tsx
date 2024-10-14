'use client'
import React, { useState } from 'react';
import { Table, Button, Select, Input, Popconfirm, Form } from 'antd';
import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface Request {
  id: string;
  userId: string;
  username: string;
  email: string;
  jobStatus: 'In Progress' | 'Completed' | 'Pending';
  requestStatus: 'In Progress' | 'Completed' | 'Pending';
  fileUrl: string;
}

const { Option } = Select;

const RequestsPage: React.FC = () => {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState<Request[]>([
    {
      id: '1',
      userId: 'U001',
      username: 'john_doe',
      email: 'john.doe@example.com',
      jobStatus: 'In Progress',
      requestStatus: 'In Progress',
      fileUrl: 'https://example.com/files/john_doe_request1.kml',
    },
    {
      id: '2',
      userId: 'U002',
      username: 'jane_smith',
      email: 'jane.smith@example.com',
      jobStatus: 'Completed',
      requestStatus: 'Completed',
      fileUrl: 'https://example.com/files/jane_smith_request1.geojson',
    },
    {
      id: '3',
      userId: 'U003',
      username: 'bob_johnson',
      email: 'bob.johnson@example.com',
      jobStatus: 'Pending',
      requestStatus: 'Pending',
      fileUrl: 'https://example.com/files/bob_johnson_request1.kml',
    },
    {
      id: '4',
      userId: 'U004',
      username: 'alice_williams',
      email: 'alice.williams@example.com',
      jobStatus: 'In Progress',
      requestStatus: 'In Progress',
      fileUrl: 'https://example.com/files/alice_williams_request1.geojson',
    },
    {
      id: '5',
      userId: 'U005',
      username: 'charlie_brown',
      email: 'charlie.brown@example.com',
      jobStatus: 'Completed',
      requestStatus: 'Completed',
      fileUrl: 'https://example.com/files/charlie_brown_request1.kml',
    },
  ]);

  const [form] = Form.useForm();

  const handleDelete = (id: string) => {
    setRequests(requests.filter(request => request.id !== id));
  };

  const handleStatusChange = (value: string, record: Request) => {
    const updatedRequests = requests.map(req =>
      req.id === record.id ? { ...req, requestStatus: value as Request['requestStatus'] } : req
    );
    setRequests(updatedRequests);
  };

  const handleRowClick = (record: Request) => {
    router.push(`/admin/dashboard/requests/${record.id}`);
  };

  const columns = [
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
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
      dataIndex: 'jobStatus',
      key: 'jobStatus',
    },
    {
      title: 'Analysis Status',
      dataIndex: 'requestStatus',
      key: 'requestStatus',
      render: (text: string, record: Request) => (
        <Form.Item
          name={['requestStatus', record.id]}
          initialValue={text}
          style={{ margin: 0 }}
          onClick={(e) => e.stopPropagation()}
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
      ),
    },
    {
      title: 'Download',
      key: 'download',
      render: (text: string, record: Request) => (
        <Button
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(record.fileUrl)}
        />
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

  const handleDownload = (fileUrl: string) => {
    // Implement download logic here
    console.log(`Downloading file from ${fileUrl}`);
  };

  const filteredRequests = requests.filter((request) => {
    const matchesFilter =
      filter === 'All' || request.requestStatus === filter;
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
