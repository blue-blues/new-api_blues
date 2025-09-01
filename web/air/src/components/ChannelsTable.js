import React, { useEffect, useState } from 'react';
import { API, isMobile, shouldShowPrompt, showError, showInfo, showSuccess, timestamp2string } from '../helpers';

import { CHANNEL_OPTIONS, ITEMS_PER_PAGE } from '../constants';
import { renderGroup, renderNumberWithPoint, renderQuota } from '../helpers/render';
import {
  Button,
  Dropdown,
  Form,
  InputNumber,
  Popconfirm,
  Space,
  SplitButtonGroup,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography
} from '@douyinfe/semi-ui';
import EditChannel from '../pages/Channel/EditChannel';
import { IconTreeTriangleDown } from '@douyinfe/semi-icons';

function renderTimestamp(timestamp) {
  return (
    <>
      {timestamp2string(timestamp)}
    </>
  );
}

let type2label = undefined;

function renderType(type) {
  if (!type2label) {
    type2label = new Map();
    for (let i = 0; i < CHANNEL_OPTIONS.length; i++) {
      type2label[CHANNEL_OPTIONS[i].value] = CHANNEL_OPTIONS[i];
    }
    type2label[0] = { value: 0, text: 'Unknown Type', color: 'grey' };
  }
  return <Tag size="large" color={type2label[type]?.color}>{type2label[type]?.text}</Tag>;
}

