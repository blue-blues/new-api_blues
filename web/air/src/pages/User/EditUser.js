import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, isMobile, showError, showSuccess } from '../../helpers';
import { renderQuotaWithPrompt } from '../../helpers/render';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import { Button, Divider, Input, Select, SideSheet, Space, Spin, Typography } from '@douyinfe/semi-ui';

const EditUser = (props) => {
  const userId = props.editingUser.id;
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState({
    username: '',
    display_name: '',
    password: '',
    github_id: '',
    wechat_id: '',
    email: '',
    quota: 0,
    group: 'default'
  });
  const [groupOptions, setGroupOptions] = useState([]);
  const { username, display_name, password, github_id, wechat_id, telegram_id, email, quota, group } =
    inputs;
  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };
  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      setGroupOptions(res.data.data.map((group) => ({
        label: group,
        value: group
      })));
    } catch (error) {
      showError(error.message);
    }
  };
  const navigate = useNavigate();
  const handleCancel = () => {
    props.handleClose();
  };
  const loadUser = async () => {
    setLoading(true);
    let res = undefined;
    if (userId) {
      res = await API.get(`/api/user/${userId}`);
    } else {
      res = await API.get(`/api/user/self`);
    }
    const { success, message, data } = res.data;
    if (success) {
      data.password = '';
      setInputs(data);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser().then();
    if (userId) {
      fetchGroups().then();
    }
  }, [props.editingUser.id]);

  const submit = async () => {
    setLoading(true);
    let res = undefined;
    if (userId) {
      let data = { ...inputs, id: parseInt(userId) };
      if (typeof data.quota === 'string') {
        data.quota = parseInt(data.quota);
      }
      res = await API.put(`/api/user/`, data);
    } else {
      res = await API.put(`/api/user/self`, inputs);
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess('User information updated successfully!');
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  return (
    <>
      <SideSheet
        placement={'right'}
        title={<Title level={3}>{'Edit User'}</Title>}
        headerStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        bodyStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        visible={props.visible}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button theme="solid" size={'large'} onClick={submit}>Submit</Button>
              <Button theme="solid" size={'large'} type={'tertiary'} onClick={handleCancel}>Cancel</Button>
            </Space>
          </div>
        }
        closeIcon={null}
        onCancel={() => handleCancel()}
        width={isMobile() ? '100%' : 600}
      >
        <Spin spinning={loading}>
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Username</Typography.Text>
          </div>
          <Input
            label="Username"
            name="username"
            placeholder={'Please enter new username'}
            onChange={value => handleInputChange('username', value)}
            value={username}
            autoComplete="new-password"
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Password</Typography.Text>
          </div>
          <Input
            label="Password"
            name="password"
            type={'password'}
            placeholder={'Please enter new password, minimum 8 characters'}
            onChange={value => handleInputChange('password', value)}
            value={password}
            autoComplete="new-password"
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Display Name</Typography.Text>
          </div>
          <Input
            label="Display Name"
            name="display_name"
            placeholder={'Please enter new display name'}
            onChange={value => handleInputChange('display_name', value)}
            value={display_name}
            autoComplete="new-password"
          />
          {
            userId && <>
              <div style={{ marginTop: 20 }}>
                <Typography.Text>Group</Typography.Text>
              </div>
              <Select
                placeholder={'Please select group'}
                name="group"
                fluid
                search
                selection
                allowAdditions
                additionLabel={'Please edit group multiplier on system settings page to add new group:'}
                onChange={value => handleInputChange('group', value)}
                value={inputs.group}
                autoComplete="new-password"
                optionList={groupOptions}
              />
              <div style={{ marginTop: 20 }}>
                <Typography.Text>{`Remaining Quota${renderQuotaWithPrompt(quota)}`}</Typography.Text>
              </div>
              <Input
                name="quota"
                placeholder={'Please enter new remaining quota'}
                onChange={value => handleInputChange('quota', value)}
                value={quota}
                type={'number'}
                autoComplete="new-password"
              />
            </>
          }
          <Divider style={{ marginTop: 20 }}>The following information cannot be modified</Divider>
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Bound GitHub Account</Typography.Text>
          </div>
          <Input
            name="github_id"
            value={github_id}
            autoComplete="new-password"
            placeholder="This field is read-only. Users need to bind through the relevant binding button on the personal settings page and cannot be modified directly"
            readonly
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Bound WeChat Account</Typography.Text>
          </div>
          <Input
            name="wechat_id"
            value={wechat_id}
            autoComplete="new-password"
            placeholder="This field is read-only. Users need to bind through the relevant binding button on the personal settings page and cannot be modified directly"
            readonly
          />
          <Input
            name="telegram_id"
            value={telegram_id}
            autoComplete="new-password"
            placeholder="This field is read-only. Users need to bind through the relevant binding button on the personal settings page and cannot be modified directly"
            readonly
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Bound Email Account</Typography.Text>
          </div>
          <Input
            name="email"
            value={email}
            autoComplete="new-password"
            placeholder="This field is read-only. Users need to bind through the relevant binding button on the personal settings page and cannot be modified directly"
            readonly
          />
        </Spin>
      </SideSheet>
    </>
  );
};

export default EditUser;
