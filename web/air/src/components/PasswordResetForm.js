import React, { useEffect, useState } from 'react';
import { Button, Form, Grid, Header, Image, Segment } from 'semantic-ui-react';
import { API, showError, showInfo, showSuccess } from '../helpers';

const PasswordResetForm = () => {
  const [inputs, setInputs] = useState({
    email: ''
  });
  const { email } = inputs;

  const [loading, setLoading] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);

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
    return () => clearInterval(countdownInterval);
  }, [disableButton, countdown]);

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs(inputs => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {
    setDisableButton(true);
    if (!email) return;
    setLoading(true);
    const res = await API.get(
      `/api/reset_password?email=${email}`
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess('Password reset email sent successfully, please check your mailbox!');
      setInputs({ ...inputs, email: '' });
    } else {
      showError(message);
    }
    setLoading(false);
  }

  return (
    <Grid textAlign="center" style={{ marginTop: '48px' }}>
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as="h2" color="" textAlign="center">
          <Image src="/logo.png" /> Password Reset
        </Header>
        <Form size="large">
          <Segment>
            <Form.Input
              fluid
              icon="mail"
              iconPosition="left"
              placeholder="Email Address"
              name="email"
              value={email}
              onChange={handleChange}
            />
            <Button
              color="green"
              fluid
              size="large"
              onClick={handleSubmit}
              loading={loading}
              disabled={disableButton}
            >
              {disableButton ? `Retry (${countdown})` : 'Submit'}
            </Button>
          </Segment>
        </Form>
      </Grid.Column>
    </Grid>
  );
};

export default PasswordResetForm;