const ChannelsTable = () => {
  const columns = [
    // {
    //     title: '',
    //     dataIndex: 'checkbox',
    //     className: 'checkbox',
    // },
    {
      title: 'ID',
      dataIndex: 'id'
    },
    {
      title: 'Name',
      dataIndex: 'name'
    },
    // {
    //   title: '分组',
    //   dataIndex: 'group',
    //   render: (text, record, index) => {
    //     return (
    //       <div>
    //         <Space spacing={2}>
    //           {
    //             text.split(',').map((item, index) => {
    //               return (renderGroup(item));
    //             })
    //           }
    //         </Space>
    //       </div>
    //     );
    //   }
    // },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (text, record, index) => {
        return (
          <div>
            {renderType(text)}
          </div>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (text, record, index) => {
        return (
          <div>
            {renderStatus(text)}
          </div>
        );
      }
    },
    {
      title: 'Response Time',
      dataIndex: 'response_time',
      render: (text, record, index) => {
        return (
          <div>
            {renderResponseTime(text)}
          </div>
        );
      }
    },
    {
      title: 'Used/Remaining',
      dataIndex: 'expired_time',
      render: (text, record, index) => {
        return (
          <div>
            <Space spacing={1}>
              <Tooltip content={'Used Quota'}>
                <Tag color="white" type="ghost" size="large">{renderQuota(record.used_quota)}</Tag>
              </Tooltip>
              <Tooltip content={'Remaining Balance: ' + record.balance + ', Click to Update'}>
                <Tag color="white" type="ghost" size="large" onClick={() => {
                  updateChannelBalance(record);
                }}>${renderNumberWithPoint(record.balance)}</Tag>
              </Tooltip>
            </Space>
          </div>
        );
      }
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      render: (text, record, index) => {
        return (
          <div>
            <InputNumber
              style={{ width: 70 }}
              name="priority"
              onBlur={e => {
                manageChannel(record.id, 'priority', record, e.target.value);
              }}
              keepFocus={true}
              innerButtons
              defaultValue={record.priority}
              min={-999}
            />
          </div>
        );
      }
    },
    // {
    //   title: '权重',
    //   dataIndex: 'weight',
    //   render: (text, record, index) => {
    //     return (
    //       <div>
    //         <InputNumber
    //           style={{ width: 70 }}
    //           name="weight"
    //           onBlur={e => {
    //             manageChannel(record.id, 'weight', record, e.target.value);
    //           }}
    //           keepFocus={true}
    //           innerButtons
    //           defaultValue={record.weight}
    //           min={0}
    //         />
    //       </div>
    //     );
    //   }
    // },
    {
      title: '',
      dataIndex: 'operate',
      render: (text, record, index) => (
        <div>
          {/* <SplitButtonGroup style={{ marginRight: 1 }} aria-label="测试操作项目组">
            <Button theme="light" onClick={() => {
              testChannel(record, '');
            }}>Test</Button>
            <Dropdown trigger="click" position="bottomRight" menu={record.test_models}
            >
              <Button style={{ padding: '8px 4px' }} type="primary" icon={<IconTreeTriangleDown />}></Button>
            </Dropdown>
          </SplitButtonGroup> */}
          <Button theme='light' type='primary' style={{ marginRight: 1 }} onClick={() => testChannel(record)}>Test</Button>
          <Popconfirm
            title="Are you sure you want to delete this channel?"
            content="This action cannot be undone"
            okType={'danger'}
            position={'left'}
            onConfirm={() => {
              manageChannel(record.id, 'delete', record).then(
                () => {
                  removeRecord(record.id);
                }
              );
            }}
          >
            <Button theme="light" type="danger" style={{ marginRight: 1 }}>Delete</Button>
          </Popconfirm>
          {
            record.status === 1 ?
              <Button theme="light" type="warning" style={{ marginRight: 1 }} onClick={
                async () => {
                  manageChannel(
                    record.id,
                    'disable',
                    record
                  );
                }
              }>Disable</Button> :
              <Button theme="light" type="secondary" style={{ marginRight: 1 }} onClick={
                async () => {
                  manageChannel(
                    record.id,
                    'enable',
                    record
                  );
                }
              }>Enable</Button>
          }
          <Button theme="light" type="tertiary" style={{ marginRight: 1 }} onClick={
            () => {
              setEditingChannel(record);
              setShowEdit(true);
            }
          }>Edit</Button>
        </div>
      )
    }
  ];

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [idSort, setIdSort] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [searching, setSearching] = useState(false);
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [showPrompt, setShowPrompt] = useState(shouldShowPrompt('channel-test'));
  const [channelCount, setChannelCount] = useState(pageSize);
  const [groupOptions, setGroupOptions] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [enableBatchDelete, setEnableBatchDelete] = useState(false);
  const [editingChannel, setEditingChannel] = useState({
    id: undefined
  });
  const [selectedChannels, setSelectedChannels] = useState([]);

  const removeRecord = id => {
    let newDataSource = [...channels];
    if (id != null) {
      let idx = newDataSource.findIndex(data => data.id === id);

      if (idx > -1) {
        newDataSource.splice(idx, 1);
        setChannels(newDataSource);
      }
    }
  };

  const setChannelFormat = (channels) => {
    for (let i = 0; i < channels.length; i++) {
      channels[i].key = '' + channels[i].id;
      let test_models = [];
      channels[i].models.split(',').forEach((item, index) => {
        test_models.push({
          node: 'item',
          name: item,
          onClick: () => {
            testChannel(channels[i], item);
          }
        });
      });
      channels[i].test_models = test_models;
    }
    // data.key = '' + data.id
    setChannels(channels);
    if (channels.length >= pageSize) {
      setChannelCount(channels.length + pageSize);
    } else {
      setChannelCount(channels.length);
    }
  };

  const loadChannels = async (startIdx, pageSize, idSort) => {
    setLoading(true);
    const res = await API.get(`/api/channel/?p=${startIdx}&page_size=${pageSize}&id_sort=${idSort}`);
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setChannelFormat(data);
      } else {
        let newChannels = [...channels];
        newChannels.splice(startIdx * pageSize, data.length, ...data);
        setChannelFormat(newChannels);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const refresh = async () => {
    await loadChannels(activePage - 1, pageSize, idSort);
  };

  useEffect(() => {
    // console.log('default effect')
    const localIdSort = localStorage.getItem('id-sort') === 'true';
    const localPageSize = parseInt(localStorage.getItem('page-size')) || ITEMS_PER_PAGE;
    setIdSort(localIdSort);
    setPageSize(localPageSize);
    loadChannels(0, localPageSize, localIdSort)
      .then()
      .catch((reason) => {
        showError(reason);
      });
    fetchGroups().then();
  }, []);

  const manageChannel = async (id, action, record, value) => {
    let data = { id };
    let res;
    switch (action) {
      case 'delete':
        res = await API.delete(`/api/channel/${id}/`);
        break;
      case 'enable':
        data.status = 1;
        res = await API.put('/api/channel/', data);
        break;
      case 'disable':
        data.status = 2;
        res = await API.put('/api/channel/', data);
        break;
      case 'priority':
        if (value === '') {
          return;
        }
        data.priority = parseInt(value);
        res = await API.put('/api/channel/', data);
        break;
      case 'weight':
        if (value === '') {
          return;
        }
        data.weight = parseInt(value);
        if (data.weight < 0) {
          data.weight = 0;
        }
        res = await API.put('/api/channel/', data);
        break;
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess('Operation completed successfully!');
      let channel = res.data.data;
      let newChannels = [...channels];
      if (action === 'delete') {

      } else {
        record.status = channel.status;
      }
      setChannels(newChannels);
    } else {
      showError(message);
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case 1:
        return <Tag size="large" color="green">Enabled</Tag>;
      case 2:
        return (
          <Tag size="large" color="yellow">
            Disabled
          </Tag>
        );
      case 3:
        return (
          <Tag size="large" color="yellow">
            Auto Disabled
          </Tag>
        );
      default:
        return (
          <Tag size="large" color="grey">
            Unknown Status
          </Tag>
        );
    }
  };

  const renderResponseTime = (responseTime) => {
    let time = responseTime / 1000;
    time = time.toFixed(2) + ' sec';
    if (responseTime === 0) {
      return <Tag size="large" color="grey">Not Tested</Tag>;
    } else if (responseTime <= 1000) {
      return <Tag size="large" color="green">{time}</Tag>;
    } else if (responseTime <= 3000) {
      return <Tag size="large" color="lime">{time}</Tag>;
    } else if (responseTime <= 5000) {
      return <Tag size="large" color="yellow">{time}</Tag>;
    } else {
      return <Tag size="large" color="red">{time}</Tag>;
    }
  };

  const searchChannels = async (searchKeyword, searchGroup, searchModel) => {
    if (searchKeyword === '' && searchGroup === '' && searchModel === '') {
      // if keyword is blank, load files instead.
      await loadChannels(0, pageSize, idSort);
      setActivePage(1);
      return;
    }
    setSearching(true);
    const res = await API.get(`/api/channel/search?keyword=${searchKeyword}&group=${searchGroup}&model=${searchModel}`);
    const { success, message, data } = res.data;
    if (success) {
      setChannels(data);
      setActivePage(1);
    } else {
      showError(message);
    }
    setSearching(false);
  };

  const testChannel = async (record, model) => {
    const res = await API.get(`/api/channel/test/${record.id}?model=${model}`);
    const { success, message, time } = res.data;
    if (success) {
      record.response_time = time * 1000;
      record.test_time = Date.now() / 1000;
      showInfo(`Channel ${record.name} test successful, took ${time.toFixed(2)} seconds.`);
    } else {
      showError(message);
    }
  };

  const testChannels = async (scope) => {
    const res = await API.get(`/api/channel/test?scope=${scope}`);
    const { success, message } = res.data;
    if (success) {
      showInfo('Channel testing started successfully, please refresh the page to view results.');
    } else {
      showError(message);
    }
  };

  const deleteAllDisabledChannels = async () => {
    const res = await API.delete(`/api/channel/disabled`);
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(`Deleted all disabled channels, total: ${data}`);
      await refresh();
    } else {
      showError(message);
    }
  };

  const updateChannelBalance = async (record) => {
    const res = await API.get(`/api/channel/update_balance/${record.id}/`);
    const { success, message, balance } = res.data;
    if (success) {
      record.balance = balance;
      record.balance_updated_time = Date.now() / 1000;
      showInfo(`Channel ${record.name} balance updated successfully!`);
    } else {
      showError(message);
    }
  };

  const updateAllChannelsBalance = async () => {
    setUpdatingBalance(true);
    const res = await API.get(`/api/channel/update_balance`);
    const { success, message } = res.data;
    if (success) {
      showInfo('All enabled channel balances have been updated!');
    } else {
      showError(message);
    }
    setUpdatingBalance(false);
  };

  const batchDeleteChannels = async () => {
    if (selectedChannels.length === 0) {
      showError('Please select channels to delete first!');
      return;
    }
    setLoading(true);
    let ids = [];
    selectedChannels.forEach((channel) => {
      ids.push(channel.id);
    });
    const res = await API.post(`/api/channel/batch`, { ids: ids });
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(`Deleted ${data} channels!`);
      await refresh();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const fixChannelsAbilities = async () => {
    const res = await API.post(`/api/channel/fix`);
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(`Fixed ${data} channels!`);
      await refresh();
    } else {
      showError(message);
    }
  };

  let pageData = channels.slice((activePage - 1) * pageSize, activePage * pageSize);

  const handlePageChange = page => {
    setActivePage(page);
    if (page === Math.ceil(channels.length / pageSize) + 1) {
      // In this case we have to load more data and then append them.
      loadChannels(page - 1, pageSize, idSort).then(r => {
      });
    }
  };

  const handlePageSizeChange = async (size) => {
    localStorage.setItem('page-size', size + '');
    setPageSize(size);
    setActivePage(1);
    loadChannels(0, size, idSort)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  };

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      // add 'all' option
      // res.data.data.unshift('all');
      setGroupOptions(res.data.data.map((group) => ({
        label: group,
        value: group
      })));
    } catch (error) {
      showError(error.message);
    }
  };

  const closeEdit = () => {
    setShowEdit(false);
  };

  const handleRow = (record, index) => {
    if (record.status !== 1) {
      return {
        style: {
          background: 'var(--semi-color-disabled-border)'
        }
      };
    } else {
      return {};
    }
  };


  return (
    <>
      <EditChannel refresh={refresh} visible={showEdit} handleClose={closeEdit} editingChannel={editingChannel} />
      <div style={{ display: "flex", placeItems: "center", justifyContent: "space-between" }}>
        <Form onSubmit={() => {
          searchChannels(searchKeyword, searchGroup, searchModel);
        }} labelPosition="left">
          <div style={{ display: 'flex' }}>
            <Space>
              <Form.Input
                field="search_keyword"
                label="Search"
                placeholder="ID, Name and Key ..."
                value={searchKeyword}
                loading={searching}
                onChange={(v) => {
                  setSearchKeyword(v.trim());
                }}
              />
              {/* <Form.Input
              field="search_model"
              label="Model"
              placeholder="Model Keywords"
              value={searchModel}
              loading={searching}
              onChange={(v) => {
                setSearchModel(v.trim());
              }}
            />
            <Form.Select field="group" label="Group" optionList={groupOptions} onChange={(v) => {
              setSearchGroup(v);
              searchChannels(searchKeyword, v, searchModel);
            }} /> */}
              <Button label="Search" type="primary" htmlType="submit" className="btn-margin-right"
                style={{ marginRight: 8 }}>Search</Button>
            </Space>
          </div>
        </Form>
        <div style={{
          display: isMobile() ? '' : 'flex',
          marginTop: isMobile() ? 0 : -45,
          zIndex: 999,
          position: 'relative',
          pointerEvents: 'none'
        }}>
          <Space style={{ pointerEvents: 'auto', marginTop: isMobile() ? 0 : 45 }}>
            <Button theme="light" type="primary" style={{ marginRight: 8 }} onClick={
              () => {
                setEditingChannel({
                  id: undefined
                });
                setShowEdit(true);
              }
            }>Add New Channel</Button>
            <Popconfirm
              title="Confirm?"
              okType={'warning'}
              onConfirm={() => { testChannels("all") }}
              position={isMobile() ? 'top' : 'left'}
            >
              <Button theme="light" type="warning" style={{ marginRight: 8 }}>Test All Channels</Button>
            </Popconfirm>
            <Popconfirm
              title="Confirm?"
              okType={'warning'}
              onConfirm={() => { testChannels("disabled") }}
              position={isMobile() ? 'top' : 'left'}
            >
              <Button theme="light" type="warning" style={{ marginRight: 8 }}>Test Disabled Channels</Button>
            </Popconfirm>
            {/* <Popconfirm
            title="Confirm?"
            okType={'secondary'}
            onConfirm={updateAllChannelsBalance}
          >
            <Button theme="light" type="secondary" style={{ marginRight: 8 }}>更新所有已启用渠道余额</Button>
          </Popconfirm> */}
            <Popconfirm
              title="Are you sure you want to delete disabled channels?"
              content="This action cannot be undone"
              okType={'danger'}
              onConfirm={deleteAllDisabledChannels}
              position={isMobile() ? 'top' : 'left'}
            >
              <Button theme="light" type="danger" style={{ marginRight: 8 }}>Delete Disabled Channels</Button>
            </Popconfirm>

            <Button theme="light" type="primary" style={{ marginRight: 8 }} onClick={refresh}>Refresh</Button>
          </Space>
          {/*<div style={{width: '100%', pointerEvents: 'none', position: 'absolute'}}>*/}

          {/*</div>*/}
        </div>
        {/* <div style={{ marginTop: 20 }}>
          <Space>
            <Typography.Text strong>Enable Batch Delete</Typography.Text>
            <Switch label="Enable Batch Delete" uncheckedText="Off" aria-label="Whether to enable batch delete" onChange={(v) => {
              setEnableBatchDelete(v);
            }}></Switch>
            <Popconfirm
              title="Are you sure you want to delete selected channels?"
              content="This action cannot be undone"
              okType={'danger'}
              onConfirm={batchDeleteChannels}
              disabled={!enableBatchDelete}
              position={'top'}
            >
              <Button disabled={!enableBatchDelete} theme="light" type="danger"
                style={{ marginRight: 8 }}>Delete Selected Channels</Button>
            </Popconfirm>
            <Popconfirm
              title="Are you sure you want to fix database consistency?"
              content="This operation may cause channel access errors, please use only when database issues occur"
              okType={'warning'}
              onConfirm={fixChannelsAbilities}
              position={'top'}
            >
              <Button theme="light" type="secondary" style={{ marginRight: 8 }}>Fix Database Consistency</Button>
            </Popconfirm>
          </Space>
        </div>
        <div style={{ marginTop: 10, display: 'flex' }}>
          <Space>
            <Space>
              <Typography.Text strong>Sort by ID</Typography.Text>
              <Switch checked={idSort} label="Sort by ID" uncheckedText="Off" aria-label="Whether to sort by ID" onChange={(v) => {
                localStorage.setItem('id-sort', v + '');
                setIdSort(v);
                loadChannels(0, pageSize, v)
                  .then()
                  .catch((reason) => {
                    showError(reason);
                  });
              }}></Switch>
            </Space>
          </Space>
        </div> */}
      </div>
      <Table className={'channel-table'} style={{ marginTop: 15 }} columns={columns} dataSource={pageData} pagination={{
        currentPage: activePage,
        pageSize: pageSize,
        total: channelCount,
        pageSizeOpts: [10, 20, 50, 100],
        showSizeChanger: true,
        formatPageText: (page) => '',
        onPageSizeChange: (size) => {
          handlePageSizeChange(size).then();
        },
        onPageChange: handlePageChange
      }} loading={loading} onRow={handleRow} rowSelection={
        enableBatchDelete ?
          {
            onChange: (selectedRowKeys, selectedRows) => {
              // console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
              setSelectedChannels(selectedRows);
            }
          } : null
      } />
    </>
  );
};

export default ChannelsTable;
