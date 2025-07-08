import { useState } from 'react';
import {
  Layout,
  Card,
  List,
  Modal,
  Button,
  Input,
  Pagination,
  Avatar,
  Badge,
  Space,
  Divider,
  Typography,
  theme,
  ConfigProvider,
  message,
  Dropdown,
  Menu,
  Select,
  Tooltip,
  Alert
} from 'antd';
import {
  MailOutlined,
  UserOutlined,
  BulbOutlined,
  BulbFilled,
  ClockCircleOutlined,
  LogoutOutlined,
  SettingOutlined,
  EyeOutlined,
  ReloadOutlined,
  CopyOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import logo from './assets/logo.png';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const DOMAIN_OPTIONS = [
  '@nguyenmail.pro',
  '@cuvox.de',
  '@dayrep.com'
];

function randomUser() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8 + Math.floor(Math.random() * 4); i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function App() {
  const [isDark, setIsDark] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [domain, setDomain] = useState(DOMAIN_OPTIONS[0]);
  const [mails, setMails] = useState<any[]>([]);
  const [selectedMail, setSelectedMail] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState('john.doe@brosup.com');
  const mailsPerPage = 5;
  const [apiError, setApiError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const [checkingType, setCheckingType] = useState<'info' | 'error' | null>(null);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.body.style.backgroundColor = isDark ? '#1a1a1a' : '#ffffff';
    document.body.style.color = isDark ? '#e0e0e0' : '#000000';
  };

  const handleUserSubmit = async () => {
    setApiError(null);
    if (userInput.trim()) {
      setLoading(true);
      setCheckingStatus('Checking or creating email...');
      setCheckingType('info');
      const email = `${userInput}`;
      const status = await checkOrCreateUser(email);
      if (status === 'error') {
        setCheckingStatus('Error while creating/checking email!');
        setCheckingType('error');
        setLoading(false);
        return;
      }
      const data = await fetchEmails(userInput, 1, mailsPerPage);
      setMails(data.emails);
      setCurrentPage(1);
      setLoading(false);
      if (status === 'created') {
        setCheckingStatus('Email created successfully. Loaded inbox!');
        setCheckingType('info');
      } else if (status === 'exists') {
        setCheckingStatus('Email already exists. Loaded inbox!');
        setCheckingType('info');
      }
      setTimeout(() => setCheckingStatus(null), 2000);
    }
  };

  const openMail = (mail: any) => {
    setApiError(null);
    setSelectedMail(mail);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    message.success('Logged out successfully');
  };

  const handleGenerate = () => {
    setUserInput(randomUser());
  };

  const handleCopy = () => {
    const email = `${userInput}${domain}`;
    navigator.clipboard.writeText(email);
    message.success('Copied: ' + email);
  };

  const handleRefresh = async () => {
    setApiError(null);
    setLoading(true);
    const data = await fetchEmails(userInput, currentPage, mailsPerPage);
    setMails(data.emails);
    setLoading(false);
    message.success('Mailbox refreshed');
  };

  const handlePageChange = async (page: number) => {
    setApiError(null);
    setLoading(true);
    const data = await fetchEmails(userInput, page, mailsPerPage);
    setMails(data.emails);
    setCurrentPage(page);
    setLoading(false);
  };

  const totalPages = Math.ceil(mails.length / mailsPerPage);
  const startIndex = (currentPage - 1) * mailsPerPage;
  const currentMails = mails.slice(startIndex, startIndex + mailsPerPage);

  const unreadCount = mails.filter(m => !m.isRead).length;

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  // Hàm lấy danh sách mail
  const fetchEmails = async (user: string, page: number, limit: number) => {
    try {
      const res = await fetch(`https://stalwart-backend.onrender.com/emails?user=${user}&page=${page}&limit=${limit}`);
      const data = await res.json();
      if (Array.isArray(data.emails)) {
        return data;
      } else {
        setApiError('Invalid response');
        return { emails: [], page, limit };
      }
    } catch (err) {
      setApiError('Network error');
      return { emails: [], page, limit };
    }
  };

  // Hàm gọi API tạo/check user (KHÔNG truyền token)
  const checkOrCreateUser = async (email: string) => {
    try {
      const res = await fetch('https://stalwart-backend.onrender.com/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.status === 'exists') return 'exists';
      if (data.status === 'created') return 'created';
      setApiError(data.detail || 'Unknown error');
      return 'error';
    } catch (err) {
      setApiError('Network error');
      return 'error';
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#ef4444',
          colorError: '#ef4444',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: isDark ? '#1a1a1a' : '#ffffff' }}>
        <Header style={{ padding: '0 24px', background: isDark ? '#262626' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)', borderBottom: isDark ? '1px solid #404040' : '1px solid #f0f0f0' }}>
          <Space>
            <img src={logo} alt="Logo" className="app-logo" />
            <Title level={3} style={{ margin: 0, color: '#ef4444' }}>
              Brosup Digital Mail
            </Title>
          </Space>
          <Space>
            <Button type="text" icon={isDark ? <BulbFilled style={{ color: '#ef4444' }} /> : <BulbOutlined style={{ color: '#ef4444' }} />} onClick={toggleTheme} size="large" style={{ color: '#ef4444' }} />
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Button type="text" style={{ display: 'flex', alignItems: 'center', color: isDark ? '#e0e0e0' : '#000000' }}>
                <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <Text style={{ color: isDark ? '#e0e0e0' : '#000000' }}>{currentUser}</Text>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: '24px', background: isDark ? '#1a1a1a' : '#ffffff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* User Input */}
            <Card style={{ marginBottom: 24, background: isDark ? '#262626' : '#ffffff', border: isDark ? '1px solid #404040' : '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
                <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
                  <Input
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    placeholder="Username"
                    size="large"
                    allowClear
                    style={{
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      borderRight: 'none',
                      border: '1px solid #d9d9d9',
                      minWidth: 0,
                      flex: 2
                    }}
                  />
                  <Select
                    value={domain}
                    onChange={setDomain}
                    size="large"
                    style={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderLeft: 'none',
                      border: '1px solid #d9d9d9',
                      minWidth: 120,
                      flex: 1
                    }}
                    options={DOMAIN_OPTIONS.map(d => ({ value: d, label: d }))}
                    suffixIcon={null}
                    dropdownStyle={{ minWidth: 120 }}
                  />
                </div>
                <Tooltip title="Copy email address">
                  <Button icon={<CopyOutlined />} onClick={handleCopy} size="large" style={{ color: '#ef4444', padding: '0 10px', marginRight: 4 }} />
                </Tooltip>
                <Tooltip title="Refresh mailbox">
                  <Button icon={<ReloadOutlined />} onClick={handleRefresh} size="large" loading={loading} style={{ color: '#ef4444', padding: '0 10px', marginRight: 8 }} />
                </Tooltip>
                <Button
                  icon={<ThunderboltOutlined />}
                  onClick={handleGenerate}
                  size="large"
                  style={{ color: '#ef4444', padding: '0 16px', marginRight: 8, borderRadius: 6 }}
                >
                  Generate
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleUserSubmit}
                  loading={loading}
                  style={{ background: '#ef4444', borderColor: '#ef4444', padding: '0 18px', borderRadius: 6 }}
                >
                  Load Emails
                </Button>
              </div>
            </Card>

            {checkingStatus && (
              <Typography.Text style={{ color: '#ef4444', fontWeight: 600, marginBottom: 12, display: 'block' }}>
                {checkingStatus}
              </Typography.Text>
            )}

            {/* Mail List */}
            <Card
              title={
                <Space>
                  <MailOutlined style={{ color: '#ef4444' }} />
                  <span style={{ color: isDark ? '#e0e0e0' : '#000000' }}>Inbox</span>
                  {unreadCount > 0 && (
                    <Badge count={unreadCount} style={{ backgroundColor: '#ef4444' }} />
                  )}
                </Space>
              }
              extra={
                <Text type="secondary" style={{ color: isDark ? '#a0a0a0' : '#666666' }}>
                  {mails.length} emails
                </Text>
              }
              style={{
                background: isDark ? '#262626' : '#ffffff',
                border: isDark ? '1px solid #404040' : '1px solid #f0f0f0'
              }}
            >
              <List
                dataSource={currentMails}
                renderItem={(mail) => (
                  <List.Item
                    className={`mail-item ${!mail.isRead ? 'unread' : ''}`}
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderRadius: borderRadiusLG,
                      marginBottom: 8,
                      background: isDark ? '#262626' : '#ffffff',
                      border: isDark ? '1px solid #404040' : '1px solid #f0f0f0'
                    }}
                    onClick={() => openMail(mail)}
                    actions={[
                      <Button
                        key="view"
                        type="text"
                        icon={<EyeOutlined style={{ color: '#ef4444' }} />}
                        onClick={e => { e.stopPropagation(); openMail(mail); }}
                        style={{ color: '#ef4444' }}
                      >
                        View
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<UserOutlined />}
                          style={{ backgroundColor: !mail.isRead ? '#ef4444' : '#1890ff' }}
                        />
                      }
                      title={
                        <Space>
                          <Text strong={!mail.isRead} style={{ fontSize: 16, color: isDark ? '#e0e0e0' : '#000000' }}>
                            {mail.from_name} &lt;{mail.from_email}&gt;
                          </Text>
                          {!mail.isRead && (
                            <Badge dot style={{ backgroundColor: '#ef4444' }} />
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 4 }}>
                            <Text strong={!mail.isRead} style={{ color: isDark ? '#e0e0e0' : '#000000' }}>
                              {mail.subject}
                            </Text>
                          </div>
                          <Text type="secondary" style={{ fontSize: 14, color: isDark ? '#a0a0a0' : '#666666' }}>
                            {mail.body && mail.body.length > 80 ? mail.body.slice(0, 80) + '...' : mail.body}
                          </Text>
                          <div style={{ marginTop: 4 }}>
                            <Space size="small">
                              <ClockCircleOutlined style={{ color: isDark ? '#a0a0a0' : '#999' }} />
                              <Text type="secondary" style={{ fontSize: 12, color: isDark ? '#a0a0a0' : '#666666' }}>
                                {mail.date ? new Date(mail.date).toLocaleString('vi-VN', { hour12: false }) : ''}
                              </Text>
                            </Space>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Pagination
                    current={currentPage}
                    total={mails.length}
                    pageSize={mailsPerPage}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total, range) =>
                      `${range[0]}-${range[1]} of ${total} items`
                    }
                  />
                </div>
              )}
            </Card>
          </div>
        </Content>

        {/* Footer */}
        <Footer style={{ 
          textAlign: 'center', 
          background: isDark ? '#1a1a1a' : '#ffffff',
          borderTop: isDark ? '1px solid #404040' : '1px solid #f0f0f0',
          color: isDark ? '#a0a0a0' : '#666666'
        }}>
          <Space direction="vertical" size="small">
            <Text type="secondary" style={{ color: isDark ? '#a0a0a0' : '#666666' }}>
              Brosup Digital Mail ©2025 Created by BROSUP DIGITAL CO.,LTD
            </Text>
            <Space size="large">
              <Text type="secondary" style={{ fontSize: 12, color: isDark ? '#a0a0a0' : '#666666' }}>
                Privacy Policy
              </Text>
              <Text type="secondary" style={{ fontSize: 12, color: isDark ? '#a0a0a0' : '#666666' }}>
                Terms of Service
              </Text>
              <Text type="secondary" style={{ fontSize: 12, color: isDark ? '#a0a0a0' : '#666666' }}>
                Contact Support
              </Text>
            </Space>
          </Space>
        </Footer>

        {/* Mail Detail Modal - Optimized */}
        <Modal
          title={
            <Space>
              <MailOutlined style={{ color: '#ef4444' }} />
              <span style={{ color: isDark ? '#e0e0e0' : '#000000' }}>Email Details</span>
            </Space>
          }
          open={isModalOpen}
          onCancel={handleModalCancel}
          width={800}
          footer={[
            <Button key="close" onClick={handleModalCancel} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
              Close
            </Button>
          ]}
          className="mail-dialog"
          destroyOnClose={true}
          maskClosable={true}
          closable={true}
          centered={true}
        >
          {selectedMail && (
            <div style={{ color: isDark ? '#e0e0e0' : '#000000' }}>
              <div style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ color: isDark ? '#e0e0e0' : '#000000' }}>From:</Text>
                    <Text style={{ marginLeft: 8, color: isDark ? '#e0e0e0' : '#000000' }}>
                      {selectedMail.from_name} &lt;{selectedMail.from_email}&gt;
                    </Text>
                  </div>
                  <div>
                    <Text strong style={{ color: isDark ? '#e0e0e0' : '#000000' }}>Subject:</Text>
                    <Text style={{ marginLeft: 8, color: isDark ? '#e0e0e0' : '#000000' }}>{selectedMail.subject}</Text>
                  </div>
                  <div>
                    <Text strong style={{ color: isDark ? '#e0e0e0' : '#000000' }}>Date:</Text>
                    <Text style={{ marginLeft: 8, color: isDark ? '#e0e0e0' : '#000000' }}>
                      {selectedMail.date ? new Date(selectedMail.date).toLocaleString('vi-VN', { hour12: false }) : ''}
                    </Text>
                  </div>
                </Space>
              </div>
              <Divider style={{ borderColor: isDark ? '#404040' : '#f0f0f0' }} />
      <div>
                <Paragraph style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: 14,
                  color: isDark ? '#e0e0e0' : '#000000'
                }}>
                  {selectedMail.body}
                </Paragraph>
      </div>
      </div>
          )}
        </Modal>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
