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
  Dropdown,
  Select,
  Tooltip,
  AutoComplete,
  Alert,
  InputNumber,
  Tag,
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
  SafetyCertificateOutlined,
  PlusOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
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
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    visible: boolean;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [results, setResults] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [isMultiCreateModalOpen, setIsMultiCreateModalOpen] = useState(false);
  const [isCreatingMails, setIsCreatingMails] = useState(false);
  const [emailStats, setEmailStats] = useState({ success: 0, errors: 0 });

  // Custom notification function
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

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
            // showNotification("info", "Auto-refresh stopped after 1 minute");
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
    if (isLoggedIn && userData && !isCreatingMails && !isMultiCreateModalOpen) {
      const session = getSession();
      if (!session) {
        handleLogout();
        return;
      }

      const timeLeft = session.expiresAt - Date.now();
      const logoutTimer = setTimeout(() => {
        showNotification("warning", "Session expired. Please login again.");
        handleLogout();
      }, timeLeft);

      return () => clearTimeout(logoutTimer);
    }
  }, [isLoggedIn, userData, isCreatingMails, isMultiCreateModalOpen]);

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
      showNotification("info", "Auto-refresh disabled");
    } else {
      // Enable auto-refresh
      setAutoRefresh(true);
      setCountdown(10);
      setAutoRefreshStartTime(Date.now());
      // showNotification("success", "Auto-refresh enabled (10s interval, will stop after 1 minute)");
    }
  };

  // Function to parse email and extract username and domain
  const parseEmail = (input: string | undefined) => {
    // Handle undefined or null input
    if (!input) return null;
    
    const trimmedInput = input.trim();
    
    // Check if input contains @ symbol (is an email)
    if (trimmedInput.includes('@')) {
      const parts = trimmedInput.split('@');
      if (parts.length === 2) {
        const username = parts[0].toLowerCase();
        const inputDomain = `@${parts[1].toLowerCase()}`;
        
        // Check if domain exists in our options
        const matchedDomain = DOMAIN_OPTIONS.find(domain => 
          domain.toLowerCase() === inputDomain
        );
        
        if (matchedDomain) {
          return { username, domain: matchedDomain };
        }
      }
    }
    
    // If not a valid email or domain doesn't match, return null
    return null;
  };

  const handleUserSubmit = async () => {
    const user = userInput?.toLowerCase().trim();
    if (user && !loading) {
      console.log(user);
      setLoading(true);
      setCheckingStatus("Checking or creating email...");
      const email = `${user}${domain}`;
      const status = await checkOrCreateUser(email);
      if (status === "error") {
        setCheckingStatus("Error while creating/checking email!");
        setLoading(false);
        // Clear inbox when there's an error
        setMails([]);
        setHasLoadedMails(false);
        showNotification("error", "Failed to create/check email");
        // Save to input history even when there's an error
        saveToHistory(userInput);
        return;
      }
      const data = await fetchEmails(email, 1, mailsPerPage);
      
      if (data.emails && data.emails.length >= 0) {
        setMails(data.emails);
        setCurrentPage(1);
        setLoading(false);
        setHasLoadedMails(true); // Mark as successfully loaded
        if (status === "created") {
          setCheckingStatus("Email created successfully. Loaded inbox!");
          showNotification("success", "Email created and inbox loaded successfully");
        } else if (status === "exists") {
          setCheckingStatus("Email already exists. Loaded inbox!");
          showNotification("success", "Email exists and inbox loaded successfully");
        }
        setTimeout(() => setCheckingStatus(null), 5000);
      } else {
        // Clear inbox when there's an error
        setMails([]);
        setHasLoadedMails(false);
        setLoading(false);
        showNotification("error", "Failed to load inbox");
        return;
      }

      // Auto-enable auto-refresh after successful load
      setAutoRefresh(true);
      setCountdown(10);
      setAutoRefreshStartTime(Date.now());
      // showNotification(
      //   "info",
      //   "Auto-refresh enabled (10s interval, will stop after 1 minute)"
      // );

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
    showNotification("success", "Logged out successfully");
  };

  const handleGenerate = () => {
    setUserInput(randomUser());
    // Disable auto-refresh when generating new username
    if (autoRefresh) {
      setAutoRefresh(false);
      setCountdown(0);
      setAutoRefreshStartTime(null);
      // showNotification("info", "Auto-refresh disabled due to username change");
    }
  };

  const handleCopy = () => {
    const user = userInput?.toLowerCase().trim();
    if (!user) {
      showNotification("warning", "Please enter a username first");
      return;
    }
    const email = `${user}${domain}`;
    navigator.clipboard.writeText(email);
    showNotification("success", "Copied: " + email);
  };

  const handleRefresh = async () => {
    if (loading) return;

    setLoading(true);
    const user = userInput?.toLowerCase().trim();
    if (!user) {
      setLoading(false);
      return;
    }
    const email = `${user}${domain}`;
    const data = await fetchEmails(email, currentPage, mailsPerPage);
    
    if (data.emails && data.emails.length >= 0) {
      setMails(data.emails);
      setHasLoadedMails(true); // Mark as successfully loaded
      showNotification("success", "Mailbox refreshed");
    } else {
      // Clear inbox when there's an error
      setMails([]);
      setHasLoadedMails(false);
      showNotification("error", "Failed to refresh mailbox");
    }
    
    setLoading(false);

    // Start countdown after successful refresh if auto-refresh is enabled
    if (autoRefresh && data.emails && data.emails.length >= 0) {
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
    const user = userInput?.toLowerCase().trim();
    if (!user) {
      setLoading(false);
      return;
    }
    const email = `${user}${domain}`;
    const data = await fetchEmails(email, page, mailsPerPage);
    
    if (data.emails && data.emails.length >= 0) {
      setMails(data.emails);
      setCurrentPage(page);
      showNotification("success", "Page loaded");
    } else {
      // Clear inbox when there's an error
      setMails([]);
      setHasLoadedMails(false);
      showNotification("error", "Failed to load page");
    }
    
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
        `https://mailpro.brosupdigital.com/emails?user=${user}&page=${page}&limit=${limit}`
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
        "https://mailpro.brosupdigital.com/create-user",
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

  const createMultipleEmails = async (quantity: number, domain: string) => {
    try {
      const res = await axios.post(
        "https://mailpro.brosupdigital.com/create-multiple-emails",
        { quantity, domain }
      );
      return res.data;
    } catch (err) {
      throw err;
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

  // Function to extract 6 or 8 digit codes from text
  const extractCodes = (text: string): string[] => {
    if (!text || typeof text !== "string") return [];
    
    // Remove HTML tags if present
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    // Find 6 or 8 digit numbers
    const codePattern = /\b\d{6}\b|\b\d{8}\b/g;
    const matches = cleanText.match(codePattern);
    
    return matches ? [...new Set(matches)] : [];
  };

  // Function to copy code from mail
  const handleCopyCode = async (mail: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const codes = [
      ...extractCodes(mail.subject || ''),
      ...extractCodes(mail.body || '')
    ];
    
    if (codes.length === 0) {
      showNotification("warning", "No verification codes found in this email");
      return;
    }
    
    // Copy the first code found
    const codeToCopy = codes[0];
    
    try {
      await navigator.clipboard.writeText(codeToCopy);
      showNotification("success", `Code copied: ${codeToCopy}`);
    } catch (error) {
      showNotification("error", "Failed to copy code to clipboard");
    }
  };

  const handleMultiCreate = async () => {
    if (loading) return;

    setLoading(true);
    setIsCreatingMails(true);
    setResults([]);
    setCheckingStatus("Creating multiple emails...");
    
    try {
      // Call API to create multiple emails
      const response = await createMultipleEmails(quantity, domain);
      
      // Process results based on new API format
      const results: string[] = [];
      let successCount = 0;
      let errorCount = 0;

      if (response && response.success !== undefined) {
        // New API format: { success: 8, errors: 1, emails: [...] }
        const successCount = response.success || 0;
        const errorCount = response.errors || 0;
        
        // Update stats for display
        setEmailStats({ success: successCount, errors: errorCount });
        
        // Add successful emails to results (emails array only contains successful ones)
        if (response.emails && Array.isArray(response.emails)) {
          response.emails.forEach((email: string) => {
            results.push(`${email}`);
          });
        }
        

      } else {
        // Fallback to individual API calls if bulk API fails
        setCheckingStatus("Bulk creation failed, trying individual creation...");
        
        // Generate random usernames for fallback
        const users = Array.from({ length: quantity }, () => randomUser());
        const fallbackEmails = users.map(user => `${user}${domain}`);
        
        for (let i = 0; i < fallbackEmails.length; i++) {
          try {
            const email = fallbackEmails[i];
            const status = await checkOrCreateUser(email);
            
            if (status === "created") {
              results.push(`${email} - Created`);
              successCount++;
            } else if (status === "exists") {
              results.push(`${email} - Already exists`);
              successCount++; // Count as success since email exists
            } else {
              results.push(`${email} - Error`);
              errorCount++;
            }
          } catch (error) {
            results.push(`${fallbackEmails[i]} - Error`);
            errorCount++;
          }
          

          
          // Add small delay to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setResults(results);
      
      
    } catch (error) {
      console.error("Error creating multiple emails:", error);
      showNotification("error", "Failed to create multiple emails. Please try again.");
      setCheckingStatus("Error creating emails. Please try again.");
    } finally {
      setLoading(false);
      setIsCreatingMails(false);
      setTimeout(() => setCheckingStatus(null), 5000);
    }
  };

  const handleExport = () => {
    if (exporting) return;

    setExporting(true);
    
    const results_emails = results.join("\n");
    
    const data = results_emails;
    const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email_results_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setExporting(false);
    showNotification("success", "Results exported successfully!");
  };

  const openMultiCreateModal = () => {
    setIsMultiCreateModalOpen(true);
    setQuantity(1);
    setResults([]);
  };

  const closeMultiCreateModal = () => {
    if (isCreatingMails) {
      showNotification("warning", "Please wait for email creation to complete");
      return;
    }
    
    // Check if there are results and ask for confirmation
    if (results.length > 0) {
      const confirmed = window.confirm(
        "You have email creation results. Are you sure you want to close? All data will be lost."
      );
      if (!confirmed) {
        return;
      }
    }
    
    setIsMultiCreateModalOpen(false);
    setResults([]);
  };

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCreatingMails) {
        e.preventDefault();
        e.returnValue = "Email creation is running. Are you sure you want to leave?";
        return "Email creation is running. Are you sure you want to leave?";
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isCreatingMails]);

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
      {notification && notification.visible && (
        <div style={{ position: 'fixed', top: 24, left: 0, right: 0, zIndex: 2000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <Alert
            message={notification.message}
            type={notification.type}
            showIcon
            closable
            style={{ minWidth: 320, maxWidth: 480, pointerEvents: 'auto' }}
            onClose={() => setNotification(null)}
          />
        </div>
      )}
      <Layout
        style={{
          minHeight: "100vh",
          background: isDark ? "#0f0f0f" : "#f8fafc",
        }}
      >
        <Header
          style={{
            padding: "0 24px",
            background: isDark ? "#1a1a1a" : "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: isDark
              ? "0 4px 20px rgba(0,0,0,0.4)"
              : "0 4px 20px rgba(0,0,0,0.08)",
            borderBottom: isDark ? "1px solid #2a2a2a" : "1px solid #e2e8f0",
            backdropFilter: "blur(10px)",
            position: "sticky",
            top: 0,
            zIndex: 1000,
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
                style={{ 
                  margin: 0, 
                  color: "#ef4444", 
                  fontSize: "20px",
                  fontWeight: 700,
                  letterSpacing: "-0.5px"
                }}
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
            padding: "24px",
            background: isDark ? "#0f0f0f" : "#f8fafc",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* User Input */}
            <Card
              style={{
                marginBottom: 24,
                background: isDark ? "#1a1a1a" : "#ffffff",
                border: isDark ? "1px solid #2a2a2a" : "1px solid #e2e8f0",
                borderRadius: 12,
                boxShadow: isDark 
                  ? "0 4px 20px rgba(0,0,0,0.3)" 
                  : "0 4px 20px rgba(0,0,0,0.06)",
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
                      onChange={(value) => {
                        setUserInput(value);
                        
                        // Parse email if user pastes a complete email
                        const parsed = parseEmail(value);
                        if (parsed) {
                          setUserInput(parsed.username);
                          setDomain(parsed.domain);
                          
                          // Disable auto-refresh when user changes input
                          if (autoRefresh) {
                            setAutoRefresh(false);
                            setCountdown(0);
                            setAutoRefreshStartTime(null);
                          }
                        }
                      }}
                      placeholder="Username or paste full email"
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
                      onChange={(value) => {
                        setDomain(value);
                        
                        // Disable auto-refresh when user changes domain
                        if (autoRefresh) {
                          setAutoRefresh(false);
                          setCountdown(0);
                          setAutoRefreshStartTime(null);
                        }
                      }}
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
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Tooltip title="Copy email address">
                      <Button
                        icon={<CopyOutlined />}
                        onClick={handleCopy}
                        size="large"
                        style={{ 
                          color: "#ef4444", 
                          padding: "0 12px",
                          borderRadius: 8,
                          height: "40px",
                          border: "1px solid #ef4444",
                          background: "transparent",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          const button = e.currentTarget as HTMLButtonElement;
                          button.style.background = "#ef4444";
                          button.style.color = "#ffffff";
                          button.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          const button = e.currentTarget as HTMLButtonElement;
                          button.style.background = "transparent";
                          button.style.color = "#ef4444";
                          button.style.transform = "translateY(0)";
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Refresh mailbox">
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={handleRefresh}
                        size="large"
                        loading={loading}
                        disabled={!userInput?.trim() || loading}
                        style={{ 
                          color: "#ef4444", 
                          padding: "0 12px",
                          borderRadius: 8,
                          height: "40px",
                          border: "1px solid #ef4444",
                          background: "transparent",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          const button = e.currentTarget as HTMLButtonElement;
                          if (!button.disabled) {
                            button.style.background = "#ef4444";
                            button.style.color = "#ffffff";
                            button.style.transform = "translateY(-1px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const button = e.currentTarget as HTMLButtonElement;
                          if (!button.disabled) {
                            button.style.background = "transparent";
                            button.style.color = "#ef4444";
                            button.style.transform = "translateY(0)";
                          }
                        }}
                      />
                    </Tooltip>
                    <Button
                      icon={<ThunderboltOutlined />}
                      onClick={handleGenerate}
                      size="large"
                      disabled={loading}
                      style={{
                        color: "#ef4444",
                        padding: "0 16px",
                        borderRadius: 8,
                        height: "40px",
                        border: "1px solid #ef4444",
                        background: "transparent",
                        fontWeight: 500,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        const button = e.currentTarget as HTMLButtonElement;
                        if (!button.disabled) {
                          button.style.background = "#ef4444";
                          button.style.color = "#ffffff";
                          button.style.transform = "translateY(-1px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const button = e.currentTarget as HTMLButtonElement;
                        if (!button.disabled) {
                          button.style.background = "transparent";
                          button.style.color = "#ef4444";
                          button.style.transform = "translateY(0)";
                        }
                      }}
                    >
                      Generate
                    </Button>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={openMultiCreateModal}
                      size="large"
                      disabled={loading}
                      variant="dashed"
                      style={{
                        color: "#ef4444",
                        borderColor: "#ef4444",
                        padding: "0 20px",
                        borderRadius: 8,
                        fontWeight: 600,
                        height: "40px",
                        fontSize: "14px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        const button = e.currentTarget as HTMLButtonElement;
                        if (!button.disabled) {
                          button.style.background = "#ef4444";
                          button.style.color = "#ffffff";
                          button.style.transform = "translateY(-1px)";
                          button.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const button = e.currentTarget as HTMLButtonElement;
                        if (!button.disabled) {
                          button.style.background = "transparent";
                          button.style.color = "#ef4444";
                          button.style.transform = "translateY(0)";
                          button.style.boxShadow = "none";
                        }
                      }}
                    >
                      Create Multiple
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleUserSubmit}
                      loading={loading}
                      disabled={!userInput?.trim() || loading}
                      style={{
                        background: "#ef4444",
                        borderColor: "#ef4444",
                        padding: "0 20px",
                        borderRadius: 8,
                        height: "40px",
                        fontWeight: 600,
                        fontSize: "14px",
                        transition: "all 0.2s ease",
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
                  <MailOutlined style={{ color: "#ef4444", fontSize: "18px" }} />
                  <span style={{ 
                    color: isDark ? "#e0e0e0" : "#000000",
                    fontSize: "18px",
                    fontWeight: 600
                  }}>
                    Inbox
                  </span>
                  {unreadCount > 0 && (
                    <Badge
                      count={unreadCount}
                      style={{ 
                        backgroundColor: "#ef4444",
                        fontSize: "12px",
                        fontWeight: 600
                      }}
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
                background: isDark ? "#1a1a1a" : "#ffffff",
                border: isDark ? "1px solid #2a2a2a" : "1px solid #e2e8f0",
                borderRadius: 12,
                boxShadow: isDark 
                  ? "0 4px 20px rgba(0,0,0,0.3)" 
                  : "0 4px 20px rgba(0,0,0,0.06)",
              }}
            >
              <List
                dataSource={currentMails}
                renderItem={(mail) => (
                  <List.Item
                    className={`mail-item ${!mail.isRead ? "unread" : ""}`}
                    style={{
                      padding: "16px",
                      cursor: "pointer",
                      borderRadius: 10,
                      marginBottom: 12,
                      background: isDark ? "#1a1a1a" : "#ffffff",
                      border: isDark
                        ? "1px solid #2a2a2a"
                        : "1px solid #e2e8f0",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => openMail(mail)}
                    actions={[
                      <Tooltip key="copy-code" title="Copy verification code">
                        <Button
                          type="text"
                          icon={<SafetyCertificateOutlined style={{ color: "#ef4444", fontSize: "14px" }} />}
                          onClick={(e) => handleCopyCode(mail, e)}
                          style={{ 
                            color: "#ef4444",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            const button = e.currentTarget as HTMLButtonElement;
                            button.style.background = "rgba(239, 68, 68, 0.1)";
                            button.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            const button = e.currentTarget as HTMLButtonElement;
                            button.style.background = "transparent";
                            button.style.transform = "scale(1)";
                          }}
                        >
                          Code
                        </Button>
                      </Tooltip>,
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
                                fontSize: "16px",
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
            background: isDark ? "#1a1a1a" : "#ffffff",
            borderTop: isDark ? "1px solid #2a2a2a" : "1px solid #e2e8f0",
            color: isDark ? "#a0a0a0" : "#666666",
            padding: "24px",
            marginTop: "auto",
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

        {/* Multi Mail Creation Modal */}
        <Modal
          title={
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 12,
              padding: "8px 0"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <PlusOutlined style={{ color: "#ffffff", fontSize: "18px" }} />
              </div>
              <span style={{ 
                color: isDark ? "#e0e0e0" : "#000000", 
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "-0.5px"
              }}>
                Create Multiple Emails
              </span>
            </div>
          }
          open={isMultiCreateModalOpen}
          onCancel={closeMultiCreateModal}
          width="90%"
          style={{ maxWidth: 900 }}
          footer={null}
          destroyOnClose={true}
          maskClosable={false}
          closable={true}
          centered={true}
        >
          <div style={{ color: isDark ? "#e0e0e0" : "#000000" }}>
            {/* Input Section */}
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  justifyContent: "space-around",
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginBottom: 20,
                  padding: "24px",
                  background: isDark ? "#1a1a1a" : "#f8fafc",
                  borderRadius: 12,
                  border: isDark ? "1px solid #2a2a2a" : "1px solid #e2e8f0",
                }}
              >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Text strong style={{ 
                        color: isDark ? "#e0e0e0" : "#000000",
                        fontSize: "14px",
                        minWidth: "80px"
                      }}>
                        Quantity:
                      </Text>
                      <InputNumber
                        min={1}
                        max={1000}
                        value={quantity}
                        onChange={(value) => setQuantity(value || 1)}
                        size="large"
                        style={{ 
                          width: 120,
                          borderRadius: 8,
                          border: isDark ? "1px solid #2a2a2a" : "1px solid #e2e8f0"
                        }}
                        disabled={loading}
                        placeholder="1-100"
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Text strong style={{ 
                        color: isDark ? "#e0e0e0" : "#000000",
                        fontSize: "14px",
                        minWidth: "80px"
                      }}>
                        Domain:
                      </Text>
                      <Select
                        value={domain}
                        onChange={(value) => {
                          setDomain(value);
                          
                          // Disable auto-refresh when user changes domain
                          if (autoRefresh) {
                            setAutoRefresh(false);
                            setCountdown(0);
                            setAutoRefreshStartTime(null);
                          }
                        }}
                        size="large"
                        style={{ 
                          width: 200,
                          borderRadius: 8
                        }}
                        options={DOMAIN_OPTIONS.map((d) => ({
                          value: d,
                          label: d,
                        }))}
                        disabled={loading}
                      />
                    </div>
                  </div>
                                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleMultiCreate}
                    loading={loading}
                    disabled={loading || quantity < 1 || quantity > 1000}
                    size="large"
                    style={{
                      background: "#ef4444",
                      borderColor: "#ef4444",
                      padding: "0 24px",
                      borderRadius: 8,
                      height: "40px",
                      fontWeight: 600,
                      fontSize: "14px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      const button = e.currentTarget as HTMLButtonElement;
                      if (!button.disabled) {
                        button.style.background = "#dc2626";
                        button.style.borderColor = "#dc2626";
                        button.style.transform = "translateY(-1px)";
                        button.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
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
                    Create {quantity} Emails
                  </Button>
              </div>

              
            </div>

            {/* Results Display */}
            {results.length > 0 && !loading && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Space>
                    <Text
                      strong
                      style={{ color: isDark ? "#e0e0e0" : "#000000" }}
                    >
                      Results:
                    </Text>
                                              <Tag color="success">
                          {emailStats.success} Created
                        </Tag>
                        <Tag color="error">
                          {emailStats.errors} Errors
                        </Tag>
                  </Space>
                  <Space>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleExport}
                      loading={exporting}
                      disabled={exporting}
                      size="small"
                      style={{ 
                        color: "#ef4444", 
                        borderColor: "#ef4444",
                        borderRadius: 6,
                        fontWeight: 500,
                        height: "32px",
                        padding: "0 12px"
                      }}
                    >
                      Export TXT
                    </Button>
                  </Space>
                </div>
                                  <div
                    style={{
                      maxHeight: 400,
                      overflowY: "auto",
                      border: isDark ? "1px solid #2a2a2a" : "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 16,
                      background: isDark ? "#1a1a1a" : "#ffffff",
                      boxShadow: isDark 
                        ? "inset 0 2px 8px rgba(0,0,0,0.2)" 
                        : "inset 0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                  {results.map((result, index) => (
                                            <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: 2,
                            fontSize: "14px",
                            borderRadius: 8,
                          }}
                        >
                                              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "14px" }} />
                      <Text
                        style={{
                          color: isDark ? "#e0e0e0" : "#000000",
                          fontSize: "13px",
                          flex: 1,
                        }}
                      >
                        {result}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: isDark ? "#e0e0e0" : "#000000",
                }}
              >
                <div style={{ marginBottom: 24 }}>
                  <SyncOutlined 
                    spin 
                    style={{ 
                      fontSize: "48px", 
                      color: "#ef4444",
                      marginBottom: 16 
                    }} 
                  />
                  <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: 12 }}>
                    Creating Multiple Emails...
                  </div>
                  <div style={{ fontSize: "14px", color: isDark ? "#a0a0a0" : "#666666", marginBottom: 16 }}>
                    Please do not close this window or navigate away from the page
                  </div>
                  <Alert
                    message="Important Notice"
                    description={`Email creation may take a very long time, especially when creating many emails. The more emails you create, the longer it will take. Please do not close the browser or refresh the page during this process. Your emails are being created in the background.`}
                    type="warning"
                    showIcon
                    style={{ 
                      textAlign: "left",
                      marginBottom: 16,
                      background: isDark ? "#1a1a1a" : "#fffbe6",
                      border: isDark ? "1px solid #404040" : "1px solid #ffe58f"
                    }}
                  />
                </div>
              </div>
            )}

            {/* Empty State */}
            {results.length === 0 && !loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: isDark ? "#a0a0a0" : "#666666",
                }}
              >
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: isDark ? "#2a2a2a" : "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}>
                  <PlusOutlined style={{ fontSize: "32px", color: "#ef4444", opacity: 0.7 }} />
                </div>
                <div style={{ fontSize: "18px", marginBottom: 12, fontWeight: 600 }}>
                  Ready to create multiple emails
                </div>
                <div style={{ fontSize: "14px", opacity: 0.8, maxWidth: "400px", margin: "0 auto" }}>
                  Set the quantity and domain, then click "Create" to start generating your emails
                </div>
              </div>
            )}
          </div>
        </Modal>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
