import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserContext } from '../context/User';
import { API, getLogo, showError, showInfo, showSuccess } from '../helpers';
import { onGitHubOAuthClicked } from './utils';
import { Button, Card, Divider, Form, Layout, Modal } from '@douyinfe/semi-ui';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import TelegramLoginButton from 'react-telegram-login';

import { IconGithubLogo } from '@douyinfe/semi-icons';

const LoginForm = () => {
  const [inputs, setInputs] = useState({
    username: '',
    password: ''
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const { username, password } = inputs;
  const [userState, userDispatch] = useContext(UserContext);
  let navigate = useNavigate();
  const [status, setStatus] = useState({});
  const logo = getLogo();

  useEffect(() => {
    if (searchParams.get('expired')) {
      showError('Not logged in or login has expired, please log in again!');
    }
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setStatus(status);
    }
  }, []);


  function handleChange(name, value) {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {
    setSubmitted(true);
    if (username && password) {
      // Extract source parameter from URL
      const source = searchParams.get('source');
      const res = await API.post(`/api/user/login${source ? `?source=${source}` : ''}`, {
        username,
        password
      });
      const { success, message, data } = res.data;
      if (success) {
        userDispatch({ type: 'login', payload: data });
        localStorage.setItem('user', JSON.stringify(data));
        showSuccess('Login successful!');
        if (username === 'root' && password === '123456') {
          Modal.error({ title: 'You are using the default password!', content: 'Please change the default password immediately!', centered: true });
        }
        
        // VSCode-specific handling
        if (source === 'vscode') {
          // VSCode-specific success handling - could add custom messaging or behavior
          showInfo('VSCode integration login successful!');
        }
        
        navigate('/token');
      } else {
        showError(message);
      }
    } else {
      showError('Please enter username and password!');
    }
  }

  // 添加Telegram登录处理函数
  const onTelegramLoginClicked = async (response) => {
    const fields = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date', 'hash', 'lang'];
    const params = {};
    fields.forEach((field) => {
      if (response[field]) {
        params[field] = response[field];
      }
    });
    const res = await API.get(`/api/oauth/telegram/login`, { params });
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
      localStorage.setItem('user', JSON.stringify(data));
      showSuccess('Login successful!');
      navigate('/');
    } else {
      showError(message);
    }
  };

  return (
    <div>
      <Layout>
        <Layout.Header>
        </Layout.Header>
        <Layout.Content>
          <div style={{ justifyContent: 'center', display: 'flex', marginTop: 120 }}>
            <div style={{ width: 500 }}>
              <Card>
                <Title heading={2} style={{ textAlign: 'center' }}>
                  User Login
                </Title>
                <Form>
                  <Form.Input
                    field={'username'}
                    label={'Username'}
                    placeholder="Username"
                    name="username"
                    onChange={(value) => handleChange('username', value)}
                  />
                  <Form.Input
                    field={'password'}
                    label={'Password'}
                    placeholder="Password"
                    name="password"
                    type="password"
                    onChange={(value) => handleChange('password', value)}
                  />

                  <Button theme="solid" style={{ width: '100%' }} type={'primary'} size="large"
                          htmlType={'submit'} onClick={handleSubmit}>
                    Login
                  </Button>
                </Form>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                  <Text>
                    No account? <Link to="/register">Register here</Link>
                  </Text>
                  <Text>
                    Forgot password? <Link to="/reset">Reset here</Link>
                  </Text>
                </div>
                {status.github_oauth || status.telegram_oauth ? (
                  <>
                    <Divider margin="12px" align="center">
                      Third-party Login
                    </Divider>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                      {status.github_oauth ? (
                        <Button
                          type="primary"
                          icon={<IconGithubLogo />}
                          onClick={() => onGitHubOAuthClicked(status.github_client_id)}
                        />
                      ) : (
                        <></>
                      )}

                      {status.telegram_oauth ? (
                        <TelegramLoginButton dataOnauth={onTelegramLoginClicked} botName={status.telegram_bot_name} />
                      ) : (
                        <></>
                      )}
                    </div>
                  </>
                ) : (
                  <></>
                )}
              </Card>
            </div>
          </div>

        </Layout.Content>
      </Layout>
    </div>
  );
};

export default LoginForm;
