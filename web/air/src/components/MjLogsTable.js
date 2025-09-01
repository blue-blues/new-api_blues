import React, { useEffect, useState } from 'react';
import { API, copy, isAdmin, showError, showSuccess, timestamp2string } from '../helpers';

import { Banner, Button, Form, ImagePreview, Layout, Modal, Progress, Table, Tag, Typography } from '@douyinfe/semi-ui';
import { ITEMS_PER_PAGE } from '../constants';


const colors = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo',
  'light-blue', 'lime', 'orange', 'pink',
  'purple', 'red', 'teal', 'violet', 'yellow'
];

function renderType(type) {
  switch (type) {
    case 'IMAGINE':
      return <Tag color="blue" size="large">Drawing</Tag>;
    case 'UPSCALE':
      return <Tag color="orange" size="large">Upscale</Tag>;
    case 'VARIATION':
      return <Tag color="purple" size="large">Variation</Tag>;
    case 'HIGH_VARIATION':
      return <Tag color="purple" size="large">High Variation</Tag>;
    case 'LOW_VARIATION':
      return <Tag color="purple" size="large">Low Variation</Tag>;
    case 'PAN':
      return <Tag color="cyan" size="large">Pan</Tag>;
    case 'DESCRIBE':
      return <Tag color="yellow" size="large">Image to Text</Tag>;
    case 'BLEND':
      return <Tag color="lime" size="large">Blend</Tag>;
    case 'SHORTEN':
      return <Tag color="pink" size="large">Shorten</Tag>;
    case 'REROLL':
      return <Tag color="indigo" size="large">Reroll</Tag>;
    case 'INPAINT':
      return <Tag color="violet" size="large">Inpaint-Submit</Tag>;
    case 'ZOOM':
      return <Tag color="teal" size="large">Zoom</Tag>;
    case 'CUSTOM_ZOOM':
      return <Tag color="teal" size="large">Custom Zoom-Submit</Tag>;
    case 'MODAL':
      return <Tag color="green" size="large">Modal Processing</Tag>;
    case 'SWAP_FACE':
      return <Tag color="light-green" size="large">Face Swap</Tag>;
    default:
      return <Tag color="white" size="large">Unknown</Tag>;
  }
}


function renderCode(code) {
  switch (code) {
    case 1:
      return <Tag color="green" size="large">Submitted</Tag>;
    case 21:
      return <Tag color="lime" size="large">Waiting</Tag>;
    case 22:
      return <Tag color="orange" size="large">Duplicate Submission</Tag>;
    case 0:
      return <Tag color="yellow" size="large">Not Submitted</Tag>;
    default:
      return <Tag color="white" size="large">Unknown</Tag>;
  }
}


function renderStatus(type) {
  // Ensure all cases are string literals by adding quotes.
  switch (type) {
    case 'SUCCESS':
      return <Tag color="green" size="large">Success</Tag>;
    case 'NOT_START':
      return <Tag color="grey" size="large">Not Started</Tag>;
    case 'SUBMITTED':
      return <Tag color="yellow" size="large">In Queue</Tag>;
    case 'IN_PROGRESS':
      return <Tag color="blue" size="large">In Progress</Tag>;
    case 'FAILURE':
      return <Tag color="red" size="large">Failed</Tag>;
    case 'MODAL':
      return <Tag color="yellow" size="large">Modal Waiting</Tag>;
    default:
      return <Tag color="white" size="large">Unknown</Tag>;
  }
}

const renderTimestamp = (timestampInSeconds) => {
  const date = new Date(timestampInSeconds * 1000); // Convert seconds to milliseconds

  const year = date.getFullYear(); // Get year
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // Get month, starting from 0 so need +1, ensure two digits
  const day = ('0' + date.getDate()).slice(-2); // Get date, ensure two digits
  const hours = ('0' + date.getHours()).slice(-2); // Get hours, ensure two digits
  const minutes = ('0' + date.getMinutes()).slice(-2); // Get minutes, ensure two digits
  const seconds = ('0' + date.getSeconds()).slice(-2); // Get seconds, ensure two digits

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // Format output
};


