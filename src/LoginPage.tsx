import { Card, Form, Input, Button, Typography, Space, App } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Footer } from 'antd/es/layout/layout';

export interface LicenseResponse {
  status: number;
  message?: string;
  code?: number;
  fullName?: string;
  hash?: string[];
  expiryDate?: string;
}

// Session management constants
const SESSION_KEY = 'brosup_session';
const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours in ms
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

const checkKey = async (key: string): Promise<LicenseResponse> => {
  try {
    const response = await axios.post<LicenseResponse>(
      'https://stalwart-backend.onrender.com/verify-license',
      { method: 'web', key },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      return {
        status: 5,
        message: 'Request timed out. Please try again later.'
      };
    }
    return {
      status: 6,
      message: `Request failed: ${error.message}`
    };
  }
};

// Session helper functions
const saveSession = (userData: { fullName: string; expiryDate: string }) => {
  const session = {
    userData,
    timestamp: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

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

const { Title, Text } = Typography;

function LoginPageContent({ onLogin }: { onLogin: (userData: { fullName: string; expiryDate: string }) => void }) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      onLogin(session.userData);
    }
  }, [onLogin]);

  // Check lockout status
  useEffect(() => {
    const storedLockout = localStorage.getItem('login_lockout');
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout);
      if (Date.now() < lockoutTime) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem('login_lockout');
      }
    }
  }, []);

  const onFinish = async (values: any) => {
    // Check lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingTime = Math.ceil((lockoutUntil - Date.now()) / 1000 / 60);
      setStatus(`Account locked. Please try again in ${remainingTime} minutes.`);
      return;
    }

    // Check rate limiting
    if (loginAttempts >= MAX_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_TIME;
      setLockoutUntil(lockoutTime);
      localStorage.setItem('login_lockout', lockoutTime.toString());
      setStatus('Too many login attempts. Account locked for 15 minutes.');
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const result = await checkKey(values.key);
      console.log(result);
      setLoading(false);
      
      if (result.code === 1) {
        setLoginAttempts(0); // Reset attempts on success
        saveSession({ 
          fullName: result.fullName || 'User', 
          expiryDate: result.expiryDate || 'Unknown' 
        });
        setTimeout(() => onLogin({ 
          fullName: result.fullName || 'User', 
          expiryDate: result.expiryDate || 'Unknown' 
        }), 200);
      } else if (result.status === 2) {
        setLoginAttempts(prev => prev + 1);
        const attemptsLeft = MAX_ATTEMPTS - (loginAttempts + 1);
        if (attemptsLeft > 0) {
          setStatus(`The license key has expired. (${attemptsLeft} attempts remaining)`);
        } else {
          setStatus(`The license key has expired. (Last attempt!)`);
        }
      } else if (result.status === 3) {
        setLoginAttempts(prev => prev + 1);
        const attemptsLeft = MAX_ATTEMPTS - (loginAttempts + 1);
        if (attemptsLeft > 0) {
          setStatus(`License key is invalid or has been deactivated. (${attemptsLeft} attempts remaining)`);
        } else {
          setStatus(`License key is invalid or has been deactivated. (Last attempt!)`);
        }
      } else if (result.status === 4) {
        setLoginAttempts(prev => prev + 1);
        const attemptsLeft = MAX_ATTEMPTS - (loginAttempts + 1);
        if (attemptsLeft > 0) {
          setStatus(`Unknown error occurred or timeout. (${attemptsLeft} attempts remaining)`);
        } else {
          setStatus(`Unknown error occurred or timeout. (Last attempt!)`);
        }
      } else if (result.status === 5) {
        // Network timeout - don't count as login attempt
        setStatus('Request timed out. Please try again later.');
      } else {
        // Network error - don't count as login attempt
        setStatus('Request failed.');
      }
    } catch (error) {
      setLoading(false);
      // Network error - don't count as login attempt
      setStatus('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e3e6ed 100%)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <img src="https://i.postimg.cc/d0LRkv0z/Black-color.png" alt="Logo" style={{ width: 200 }} />
          <Card style={{ minWidth: 350, borderRadius: 18, boxShadow: '0 4px 24px #0001', padding: 0, border: 'none' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: 24, color: '#ef4444', fontWeight: 700, letterSpacing: 1 }}>Sign In</Title>
            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item label={<span style={{ fontWeight: 600 }}>License Key</span>} name="key" rules={[{ required: true, message: 'Please enter your licence key!' }]}> 
                <Input.Password
                  size="large"
                  autoComplete="off"
                  placeholder="Enter your licence key"
                  style={{ borderRadius: 8, fontWeight: 500 }}
                  iconRender={(visible) => (
                    visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                  )}
                />
              </Form.Item>
              {status && (
                <Text style={{ color: '#ef4444', fontWeight: 600, marginBottom: 12, display: 'block', textAlign: 'center' }}>
                  {status}
                </Text>
              )}
              {loginAttempts > 0 && (
                <Text style={{ color: '#ffa500', fontSize: 12, marginBottom: 12, display: 'block', textAlign: 'center' }}>
                  Login attempts: {loginAttempts}/{MAX_ATTEMPTS}
                </Text>
              )}
              <Form.Item style={{ marginBottom: 0 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block 
                  style={{ borderRadius: 8, background: '#ef4444', borderColor: '#ef4444', fontWeight: 700, letterSpacing: 1 }} 
                  loading={loading}
                  disabled={lockoutUntil !== null}
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Space>
      </div>
      {/* Footer */}
      <Footer style={{ 
        textAlign: 'center', 
        borderTop: '1px solid #d9d9d9',
        padding: '24px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e3e6ed 100%)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 13, color: '#666666' }}>
              © 2025 Brosup Digital Co., Ltd. All rights reserved.
            </Text>
          </Space>
        </div>
      </Footer>
    </div>
  );
}

export default function LoginPage({ onLogin }: { onLogin: (userData: { fullName: string; expiryDate: string }) => void }) {
  return (
    <App>
      <LoginPageContent onLogin={onLogin} />
    </App>
  );
} 