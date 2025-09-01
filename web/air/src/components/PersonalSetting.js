import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, copy, isRoot, showError, showInfo, showSuccess } from '../helpers';
import { UserContext } from '../context/User';
import { onGitHubOAuthClicked } from './utils';
import {
  Avatar,
  Banner,
  Button,
  Card,
  Descriptions,
  Image,
  Input,
  InputNumber,
  Layout,
  Modal,
  Space,
  Tag,
  Typography
} from '@douyinfe/semi-ui';
import { getQuotaPerUnit, renderQuota, renderQuotaWithPrompt, stringToColor } from '../helpers/render';
import TelegramLoginButton from 'react-telegram-login';

const PersonalSetting = () => {
  const [userState, userDispatch] = useContext(UserContext);
  let navigate = useNavigate();

  const [inputs, setInputs] = useState({
    email_verification_code: '',
    email: '',
    self_account_deletion_confirmation: '',
    set_new_password: '',
    set_new_password_confirmation: ''
  });
  const [status, setStatus] = useState({});
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEmailBindModal, setShowEmailBindModal] = useState(false);
  const [showAccountDeleteModal, setShowAccountDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [affLink, setAffLink] = useState('');
  const [systemToken, setSystemToken] = useState('');
  const [models, setModels] = useState([]);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);

  useEffect(() => {
    // let user = localStorage.getItem('user');
    // if (user) {
    //   userDispatch({ type: 'login', payload: user });
    // }
    // console.log(localStorage.getItem('user'))

    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setStatus(status);
    }
    getUserData().then(
      (res) => {
        console.log(userState);
      }
    );
    loadModels().then();
    getAffLink().then();
    setTransferAmount(getQuotaPerUnit());
  }, []);

  useEffect(() => {
    let countdownInterval = null;
    if (disableButton && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setDisableButton(false);
      setCountdown(30);
    }
    return () => clearInterval(countdownInterval); // Clean up on unmount
  }, [disableButton, countdown]);

  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const generateAccessToken = async () => {
    const res = await API.get('/api/user/token');
    const { success, message, data } = res.data;
    if (success) {
      setSystemToken(data);
      await copy(data);
      showSuccess(`Token has been reset and copied to clipboard`);
    } else {
      showError(message);
    }
  };

  const getAffLink = async () => {
    const res = await API.get('/api/user/aff');
    const { success, message, data } = res.data;
    if (success) {
      let link = `${window.location.origin}/register?aff=${data}`;
      setAffLink(link);
    } else {
      showError(message);
    }
  };

  const getUserData = async () => {
    let res = await API.get(`/api/user/self`);
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
    } else {
      showError(message);
    }
  };

  const loadModels = async () => {
    let res = await API.get(`/api/user/available_models`);
    const { success, message, data } = res.data;
    if (success) {
      setModels(data);
      console.log(data);
    } else {
      showError(message);
    }
  };

  const handleAffLinkClick = async (e) => {
    e.target.select();
    await copy(e.target.value);
    showSuccess(`Invitation link copied to clipboard`);
  };

  const handleSystemTokenClick = async (e) => {
    e.target.select();
    await copy(e.target.value);
    showSuccess(`System token copied to clipboard`);
  };

  const deleteAccount = async () => {
    if (inputs.self_account_deletion_confirmation !== userState.user.username) {
      showError('Please enter your account name to confirm deletion!');
      return;
    }

    const res = await API.delete('/api/user/self');
    const { success, message } = res.data;

    if (success) {
      showSuccess('Account has been deleted!');
      await API.get('/api/user/logout');
      userDispatch({ type: 'logout' });
      localStorage.removeItem('user');
      navigate('/login');
    } else {
      showError(message);
    }
  };


  const changePassword = async () => {
    if (inputs.set_new_password !== inputs.set_new_password_confirmation) {
      showError('The two passwords entered do not match!');
      return;
    }
    const res = await API.put(
      `/api/user/self`,
      {
        password: inputs.set_new_password
      }
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess('Password changed successfully!');
    } else {
      showError(message);
    }
    setShowChangePasswordModal(false);
  };

  const transfer = async () => {
    if (transferAmount < getQuotaPerUnit()) {
      showError('Minimum transfer amount is ' + renderQuota(getQuotaPerUnit()));
      return;
    }
    const res = await API.post(
      `/api/user/aff_transfer`,
      {
        quota: transferAmount
      }
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess(message);
      setOpenTransfer(false);
      getUserData().then();
    } else {
      showError(message);
    }
  };

  const sendVerificationCode = async () => {
    if (inputs.email === '') {
      showError('Please enter email address!');
      return;
    }
    setDisableButton(true);
    setLoading(true);
    const res = await API.get(
      `/api/verification?email=${inputs.email}`
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess('Verification code sent successfully, please check your email!');
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const bindEmail = async () => {
    if (inputs.email_verification_code === '') {
      showError('Please enter email verification code!');
      return;
    }
    setLoading(true);
    const res = await API.get(
      `/api/oauth/email/bind?email=${inputs.email}&code=${inputs.email_verification_code}`
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess('Email account bound successfully!');
      setShowEmailBindModal(false);
      userState.user.email = inputs.email;
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const getUsername = () => {
    if (userState.user) {
      return userState.user.username;
    } else {
      return 'null';
    }
  };

  const handleCancel = () => {
    setOpenTransfer(false);
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess('Copied: ' + text);
    } else {
      // setSearchKeyword(text);
      Modal.error({ title: 'Failed to copy to clipboard, please copy manually', content: text });
    }
  };

  return (
    <div>
      <Layout>
        <Layout.Content>
          <Modal
            title="Please enter the amount to transfer"
            visible={openTransfer}
            onOk={transfer}
            onCancel={handleCancel}
            maskClosable={false}
            size={'small'}
            centered={true}
          >
            <div style={{ marginTop: 20 }}>
              <Typography.Text>{`Available Quota${renderQuotaWithPrompt(userState?.user?.aff_quota)}`}</Typography.Text>
              <Input style={{ marginTop: 5 }} value={userState?.user?.aff_quota} disabled={true}></Input>
            </div>
            <div style={{ marginTop: 20 }}>
              <Typography.Text>{`Transfer Quota${renderQuotaWithPrompt(transferAmount)} Minimum ` + renderQuota(getQuotaPerUnit())}</Typography.Text>
              <div>
                <InputNumber min={0} style={{ marginTop: 5 }} value={transferAmount}
                  onChange={(value) => setTransferAmount(value)} disabled={false}></InputNumber>
              </div>
            </div>
          </Modal>
          <div style={{ marginTop: 20 }}>
            <Card
              title={
                <Card.Meta
                  avatar={<Avatar size="default" color={stringToColor(getUsername())}
                    style={{ marginRight: 4 }}>
                    {typeof getUsername() === 'string' && getUsername().slice(0, 1)}
                  </Avatar>}
                  title={<Typography.Text>{getUsername()}</Typography.Text>}
                  description={isRoot() ? <Tag color="red">Administrator</Tag> : <Tag color="blue">Regular User</Tag>}
                ></Card.Meta>
              }
              headerExtraContent={
                <>
                  <Space vertical align="start">
                    <Tag color="green">{'ID: ' + userState?.user?.id}</Tag>
                    <Tag color="blue">{userState?.user?.group}</Tag>
                  </Space>
                </>
              }
              footer={
                <Descriptions row>
                  <Descriptions.Item itemKey="Current Balance">{renderQuota(userState?.user?.quota)}</Descriptions.Item>
                  <Descriptions.Item itemKey="Historical Consumption">{renderQuota(userState?.user?.used_quota)}</Descriptions.Item>
                  <Descriptions.Item itemKey="Request Count">{userState.user?.request_count}</Descriptions.Item>
                </Descriptions>
              }
            >
              <Typography.Title heading={6}>API Information</Typography.Title>
              <p>Available Models (Click to copy)</p>
              <div style={{ marginTop: 10 }}>
                <Space wrap>
                  {models.map((model) => (
                    <Tag key={model} color="cyan" onClick={() => {
                      copyText(model);
                    }}>
                      {model}
                    </Tag>
                  ))}
                </Space>
              </div>
            </Card>
            {/* <Card
              footer={
                <div>
                  <Typography.Text>Invitation Link</Typography.Text>
                  <Input
                    style={{ marginTop: 10 }}
                    value={affLink}
                    onClick={handleAffLinkClick}
                    readOnly
                  />
                </div>
              }
            >
              <Typography.Title heading={6}>Invitation Info</Typography.Title>
              <div style={{ marginTop: 10 }}>
                <Descriptions row>
                  <Descriptions.Item itemKey="Pending Revenue">
                    <span style={{ color: 'rgba(var(--semi-red-5), 1)' }}>
                      {
                        renderQuota(userState?.user?.aff_quota)
                      }
                    </span>
                    <Button type={'secondary'} onClick={() => setOpenTransfer(true)} size={'small'}
                      style={{ marginLeft: 10 }}>Transfer</Button>
                  </Descriptions.Item>
                  <Descriptions.Item
                    itemKey="Total Revenue">{renderQuota(userState?.user?.aff_history_quota)}</Descriptions.Item>
                  <Descriptions.Item itemKey="Invitations Count">{userState?.user?.aff_count}</Descriptions.Item>
                </Descriptions>
              </div>
            </Card> */}
            <Card>
              <Typography.Title heading={6}>Invitation Link</Typography.Title>
              <Input
                style={{ marginTop: 10 }}
                value={affLink}
                onClick={handleAffLinkClick}
                readOnly
              />
            </Card>
            <Card>
              <Typography.Title heading={6}>Personal Information</Typography.Title>
              <div style={{ marginTop: 20 }}>
                <Typography.Text strong>Email</Typography.Text>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <Input
                      value={userState.user && userState.user.email !== '' ? userState.user.email : 'Not Bound'}
                      readonly={true}
                    ></Input>
                  </div>
                  <div>
                    <Button onClick={() => {
                      setShowEmailBindModal(true);
                    }}>{
                        userState.user && userState.user.email !== '' ? 'Change Binding' : 'Bind Email'
                      }</Button>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>GitHub</Typography.Text>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <Input
                      value={userState.user && userState.user.github_id !== '' ? userState.user.github_id : 'Not Bound'}
                      readonly={true}
                    ></Input>
                  </div>
                  <div>
                    <Button
                      onClick={() => {
                        onGitHubOAuthClicked(status.github_client_id);
                      }}
                      disabled={(userState.user && userState.user.github_id !== '') || !status.github_oauth}
                    >
                      {
                        status.github_oauth ? 'Bind' : 'Not Enabled'
                      }
                    </Button>
                  </div>
                </div>
              </div>

              {/* <div style={{ marginTop: 10 }}>
                <Typography.Text strong>Telegram</Typography.Text>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <Input
                      value={userState.user && userState.user.telegram_id !== '' ? userState.user.telegram_id : 'Not Bound'}
                      readonly={true}
                    ></Input>
                  </div>
                  <div>
                    {status.telegram_oauth ?
                      userState.user.telegram_id !== '' ? <Button disabled={true}>Bound</Button>
                        : <TelegramLoginButton dataAuthUrl="/api/oauth/telegram/bind"
                          botName={status.telegram_bot_name} />
                      : <Button disabled={true}>Not Enabled</Button>
                    }
                  </div>
                </div>
              </div> */}

              <div style={{ marginTop: 10 }}>
                <Space>
                  <Button onClick={generateAccessToken}>Generate System Access Token</Button>
                  <Button onClick={() => {
                    setShowChangePasswordModal(true);
                  }}>Change Password</Button>
                  <Button type={'danger'} onClick={() => {
                    setShowAccountDeleteModal(true);
                  }}>Delete Personal Account</Button>
                </Space>

                {systemToken && (
                  <Input
                    readOnly
                    value={systemToken}
                    onClick={handleSystemTokenClick}
                    style={{ marginTop: '10px' }}
                  />
                )}
              </div>
            </Card>
            <Modal
              onCancel={() => setShowEmailBindModal(false)}
              // onOpen={() => setShowEmailBindModal(true)}
              onOk={bindEmail}
              visible={showEmailBindModal}
              size={'small'}
              centered={true}
              maskClosable={false}
            >
              <Typography.Title heading={6}>Bind Email Address</Typography.Title>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
                <Input
                  fluid
                  placeholder="Enter email address"
                  onChange={(value) => handleInputChange('email', value)}
                  name="email"
                  type="email"
                />
                <Button onClick={sendVerificationCode}
                  disabled={disableButton || loading}>
                  {disableButton ? `Resend (${countdown})` : 'Get Verification Code'}
                </Button>
              </div>
              <div style={{ marginTop: 10 }}>
                <Input
                  fluid
                  placeholder="Verification Code"
                  name="email_verification_code"
                  value={inputs.email_verification_code}
                  onChange={(value) => handleInputChange('email_verification_code', value)}
                />
              </div>
            </Modal>
            <Modal
              onCancel={() => setShowAccountDeleteModal(false)}
              visible={showAccountDeleteModal}
              size={'small'}
              centered={true}
              onOk={deleteAccount}
            >
              <div style={{ marginTop: 20 }}>
                <Banner
                  type="danger"
                  description="You are deleting your own account, all data will be cleared and cannot be recovered"
                  closeIcon={null}
                />
              </div>
              <div style={{ marginTop: 20 }}>
                <Input
                  placeholder={`Enter your account name ${userState?.user?.username} to confirm deletion`}
                  name="self_account_deletion_confirmation"
                  value={inputs.self_account_deletion_confirmation}
                  onChange={(value) => handleInputChange('self_account_deletion_confirmation', value)}
                />
              </div>
            </Modal>
            <Modal
              onCancel={() => setShowChangePasswordModal(false)}
              visible={showChangePasswordModal}
              size={'small'}
              centered={true}
              onOk={changePassword}
            >
              <div style={{ marginTop: 20 }}>
                <Input
                  name="set_new_password"
                  placeholder="New Password"
                  value={inputs.set_new_password}
                  onChange={(value) => handleInputChange('set_new_password', value)}
                />
                <Input
                  style={{ marginTop: 20 }}
                  name="set_new_password_confirmation"
                  placeholder="Confirm New Password"
                  value={inputs.set_new_password_confirmation}
                  onChange={(value) => handleInputChange('set_new_password_confirmation', value)}
                />
              </div>
            </Modal>
          </div>

        </Layout.Content>
      </Layout>
    </div>
  );
};

export default PersonalSetting;
