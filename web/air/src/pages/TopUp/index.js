import React, {useEffect, useState} from 'react';
import {API, isMobile, showError, showInfo, showSuccess} from '../../helpers';
import {renderNumber, renderQuota} from '../../helpers/render';
import {Col, Layout, Row, Typography, Card, Button, Form, Divider, Space, Modal} from "@douyinfe/semi-ui";
import Title from "@douyinfe/semi-ui/lib/es/typography/title";
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import { Link } from 'react-router-dom';

const TopUp = () => {
    const [redemptionCode, setRedemptionCode] = useState('');
    const [topUpCode, setTopUpCode] = useState('');
    const [topUpCount, setTopUpCount] = useState(10);
    const [minTopupCount, setMinTopUpCount] = useState(1);
    const [amount, setAmount] = useState(0.0);
    const [minTopUp, setMinTopUp] = useState(1);
    const [topUpLink, setTopUpLink] = useState('');
    const [enableOnlineTopUp, setEnableOnlineTopUp] = useState(false);
    const [userQuota, setUserQuota] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);
    const [payWay, setPayWay] = useState('');

    const topUp = async () => {
        if (redemptionCode === '') {
            showInfo('Please enter redemption code!')
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await API.post('/api/user/topup', {
                key: redemptionCode
            });
            const {success, message, data} = res.data;
            if (success) {
                showSuccess('Redemption successful!');
                Modal.success({title: 'Redemption Successful!', content: 'Successfully redeemed quota: ' + renderQuota(data), centered: true});
                setUserQuota((quota) => {
                    return quota + data;
                });
                setRedemptionCode('');
            } else {
                showError(message);
            }
        } catch (err) {
            showError('Request failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openTopUpLink = () => {
        if (!topUpLink) {
            showError('Super administrator has not set up top-up link!');
            return;
        }
        window.open(topUpLink, '_blank');
    };

    const preTopUp = async (payment) => {
        if (!enableOnlineTopUp) {
            showError('Administrator has not enabled online top-up!');
            return;
        }
        if (amount === 0) {
            await getAmount();
        }
        if (topUpCount < minTopUp) {
            showInfo('Top-up amount cannot be less than ' + minTopUp);
            return;
        }
        setPayWay(payment)
        setOpen(true);
    }

    const onlineTopUp = async () => {
        if (amount === 0) {
            await getAmount();
        }
        if (topUpCount < minTopUp) {
            showInfo('Top-up amount cannot be less than ' + minTopUp);
            return;
        }
        setOpen(false);
        try {
            const res = await API.post('/api/user/pay', {
                amount: parseInt(topUpCount),
                top_up_code: topUpCode,
                payment_method: payWay
            });
            if (res !== undefined) {
                const {message, data} = res.data;
                // showInfo(message);
                if (message === 'success') {

                    let params = data
                    let url = res.data.url
                    let form = document.createElement('form')
                    form.action = url
                    form.method = 'POST'
                    // Check if it's Safari browser
                    let isSafari = navigator.userAgent.indexOf("Safari") > -1 && navigator.userAgent.indexOf("Chrome") < 1;
                    if (!isSafari) {
                        form.target = '_blank'
                    }
                    for (let key in params) {
                        let input = document.createElement('input')
                        input.type = 'hidden'
                        input.name = key
                        input.value = params[key]
                        form.appendChild(input)
                    }
                    document.body.appendChild(form)
                    form.submit()
                    document.body.removeChild(form)
                } else {
                    showError(data);
                    // setTopUpCount(parseInt(res.data.count));
                    // setAmount(parseInt(data));
                }
            } else {
                showError(res);
            }
        } catch (err) {
            console.log(err);
        } finally {
        }
    }

    const getUserQuota = async () => {
        let res = await API.get(`/api/user/self`);
        const {success, message, data} = res.data;
        if (success) {
            setUserQuota(data.quota);
        } else {
            showError(message);
        }
    }

    useEffect(() => {
        let status = localStorage.getItem('status');
        if (status) {
            status = JSON.parse(status);
            if (status.top_up_link) {
                setTopUpLink(status.top_up_link);
            }
            if (status.min_topup) {
                setMinTopUp(status.min_topup);
            }
            if (status.enable_online_topup) {
                setEnableOnlineTopUp(status.enable_online_topup);
            }
        }
        getUserQuota().then();
    }, []);

    const renderAmount = () => {
        // console.log(amount);
        return amount + ' CNY';
    }

    const getAmount = async (value) => {
        if (value === undefined) {
            value = topUpCount;
        }
        try {
            const res = await API.post('/api/user/amount', {
                amount: parseFloat(value),
                top_up_code: topUpCode
            });
            if (res !== undefined) {
                const {message, data} = res.data;
                // showInfo(message);
                if (message === 'success') {
                    setAmount(parseFloat(data));
                } else {
                    showError(data);
                    // setTopUpCount(parseInt(res.data.count));
                    // setAmount(parseInt(data));
                }
            } else {
                showError(res);
            }
        } catch (err) {
            console.log(err);
        } finally {
        }
    }

    const handleCancel = () => {
        setOpen(false);
    }

    return (
        <div>
            <Layout>
                <Layout.Header>
                    <h3>Top Up Quota</h3>
                </Layout.Header>
                <Layout.Content>
                    <Modal
                        title="Are you sure you want to top up?"
                        visible={open}
                        onOk={onlineTopUp}
                        onCancel={handleCancel}
                        maskClosable={false}
                        size={'small'}
                        centered={true}
                    >
                        <p>Top-up amount: {topUpCount}$</p>
                        <p>Actual payment: {renderAmount()}</p>
                        <p>Confirm top-up?</p>
                    </Modal>
                    <div style={{marginTop: 20, display: 'flex', justifyContent: 'center'}}>
                        <Card
                            style={{width: '500px', padding: '20px'}}
                        >
                            <Title level={3} style={{textAlign: 'center'}}>Balance {renderQuota(userQuota)}</Title>
                            <div style={{marginTop: 20}}>
                                <Divider>
                                    Redeem Balance
                                </Divider>
                                <Form>
                                    <Form.Input
                                        field={'redemptionCode'}
                                        label={'Redemption Code'}
                                        placeholder='Redemption Code'
                                        name='redemptionCode'
                                        value={redemptionCode}
                                        onChange={(value) => {
                                            setRedemptionCode(value);
                                        }}
                                    />
                                    <Space>
                                        {
                                            topUpLink ?
                                                <Button type={'primary'} theme={'solid'} onClick={openTopUpLink}>
                                                    Get Redemption Code
                                                </Button> : null
                                        }
                                        <Button type={"warning"} theme={'solid'} onClick={topUp}
                                                disabled={isSubmitting}>
                                            {isSubmitting ? 'Redeeming...' : 'Redeem'}
                                        </Button>
                                    </Space>
                                </Form>
                            </div>
                            {/* <div style={{marginTop: 20}}>
                                <Divider>
                                    Online Top-up
                                </Divider>
                                <Form>
                                    <Form.Input
                                        disabled={!enableOnlineTopUp}
                                        field={'redemptionCount'}
                                        label={'Actual payment: ' + renderAmount()}
                                        placeholder={'Top-up amount, minimum ' + minTopUp + '$'}
                                        name='redemptionCount'
                                        type={'number'}
                                        value={topUpCount}
                                        suffix={'$'}
                                        min={minTopUp}
                                        defaultValue={minTopUp}
                                        max={100000}
                                        onChange={async (value) => {
                                            if (value < 1) {
                                                value = 1;
                                            }
                                            if (value > 100000) {
                                                value = 100000;
                                            }
                                            setTopUpCount(value);
                                            await getAmount(value);
                                        }}
                                    />
                                    <Space>
                                        <Button type={'primary'} theme={'solid'} onClick={
                                            async () => {
                                                preTopUp('zfb')
                                            }
                                        }>
                                            Alipay
                                        </Button>
                                        <Button style={{backgroundColor: 'rgba(var(--semi-green-5), 1)'}}
                                                type={'primary'}
                                                theme={'solid'} onClick={
                                            async () => {
                                                preTopUp('wx')
                                            }
                                        }>
                                            WeChat
                                        </Button>
                                    </Space>
                                </Form>
                            </div> */}
                            {/*<div style={{ display: 'flex', justifyContent: 'right' }}>*/}
                            {/*    <Text>*/}
                            {/*        <Link onClick={*/}
                            {/*            async () => {*/}
                            {/*                window.location.href = '/topup/history'*/}
                            {/*            }*/}
                            {/*        }>Top-up History</Link>*/}
                            {/*    </Text>*/}
                            {/*</div>*/}
                        </Card>
                    </div>

                </Layout.Content>
            </Layout>
        </div>

    );
};

export default TopUp;