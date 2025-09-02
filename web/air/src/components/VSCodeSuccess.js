import React, { useContext, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/User';
import { getLogo, showSuccess, showError } from '../helpers';
import { Button, Card, Layout, Typography, Space, Divider } from '@douyinfe/semi-ui';
import { IconTickCircle, IconCopy } from '@douyinfe/semi-icons';

const { Title, Text } = Typography;

const VSCodeSuccess = () => {
  const [searchParams] = useSearchParams();
  const [userState] = useContext(UserContext);
  const navigate = useNavigate();
  const logo = getLogo();
  const [copied, setCopied] = useState(false);

  // Extract parameters from URL
  const token = searchParams.get('token');
  const username = searchParams.get('username');
  const sessionId = searchParams.get('session_id');
  const provider = searchParams.get('provider') || 'local';

  useEffect(() => {
    // Auto-close functionality - close window after 10 seconds
    const timer = setTimeout(() => {
      if (window.opener) {
        window.close();
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token).then(() => {
        setCopied(true);
        showSuccess('API token copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        showError('Failed to copy token to clipboard');
      });
    }
  };

  const handleCloseWindow = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/token');
    }
  };

  const handleGoToTokens = () => {
    if (window.opener) {
      // If opened in popup, close and redirect parent
      window.opener.location.href = '/token';
      window.close();
    } else {
      navigate('/token');
    }
  };

  return (
    <div>
      <Layout>
        <Layout.Header />
        <Layout.Content>
          <div style={{ justifyContent: 'center', display: 'flex', marginTop: 80 }}>
            <div style={{ width: 600 }}>
              <Card>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <IconTickCircle
                    size="extra-large"
                    style={{ color: '#52c41a', fontSize: '64px', marginBottom: 16 }}
                  />
                  <Title heading={2} style={{ color: '#52c41a', margin: 0 }}>
                    {provider === 'coder' ? 'Coder Integration Successful!' : 'VSCode Integration Successful!'}
                  </Title>
                </div>

                <Space vertical align="start" style={{ width: '100%' }}>
                  <Text type="secondary" size="large">
                    {provider === 'coder'
                      ? 'Your VSCode extension has been successfully authenticated with One API via Coder.'
                      : 'Your VSCode extension has been successfully authenticated with One API.'}
                  </Text>

                  {provider === 'coder' && (
                    <div style={{
                      padding: 12,
                      backgroundColor: '#e6f7ff',
                      borderRadius: 6,
                      border: '1px solid #91d5ff'
                    }}>
                      <Text type="secondary" size="small">
                        <strong>🚀 Coder Integration:</strong> You've successfully authenticated through your Coder deployment.
                        Your VSCode extension can now access One API services seamlessly within your cloud development environment.
                      </Text>
                    </div>
                  )}

                  {username && (
                    <div>
                      <Text strong>Authenticated User: </Text>
                      <Text code>{username}</Text>
                    </div>
                  )}

                  {sessionId && (
                    <div>
                      <Text strong>Session ID: </Text>
                      <Text code>{sessionId}</Text>
                    </div>
                  )}

                  {token && (
                    <>
                      <Divider margin="16px" />
                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                          Your API Token:
                        </Text>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8,
                          padding: 12,
                          backgroundColor: '#f6f8fa',
                          borderRadius: 6,
                          border: '1px solid #e1e4e8'
                        }}>
                          <Text 
                            code 
                            copyable={false}
                            style={{ 
                              flex: 1, 
                              wordBreak: 'break-all',
                              fontSize: '12px',
                              fontFamily: 'Monaco, Consolas, monospace'
                            }}
                          >
                            {token}
                          </Text>
                          <Button
                            icon={<IconCopy />}
                            size="small"
                            theme={copied ? 'solid' : 'borderless'}
                            type={copied ? 'success' : 'primary'}
                            onClick={copyToken}
                          >
                            {copied ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  <Divider margin="20px" />

                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">
                      This window will automatically close in 10 seconds, or you can close it manually.
                    </Text>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    gap: 12, 
                    justifyContent: 'center',
                    marginTop: 20 
                  }}>
                    <Button 
                      type="primary" 
                      onClick={handleGoToTokens}
                      size="large"
                    >
                      Manage API Tokens
                    </Button>
                    <Button 
                      onClick={handleCloseWindow}
                      size="large"
                    >
                      Close Window
                    </Button>
                  </div>

                  <div style={{
                    marginTop: 24,
                    padding: 16,
                    backgroundColor: '#f0f9ff',
                    borderRadius: 6,
                    border: '1px solid #bae6fd'
                  }}>
                    <Text type="secondary" size="small">
                      <strong>Next Steps:</strong>
                      <br />
                      • Your VSCode extension is now connected to One API
                      {provider === 'coder' && (
                        <>
                          <br />
                          • Your Coder workspace has access to One API services
                        </>
                      )}
                      <br />
                      • You can start using AI features directly in your VSCode editor
                      <br />
                      • Manage your API tokens and usage in the dashboard
                      {provider === 'coder' && (
                        <>
                          <br />
                          • All team members in your Coder deployment can now use the integrated API
                        </>
                      )}
                    </Text>
                  </div>
                </Space>
              </Card>
            </div>
          </div>
        </Layout.Content>
      </Layout>
    </div>
  );
};

export default VSCodeSuccess;