const LogsTable = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const columns = [
    {
      title: 'Submit Time',
      dataIndex: 'submit_time',
      render: (text, record, index) => {
        return (
          <div>
            {renderTimestamp(text / 1000)}
          </div>
        );
      }
    },
    {
      title: 'Channel',
      dataIndex: 'channel_id',
      className: isAdmin() ? 'tableShow' : 'tableHiddle',
      render: (text, record, index) => {
        return (

          <div>
            <Tag color={colors[parseInt(text) % colors.length]} size="large" onClick={() => {
              copyText(text); // Assume copyText is a function for text copying
            }}> {text} </Tag>
          </div>

        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'action',
      render: (text, record, index) => {
        return (
          <div>
            {renderType(text)}
          </div>
        );
      }
    },
    {
      title: 'Task ID',
      dataIndex: 'mj_id',
      render: (text, record, index) => {
        return (
          <div>
            {text}
          </div>
        );
      }
    },
    {
      title: 'Submit Result',
      dataIndex: 'code',
      className: isAdmin() ? 'tableShow' : 'tableHiddle',
      render: (text, record, index) => {
        return (
          <div>
            {renderCode(text)}
          </div>
        );
      }
    },
    {
      title: 'Task Status',
      dataIndex: 'status',
      className: isAdmin() ? 'tableShow' : 'tableHiddle',
      render: (text, record, index) => {
        return (
          <div>
            {renderStatus(text)}
          </div>
        );
      }
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      render: (text, record, index) => {
        return (
          <div>
            {
              // Convert e.g. 100% to number 100, if text is undefined, return 0
              <Progress stroke={record.status === 'FAILURE' ? 'var(--semi-color-warning)' : null}
                        percent={text ? parseInt(text.replace('%', '')) : 0} showInfo={true}
                        aria-label="drawing progress" />
            }
          </div>
        );
      }
    },
    {
      title: 'Result Image',
      dataIndex: 'image_url',
      render: (text, record, index) => {
        if (!text) {
          return 'None';
        }
        return (
          <Button
            onClick={() => {
              setModalImageUrl(text);  // Update image URL state
              setIsModalOpenurl(true);    // Open modal
            }}
          >
            View Image
          </Button>
        );
      }
    },
    {
      title: 'Prompt',
      dataIndex: 'prompt',
      render: (text, record, index) => {
        // If text is undefined, return alternative text, such as empty string '' or others
        if (!text) {
          return 'None';
        }

        return (
          <Typography.Text
            ellipsis={{ showTooltip: true }}
            style={{ width: 100 }}
            onClick={() => {
              setModalContent(text);
              setIsModalOpen(true);
            }}
          >
            {text}
          </Typography.Text>
        );
      }
    },
    {
      title: 'PromptEn',
      dataIndex: 'prompt_en',
      render: (text, record, index) => {
        // If text is undefined, return alternative text, such as empty string '' or others
        if (!text) {
          return 'None';
        }

        return (
          <Typography.Text
            ellipsis={{ showTooltip: true }}
            style={{ width: 100 }}
            onClick={() => {
              setModalContent(text);
              setIsModalOpen(true);
            }}
          >
            {text}
          </Typography.Text>
        );
      }
    },
    {
      title: 'Failure Reason',
      dataIndex: 'fail_reason',
      render: (text, record, index) => {
        // If text is undefined, return alternative text, such as empty string '' or others
        if (!text) {
          return 'None';
        }

        return (
          <Typography.Text
            ellipsis={{ showTooltip: true }}
            style={{ width: 100 }}
            onClick={() => {
              setModalContent(text);
              setIsModalOpen(true);
            }}
          >
            {text}
          </Typography.Text>
        );
      }
    }

  ];

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [logCount, setLogCount] = useState(ITEMS_PER_PAGE);
  const [logType, setLogType] = useState(0);
  const isAdminUser = isAdmin();
  const [isModalOpenurl, setIsModalOpenurl] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // 定义模态框图片URL的状态和更新函数
  const [modalImageUrl, setModalImageUrl] = useState('');
  let now = new Date();
  // Initialize start_timestamp to the previous day
  const [inputs, setInputs] = useState({
    channel_id: '',
    mj_id: '',
    start_timestamp: timestamp2string(now.getTime() / 1000 - 2592000),
    end_timestamp: timestamp2string(now.getTime() / 1000 + 3600)
  });
  const { channel_id, mj_id, start_timestamp, end_timestamp } = inputs;

  const [stat, setStat] = useState({
    quota: 0,
    token: 0
  });

  const handleInputChange = (value, name) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };


  const setLogsFormat = (logs) => {
    for (let i = 0; i < logs.length; i++) {
      logs[i].timestamp2string = timestamp2string(logs[i].created_at);
      logs[i].key = '' + logs[i].id;
    }
    // data.key = '' + data.id
    setLogs(logs);
    setLogCount(logs.length + ITEMS_PER_PAGE);
    // console.log(logCount);
  };

  const loadLogs = async (startIdx) => {
    setLoading(true);

    let url = '';
    let localStartTimestamp = Date.parse(start_timestamp);
    let localEndTimestamp = Date.parse(end_timestamp);
    if (isAdminUser) {
      url = `/api/mj/?p=${startIdx}&channel_id=${channel_id}&mj_id=${mj_id}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`;
    } else {
      url = `/api/mj/self/?p=${startIdx}&mj_id=${mj_id}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`;
    }
    const res = await API.get(url);
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setLogsFormat(data);
      } else {
        let newLogs = [...logs];
        newLogs.splice(startIdx * ITEMS_PER_PAGE, data.length, ...data);
        setLogsFormat(newLogs);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const pageData = logs.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

  const handlePageChange = page => {
    setActivePage(page);
    if (page === Math.ceil(logs.length / ITEMS_PER_PAGE) + 1) {
      // In this case we have to load more data and then append them.
      loadLogs(page - 1).then(r => {
      });
    }
  };

  const refresh = async () => {
    // setLoading(true);
    setActivePage(1);
    await loadLogs(0);
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess('Copied: ' + text);
    } else {
      // setSearchKeyword(text);
      Modal.error({ title: 'Failed to copy to clipboard, please copy manually', content: text });
    }
  };

  useEffect(() => {
    refresh().then();
  }, [logType]);

  useEffect(() => {
    const mjNotifyEnabled = localStorage.getItem('mj_notify_enabled');
    if (mjNotifyEnabled !== 'true') {
      setShowBanner(true);
    }
  }, []);

  return (
    <>

      <Layout>
        {isAdminUser && showBanner ? <Banner
          type="info"
          description="Midjourney callback is currently not enabled, some projects may not receive drawing results, can be enabled in operation settings."
        /> : <></>
        }
        <Form layout="horizontal" style={{ marginTop: 10 }}>
          <>
            <Form.Input field="channel_id" label="Channel ID" style={{ width: 176 }} value={channel_id}
                        placeholder={'Optional value'} name="channel_id"
                        onChange={value => handleInputChange(value, 'channel_id')} />
            <Form.Input field="mj_id" label="Task ID" style={{ width: 176 }} value={mj_id}
                        placeholder="Optional value"
                        name="mj_id"
                        onChange={value => handleInputChange(value, 'mj_id')} />
            <Form.DatePicker field="start_timestamp" label="Start Time" style={{ width: 272 }}
                             initValue={start_timestamp}
                             value={start_timestamp} type="dateTime"
                             name="start_timestamp"
                             onChange={value => handleInputChange(value, 'start_timestamp')} />
            <Form.DatePicker field="end_timestamp" fluid label="End Time" style={{ width: 272 }}
                             initValue={end_timestamp}
                             value={end_timestamp} type="dateTime"
                             name="end_timestamp"
                             onChange={value => handleInputChange(value, 'end_timestamp')} />

            <Form.Section>
              <Button label="Query" type="primary" htmlType="submit" className="btn-margin-right"
                      onClick={refresh}>Query</Button>
            </Form.Section>
          </>
        </Form>
        <Table style={{ marginTop: 5 }} columns={columns} dataSource={pageData} pagination={{
          currentPage: activePage,
          pageSize: ITEMS_PER_PAGE,
          total: logCount,
          pageSizeOpts: [10, 20, 50, 100],
          onPageChange: handlePageChange
        }} loading={loading} />
        <Modal
          visible={isModalOpen}
          onOk={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          closable={null}
          bodyStyle={{ height: '400px', overflow: 'auto' }} // Set modal content area style
          width={800} // Set modal width
        >
          <p style={{ whiteSpace: 'pre-line' }}>{modalContent}</p>
        </Modal>
        <ImagePreview
          src={modalImageUrl}
          visible={isModalOpenurl}
          onVisibleChange={(visible) => setIsModalOpenurl(visible)}
        />

      </Layout>
    </>
  );
};

export default LogsTable;
