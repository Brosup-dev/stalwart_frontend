import { useState, useEffect } from "react";
import { faker } from "@faker-js/faker";
import DOMPurify from "dompurify";
import {
  Layout,
  Card,
  List,
  Modal,
  Button,
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
  Select,
  Tooltip,
  AutoComplete,
} from "antd";
import {
  MailOutlined,
  UserOutlined,
  BulbOutlined,
  BulbFilled,
  ClockCircleOutlined,
  LogoutOutlined,
  EyeOutlined,
  ReloadOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  DownOutlined,
  HistoryOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import axios from "axios";
import logo from "./assets/logo.png";
import LoginPage from "./LoginPage";
import Link from "antd/es/typography/Link";

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
// const { Search } = Input;

const DOMAIN_OPTIONS = [
  "@nguyenmail.pro",
  "@brosup.dev",
  "@juboro.com",
  "@lurvon.com",
];

// Session management constants
const SESSION_KEY = "brosup_session";
const INPUT_HISTORY_KEY = "input_history";
const THEME_KEY = "theme_mode";

// Session helper functions
const getSession = () => {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;

  const session = JSON.parse(sessionStr);
  if (Date.now() > session.expiresAt) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return session;
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

// Input history helper functions
const getInputHistory = (): string[] => {
  const history = localStorage.getItem(INPUT_HISTORY_KEY);
  return history ? JSON.parse(history) : [];
};

const saveInputHistory = (input: string) => {
  if (!input.trim()) return;

  const history = getInputHistory();
  const filteredHistory = history.filter((item) => item !== input);
  const newHistory = [input, ...filteredHistory].slice(0, 10);
  localStorage.setItem(INPUT_HISTORY_KEY, JSON.stringify(newHistory));
};

// const clearInputHistory = () => {
//   localStorage.removeItem(INPUT_HISTORY_KEY);
// };

// Theme helper functions
const getThemeMode = (): boolean => {
  const theme = localStorage.getItem(THEME_KEY);
  return theme === "dark";
};

const saveThemeMode = (isDark: boolean) => {
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
};

// function randomUser() {
//   const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
//   let result = '';
//   for (let i = 0; i < Math.floor(Math.random() * (20 - 5 + 1)) + 7; i++) {
//     result += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return result;
// }

function randomUser() {
  const first = faker.person.firstName().toLowerCase();
  const last = faker.person.lastName().toLowerCase();
  const rand = faker.string.alphanumeric(2).toLowerCase();
  const year = faker.number.int({ min: 1980, max: 2022 });
  const day =  faker.number.int({ min: 1, max: 30 });
  const month =  faker.number.int({ min: 1, max: 12 });
  const separators = ["", ".", "_", "-", ""];

  const separator = faker.helpers.arrayElement(separators);
  const choice = faker.number.int({ min: 1, max: 6 });

  switch (choice) {
    case 1:
      return `${first}${separator}${last}`;
    case 2:
      return `${first}${separator}${faker.number.int({ min: 10, max: 9999 })}`;
    case 3:
      return `${first}${separator}${last}${faker.number.int({
        min: 1,
        max: 99,
      })}`;
    case 4:
      return `${first}${separator}${last}${separator}${year}`; //
    case 5:
      return `${first}${separator}${rand}${separator}${last}`;
    case 6:
      return `${first}${last}${day}${month}`;
    default:
      return `${first}${last}${year}`;
  }
}

function App() {
  const [isDark, setIsDark] = useState(getThemeMode());
  const [userInput, setUserInput] = useState("");
  const [domain, setDomain] = useState(DOMAIN_OPTIONS[0]);
  const [mails, setMails] = useState<any[]>([]);
  const [selectedMail, setSelectedMail] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const mailsPerPage = 5;
  const borderRadiusLG = 8;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<{
    fullName: string;
    expiryDate: string;
  } | null>(null);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasLoadedMails, setHasLoadedMails] = useState(false);
  const [autoRefreshStartTime, setAutoRefreshStartTime] = useState<
    number | null
  >(null);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUserData(session.userData);
      setIsLoggedIn(true);
    }
  }, []);

  // Load input history on component mount
  useEffect(() => {
    setInputHistory(getInputHistory());
  }, []);

  // Apply theme on mount
  useEffect(() => {
    document.body.style.backgroundColor = isDark ? "#1a1a1a" : "#ffffff";
    document.body.style.color = isDark ? "#e0e0e0" : "#000000";
  }, [isDark]);

  // Countdown effect
  useEffect(() => {
    let countdownInterval: number;

    if (countdown > 0 && autoRefresh && !loading) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          // Check if auto-refresh has been running for 1 minute
          if (
            autoRefreshStartTime &&
            Date.now() - autoRefreshStartTime >= 60000
          ) {
            setAutoRefresh(false);
            setAutoRefreshStartTime(null);
            message.info("Auto-refresh stopped after 1 minute");
            return 0;
          }

          if (prev <= 1) {
            // Countdown finished, trigger refresh
            handleRefresh();
            return 0; // Stop countdown, will restart after fetch completes
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdown, autoRefresh, loading, autoRefreshStartTime]);

  useEffect(() => {
    if (isLoggedIn && userData) {
      const session = getSession();
      if (!session) {
        handleLogout();
        return;
      }

      const timeLeft = session.expiresAt - Date.now();
      const logoutTimer = setTimeout(() => {
        message.warning("Session expired. Please login again.");
        handleLogout();
      }, timeLeft);

      return () => clearTimeout(logoutTimer);
    }
  }, [isLoggedIn, userData]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.body.style.backgroundColor = newIsDark ? "#1a1a1a" : "#ffffff";
    document.body.style.color = newIsDark ? "#e0e0e0" : "#000000";
    saveThemeMode(newIsDark);
  };

  const saveToHistory = (user: string) => {
    if (user) {
      saveInputHistory(user);
      setInputHistory(getInputHistory());
    }
  };

  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      // Disable auto-refresh
      setAutoRefresh(false);
      setCountdown(0);
      setAutoRefreshStartTime(null);
      message.info("Auto-refresh disabled");
    } else {
      // Enable auto-refresh
      setAutoRefresh(true);
      setCountdown(10);
      setAutoRefreshStartTime(Date.now());
      message.success(
        "Auto-refresh enabled (10s interval, will stop after 1 minute)"
      );
    }
  };

  const handleUserSubmit = async () => {
    const user = userInput.toLowerCase().trim();
    if (user && !loading) {
      console.log(user);
      setLoading(true);
      setCheckingStatus("Checking or creating email...");
      const email = `${user}${domain}`;
      const status = await checkOrCreateUser(email);
      if (status === "error") {
        setCheckingStatus("Error while creating/checking email!");
        setLoading(false);
        // Save to input history even when there's an error
        saveToHistory(userInput);
        return;
      }
      const data = await fetchEmails(email, 1, mailsPerPage);
      setMails(data.emails);
      setCurrentPage(1);
      setLoading(false);
      setHasLoadedMails(true); // Mark as successfully loaded
      if (status === "created") {
        setCheckingStatus("Email created successfully. Loaded inbox!");
      } else if (status === "exists") {
        setCheckingStatus("Email already exists. Loaded inbox!");
      }
      setTimeout(() => setCheckingStatus(null), 5000);

      // Auto-enable auto-refresh after successful load
      setAutoRefresh(true);
      setCountdown(10);
      setAutoRefreshStartTime(Date.now());
      message.success(
        "Auto-refresh enabled (10s interval, will stop after 1 minute)"
      );

      // Save to input history when successful
      saveToHistory(userInput);
    }
  };

  const openMail = (mail: any) => {
    setSelectedMail(mail);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    setUserData(null);
    message.success("Logged out successfully");
  };

  const handleGenerate = () => {
    setUserInput(randomUser());
    // Disable auto-refresh when generating new username
    if (autoRefresh) {
      setAutoRefresh(false);
      setCountdown(0);
      setAutoRefreshStartTime(null);
      message.info("Auto-refresh disabled due to username change");
    }
  };

  const handleCopy = () => {
    const user = userInput.toLowerCase().trim();
    const email = `${user}${domain}`;
    navigator.clipboard.writeText(email);
    message.success("Copied: " + email);
  };

  const handleRefresh = async () => {
    if (loading) return;

    setLoading(true);
    const user = userInput.toLowerCase().trim();
    const email = `${user}${domain}`;
    const data = await fetchEmails(email, currentPage, mailsPerPage);
    setMails(data.emails);
    setLoading(false);
    setHasLoadedMails(true); // Mark as successfully loaded
    message.success("Mailbox refreshed");

    // Start countdown after successful refresh if auto-refresh is enabled
    if (autoRefresh) {
      // Use setTimeout to ensure this runs after the current execution cycle
      setTimeout(() => {
        setCountdown(10);
      }, 0);
    }

    // Save to input history
    saveToHistory(userInput);
  };

  const handlePageChange = async (page: number) => {
    if (loading) return;

    setLoading(true);
    const user = userInput.toLowerCase().trim();
    const email = `${user}${domain}`;
    const data = await fetchEmails(email, page, mailsPerPage);
    setMails(data.emails);
    setCurrentPage(page);
    setLoading(false);
  };

  const totalPages = Math.ceil(mails.length / mailsPerPage);
  const startIndex = (currentPage - 1) * mailsPerPage;
  const currentMails = mails.slice(startIndex, startIndex + mailsPerPage);

  const unreadCount = mails.filter((m) => !m.isRead).length;

  const userMenu = {
    items: [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Logout",
        onClick: handleLogout,
      },
    ],
  };

  const fetchEmails = async (user: string, page: number, limit: number) => {
    try {
      const res = await axios.get(
        `https://stalwart-backend.onrender.com/emails?user=${user}&page=${page}&limit=${limit}`
      );
      const data = await res.data;
      if (Array.isArray(data.emails)) {
        return data;
      } else {
        return { emails: [], page, limit };
      }
    } catch (err) {
      return { emails: [], page, limit };
    }
  };

  const checkOrCreateUser = async (email: string) => {
    try {
      const res = await axios.post(
        "https://stalwart-backend.onrender.com/create-user",
        { email }
      );
      const data = await res.data;
      if (data.status === "exists") return "exists";
      if (data.status === "created") return "created";
      return "error";
    } catch (err) {
      return "error";
    }
  };

  const handleLogin = (userData: { fullName: string; expiryDate: string }) => {
    setUserData(userData);
    setIsLoggedIn(true);
  };

  const isHTML = (str: string) => {
    if (!str || typeof str !== "string") return false;

    return /<([a-z]+)(\s[^>]*)?>|<!DOCTYPE|<html[\s>]/i.test(str);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#ef4444",
          colorError: "#ef4444",
          borderRadius: borderRadiusLG,
        },
      }}
    >
      <Layout
        style={{
          minHeight: "100vh",
          background: isDark ? "#1a1a1a" : "#ffffff",
        }}
      >
        <Header
          style={{
            padding: "0 16px",
            background: isDark ? "#262626" : "#fafafa",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: isDark
              ? "0 2px 8px rgba(0,0,0,0.3)"
              : "0 2px 8px rgba(0,0,0,0.06)",
            borderBottom: isDark ? "1px solid #404040" : "1px solid #d9d9d9",
          }}
        >
          <Link href="/">
            <Space>
              <img
                src={logo}
                alt="Logo"
                className="app-logo"
                style={{ height: "42px", width: "42px" }}
              />
              <Title
                level={2}
                style={{ margin: 0, color: "#ef4444", fontSize: "18px" }}
              >
                Brosup Digital Mailbox
              </Title>
            </Space>
          </Link>
          <Space>
            <Button
              type="text"
              icon={
                isDark ? (
                  <BulbFilled style={{ color: "#ef4444" }} />
                ) : (
                  <BulbOutlined style={{ color: "#ef4444" }} />
                )
              }
              onClick={toggleTheme}
              size="large"
              style={{ color: "#ef4444" }}
            />
            <Space style={{ alignItems: "center" }}>
              <Avatar
                src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${
                  userData?.fullName || "User"
                }`}
                style={{ borderRadius: "50%", border: "1px solid #d9d9d9" }}
                size={36}
              />
              <Dropdown menu={userMenu} placement="bottomRight">
                <Button
                  type="text"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: isDark ? "#e0e0e0" : "#000000",
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? "#e0e0e0" : "#000000",
                      fontSize: "14px",
                    }}
                  >
                    {userData?.fullName || "User"}
                  </Text>
                  {<DownOutlined />}
                </Button>
              </Dropdown>
            </Space>
          </Space>
        </Header>

        <Content
          style={{
            padding: "16px",
            background: isDark ? "#1a1a1a" : "#fefefe",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* User Input */}
            <Card
              style={{
                marginBottom: 16,
                background: isDark ? "#262626" : "#fafafa",
                border: isDark ? "1px solid #404040" : "1px solid #d9d9d9",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flex: 1,
                      minWidth: 200,
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <AutoComplete
                      value={userInput}
                      onChange={setUserInput}
                      placeholder="Username"
                      size="large"
                      allowClear
                      style={{
                        flex: 2,
                        minWidth: 120,
                      }}
                      options={
                        inputHistory.length > 0
                          ? inputHistory.map((item) => ({
                              value: item,
                              label: (
                                <Space>
                                  <HistoryOutlined
                                    style={{
                                      color: "#ef4444",
                                      fontSize: "12px",
                                    }}
                                  />
                                  <span>{item}</span>
                                </Space>
                              ),
                            }))
                          : []
                      }
                      onSelect={(value) => setUserInput(value)}
                    />
                    <Select
                      value={domain}
                      onChange={setDomain}
                      size="large"
                      style={{
                        minWidth: 120,
                        flex: 1,
                      }}
                      options={DOMAIN_OPTIONS.map((d) => ({
                        value: d,
                        label: d,
                      }))}
                      styles={{ popup: { root: { minWidth: 120 } } }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <Tooltip title="Copy email address">
                      <Button
                        icon={<CopyOutlined />}
                        onClick={handleCopy}
                        size="large"
                        style={{ color: "#ef4444", padding: "0 8px" }}
                      />
                    </Tooltip>
                    <Tooltip title="Refresh mailbox">
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={handleRefresh}
                        size="large"
                        loading={loading}
                        disabled={!userInput.trim() || loading}
                        style={{ color: "#ef4444", padding: "0 8px" }}
                      />
                    </Tooltip>
                    <Button
                      icon={<ThunderboltOutlined />}
                      onClick={handleGenerate}
                      size="large"
                      disabled={loading}
                      style={{
                        color: "#ef4444",
                        padding: "0 12px",
                        borderRadius: 6,
                      }}
                    >
                      Generate
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleUserSubmit}
                      loading={loading}
                      disabled={!userInput.trim() || loading}
                      style={{
                        background: "#ef4444",
                        borderColor: "#ef4444",
                        padding: "0 16px",
                        borderRadius: 6,
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        const button = e.currentTarget as HTMLButtonElement;
                        if (!button.disabled) {
                          button.style.background = "#dc2626";
                          button.style.borderColor = "#dc2626";
                          button.style.transform = "translateY(-1px)";
                          button.style.boxShadow =
                            "0 4px 12px rgba(239, 68, 68, 0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const button = e.currentTarget as HTMLButtonElement;
                        if (!button.disabled) {
                          button.style.background = "#ef4444";
                          button.style.borderColor = "#ef4444";
                          button.style.transform = "translateY(0)";
                          button.style.boxShadow = "none";
                        }
                      }}
                    >
                      Load Mail
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {checkingStatus && (
              <Typography.Text
                style={{
                  color: "#ef4444",
                  fontWeight: 600,
                  marginBottom: 12,
                  display: "block",
                }}
              >
                {checkingStatus}
              </Typography.Text>
            )}

            {/* Mail List */}
            <Card
              title={
                <Space>
                  <MailOutlined style={{ color: "#ef4444" }} />
                  <span style={{ color: isDark ? "#e0e0e0" : "#000000" }}>
                    Inbox
                  </span>
                  {unreadCount > 0 && (
                    <Badge
                      count={unreadCount}
                      style={{ backgroundColor: "#ef4444" }}
                    />
                  )}
                </Space>
              }
              extra={
                <Space>
                  <Tooltip
                    title={
                      autoRefresh
                        ? "Click to disable auto-refresh"
                        : "Auto-refresh is disabled"
                    }
                  >
                    <Button
                      icon={
                        autoRefresh ? <SyncOutlined spin /> : <SyncOutlined />
                      }
                      onClick={toggleAutoRefresh}
                      size="small"
                      disabled={!hasLoadedMails}
                      type={autoRefresh ? "primary" : "default"}
                      style={{
                        color: autoRefresh ? "#ffffff" : "#ef4444",
                        background: autoRefresh ? "#ef4444" : "transparent",
                        borderColor: autoRefresh ? "#ef4444" : "#ef4444",
                      }}
                    >
                      {autoRefresh ? (countdown > 0 ? countdown : "ON") : "OFF"}
                    </Button>
                  </Tooltip>
                  <Text
                    type="secondary"
                    style={{
                      color: isDark ? "#a0a0a0" : "#666666",
                      fontSize: "12px",
                    }}
                  >
                    {mails.length} emails
                  </Text>
                </Space>
              }
              style={{
                background: isDark ? "#262626" : "#fafafa",
                border: isDark ? "1px solid #404040" : "1px solid #d9d9d9",
              }}
            >
              <List
                dataSource={currentMails}
                renderItem={(mail) => (
                  <List.Item
                    className={`mail-item ${!mail.isRead ? "unread" : ""}`}
                    style={{
                      padding: "12px",
                      cursor: "pointer",
                      borderRadius: borderRadiusLG,
                      marginBottom: 8,
                      background: isDark ? "#262626" : "#ffffff",
                      border: isDark
                        ? "1px solid #404040"
                        : "1px solid #d9d9d9",
                    }}
                    onClick={() => openMail(mail)}
                    actions={[
                      <Button
                        key="view"
                        type="text"
                        icon={<EyeOutlined style={{ color: "#ef4444" }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openMail(mail);
                        }}
                        style={{ color: "#ef4444" }}
                      >
                        View
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<UserOutlined />}
                          style={{
                            backgroundColor: !mail.isRead
                              ? "#ef4444"
                              : "#1890ff",
                          }}
                        />
                      }
                      title={
                        <Space>
                          <Text
                            strong={!mail.isRead}
                            style={{
                              fontSize: "14px",
                              color: isDark ? "#e0e0e0" : "#000000",
                            }}
                          >
                            {mail.from_name} &lt;{mail.from_email}&gt;
                          </Text>
                          {!mail.isRead && (
                            <Badge dot style={{ backgroundColor: "#ef4444" }} />
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 4 }}>
                            <Text
                              strong={!mail.isRead}
                              style={{
                                color: isDark ? "#e0e0e0" : "#000000",
                                fontSize: "13px",
                              }}
                            >
                              {mail.subject}
                            </Text>
                          </div>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: "12px",
                              color: isDark ? "#a0a0a0" : "#666666",
                            }}
                          >
                            {mail.body && mail.body.length > 60
                              ? mail.body.slice(0, 60) + "..."
                              : mail.body}
                          </Text>
                          <div style={{ marginTop: 4 }}>
                            <Space size="small">
                              <ClockCircleOutlined
                                style={{
                                  color: isDark ? "#a0a0a0" : "#999",
                                  fontSize: "11px",
                                }}
                              />
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: "11px",
                                  color: isDark ? "#a0a0a0" : "#666666",
                                }}
                              >
                                {mail.date
                                  ? new Date(mail.date).toLocaleString(
                                      "vi-VN",
                                      { hour12: false }
                                    )
                                  : ""}
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
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <Pagination
                    current={currentPage}
                    total={mails.length}
                    pageSize={mailsPerPage}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                    size="small"
                    disabled={loading}
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
        <Footer
          style={{
            textAlign: "center",
            background: isDark ? "#262626" : "#f8f9fa",
            borderTop: isDark ? "1px solid #404040" : "1px solid #e8e8e8",
            color: isDark ? "#a0a0a0" : "#666666",
            padding: "16px",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text
                type="secondary"
                style={{
                  color: isDark ? "#a0a0a0" : "#666666",
                  fontSize: "12px",
                }}
              >
                © 2025 Brosup Digital Co., Ltd. All rights reserved.
              </Text>
              <div>
                <ClockCircleOutlined
                  style={{
                    fontSize: 10,
                    color: isDark ? "#a0a0a0" : "#666666",
                    marginRight: 4,
                  }}
                />
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    color: isDark ? "#a0a0a0" : "#666666",
                  }}
                >
                  Key expires in:{" "}
                  {userData?.expiryDate
                    ? new Date(userData.expiryDate).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "Unknown"}
                </Text>
              </div>
            </Space>
          </div>
        </Footer>

        {/* Mail Detail Modal - Optimized */}
        <Modal
          title={
            <Space>
              <MailOutlined style={{ color: "#ef4444" }} />
              <span style={{ color: isDark ? "#e0e0e0" : "#000000" }}>
                Email Details
              </span>
            </Space>
          }
          open={isModalOpen}
          onCancel={handleModalCancel}
          width="90%"
          style={{ maxWidth: 800 }}
          footer={[
            <Button
              key="close"
              onClick={handleModalCancel}
              style={{ color: "#ef4444", borderColor: "#ef4444" }}
            >
              Close
            </Button>,
          ]}
          className="mail-dialog"
          destroyOnHidden={true}
          maskClosable={true}
          closable={true}
          centered={true}
        >
          {selectedMail && (
            <div style={{ color: isDark ? "#e0e0e0" : "#000000" }}>
              <div style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div>
                    <Text
                      strong
                      style={{ color: isDark ? "#e0e0e0" : "#000000" }}
                    >
                      From:
                    </Text>
                    <Text
                      style={{
                        marginLeft: 8,
                        color: isDark ? "#e0e0e0" : "#000000",
                      }}
                    >
                      {selectedMail.from_name} &lt;{selectedMail.from_email}&gt;
                    </Text>
                  </div>
                  <div>
                    <Text
                      strong
                      style={{ color: isDark ? "#e0e0e0" : "#000000" }}
                    >
                      Subject:
                    </Text>
                    <Text
                      style={{
                        marginLeft: 8,
                        color: isDark ? "#e0e0e0" : "#000000",
                      }}
                    >
                      {selectedMail.subject}
                    </Text>
                  </div>
                  <div>
                    <Text
                      strong
                      style={{ color: isDark ? "#e0e0e0" : "#000000" }}
                    >
                      Date:
                    </Text>
                    <Text
                      style={{
                        marginLeft: 8,
                        color: isDark ? "#e0e0e0" : "#000000",
                      }}
                    >
                      {selectedMail.date
                        ? new Date(selectedMail.date).toLocaleString("vi-VN", {
                            hour12: false,
                          })
                        : ""}
                    </Text>
                  </div>
                </Space>
              </div>
              <Divider
                style={{ borderColor: isDark ? "#404040" : "#d9d9d9" }}
              />
              {isHTML(selectedMail.body) ? (
                <div
                  style={{
                    fontSize: 14,
                    color: isDark ? "#e0e0e0" : "#000000",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(selectedMail.body || ""),
                  }}
                />
              ) : (
                <Paragraph
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: 14,
                    color: isDark ? "#e0e0e0" : "#000000",
                  }}
                >
                  {selectedMail.body}
                </Paragraph>
              )}
            </div>
          )}
        </Modal>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
