import React, { useEffect, useState } from 'react';
import { Button, Form, Grid, Header, Image, Message, Segment } from 'semantic-ui-react';
import { Link, useNavigate } from 'react-router-dom';
import { API, getLogo, showError, showInfo, showSuccess } from '../helpers';

const RegisterForm = () => {
  const [inputs, setInputs] = useState({
    username: '',
    password: '',
    password2: '',
    email: '',
    verification_code: ''
  });
  const { username, password, password2 } = inputs;
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const logo = getLogo();
  let affCode = new URLSearchParams(window.location.search).get('aff');
  if (affCode) {
    localStorage.setItem('aff', affCode);
  }
  
  // Extract source parameter from URL
  const source = new URLSearchParams(window.location.search).get('source');

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setShowEmailVerification(status.email_verification);
    }
  });

  let navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    console.log(name, value);
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {
    if (password.length < 8) {
      showInfo('Password must be at least 8 characters long!');
      return;
    }
    if (password !== password2) {
      showInfo('Passwords do not match');
      return;
    }
    if (username && password) {
      setLoading(true);
      if (!affCode) {
        affCode = localStorage.getItem('aff');
      }
      inputs.aff_code = affCode;
      const res = await API.post(
        `/api/user/register${source ? `?source=${source}` : ''}`,
        inputs
      );
      const { success, message } = res.data;
      if (success) {
        // VSCode-specific handling
        if (source === 'vscode') {
          // VSCode-specific success handling - could add custom messaging or behavior
          showSuccess('VSCode integration registration successful!');
        } else {
          showSuccess('Registration successful!');
        }
        navigate('/login');
      } else {
        showError(message);
      }
      setLoading(false);
    }
  }

  const sendVerificationCode = async () => {
    if (inputs.email === '') return;
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

  return (
    <Grid textAlign="center" style={{ marginTop: '48px' }}>
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as="h2" color="" textAlign="center">
          <Image src={logo} /> New User Registration
        </Header>
        <Form size="large">
          <Segment>
            <Form.Input
              fluid
              icon="user"
              iconPosition="left"
              placeholder="Enter username, maximum 12 characters"
              onChange={handleChange}
              name="username"
            />
            <Form.Input
              fluid
              icon="lock"
              iconPosition="left"
              placeholder="Enter password, minimum 8 characters, maximum 20 characters"
              onChange={handleChange}
              name="password"
              type="password"
            />
            <Form.Input
              fluid
              icon="lock"
              iconPosition="left"
              placeholder="Confirm password, minimum 8 characters, maximum 20 characters"
              onChange={handleChange}
              name="password2"
              type="password"
            />
            {showEmailVerification ? (
              <>
                <Form.Input
                  fluid
                  icon="mail"
                  iconPosition="left"
                  placeholder="Enter email address"
                  onChange={handleChange}
                  name="email"
                  type="email"
                  action={
                    <Button onClick={sendVerificationCode} disabled={loading}>
                      Get Verification Code
                    </Button>
                  }
                />
                <Form.Input
                  fluid
                  icon="lock"
                  iconPosition="left"
                  placeholder="Enter verification code"
                  onChange={handleChange}
                  name="verification_code"
                />
              </>
            ) : (
              <></>
            )}
            <Button
              color="green"
              fluid
              size="large"
              onClick={handleSubmit}
              loading={loading}
            >
              Register
            </Button>
          </Segment>
        </Form>
        <Message>
          Already have an account?
          <Link to="/login" className="btn btn-link">
            Click to Login
          </Link>
        </Message>
      </Grid.Column>
    </Grid>
  );
};

export default RegisterForm;
