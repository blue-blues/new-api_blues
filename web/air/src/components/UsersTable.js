import React, { useEffect, useState } from 'react';
import { API, showError, showSuccess } from '../helpers';
import { Button, Form, Popconfirm, Space, Table, Tag, Tooltip, Dropdown } from '@douyinfe/semi-ui';
import { ITEMS_PER_PAGE } from '../constants';
import { renderGroup, renderNumber, renderQuota } from '../helpers/render';
import AddUser from '../pages/User/AddUser';
import EditUser from '../pages/User/EditUser';

function renderRole(role) {
  switch (role) {
    case 1:
      return <Tag size="large">Regular User</Tag>;
    case 10:
      return <Tag color="yellow" size="large">Administrator</Tag>;
    case 100:
      return <Tag color="orange" size="large">Super Administrator</Tag>;
    default:
      return <Tag color="red" size="large">Unknown Role</Tag>;
  }
}

const UsersTable = () => {
  const columns = [{
    title: 'ID', dataIndex: 'id'
  }, {
    title: 'Username', dataIndex: 'username'
  }, {
    title: 'Group', dataIndex: 'group', render: (text, record, index) => {
      return (<div>
        {renderGroup(text)}
      </div>);
    }
  }, {
    title: 'Statistics', dataIndex: 'info', render: (text, record, index) => {
      return (<div>
        <Space spacing={1}>
          <Tooltip content={'Remaining Quota'}>
            <Tag color="white" size="large">{renderQuota(record.quota)}</Tag>
          </Tooltip>
          <Tooltip content={'Used Quota'}>
            <Tag color="white" size="large">{renderQuota(record.used_quota)}</Tag>
          </Tooltip>
          <Tooltip content={'Request Count'}>
            <Tag color="white" size="large">{renderNumber(record.request_count)}</Tag>
          </Tooltip>
        </Space>
      </div>);
    }
  },
  // {
  //   title: 'Invitation Info', dataIndex: 'invite', render: (text, record, index) => {
  //     return (<div>
  //       <Space spacing={1}>
  //         <Tooltip content={'Invitees Count'}>
  //           <Tag color="white" size="large">{renderNumber(record.aff_count)}</Tag>
  //         </Tooltip>
  //         <Tooltip content={'Total Invitation Revenue'}>
  //           <Tag color="white" size="large">{renderQuota(record.aff_history_quota)}</Tag>
  //         </Tooltip>
  //         <Tooltip content={'Inviter ID'}>
  //           {record.inviter_id === 0 ? <Tag color="white" size="large">None</Tag> :
  //             <Tag color="white" size="large">{record.inviter_id}</Tag>}
  //         </Tooltip>
  //       </Space>
  //     </div>);
  //   }
  // },
  {
    title: 'Role', dataIndex: 'role', render: (text, record, index) => {
      return (<div>
        {renderRole(text)}
      </div>);
    }
  },
  {
    title: 'Status', dataIndex: 'status', render: (text, record, index) => {
      return (<div>
        {renderStatus(text)}
      </div>);
    }
  },
  {
    title: '', dataIndex: 'operate', render: (text, record, index) => (<div>
      <>
        <Popconfirm
          title="Confirm?"
          okType={'warning'}
          onConfirm={() => {
            manageUser(record.username, 'promote', record);
          }}
        >
          <Button theme="light" type="warning" style={{ marginRight: 1 }}>Promote</Button>
        </Popconfirm>
        <Popconfirm
          title="Confirm?"
          okType={'warning'}
          onConfirm={() => {
            manageUser(record.username, 'demote', record);
          }}
        >
          <Button theme="light" type="secondary" style={{ marginRight: 1 }}>Demote</Button>
        </Popconfirm>
        {record.status === 1 ?
          <Button theme="light" type="warning" style={{ marginRight: 1 }} onClick={async () => {
            manageUser(record.username, 'disable', record);
          }}>Disable</Button> :
          <Button theme="light" type="secondary" style={{ marginRight: 1 }} onClick={async () => {
            manageUser(record.username, 'enable', record);
          }} disabled={record.status === 3}>Enable</Button>}
        <Button theme="light" type="tertiary" style={{ marginRight: 1 }} onClick={() => {
          setEditingUser(record);
          setShowEditUser(true);
        }}>Edit</Button>
      </>
      <Popconfirm
        title="Are you sure you want to delete this user?"
        content="Hard delete, this action cannot be undone"
        okType={'danger'}
        position={'left'}
        onConfirm={() => {
          manageUser(record.username, 'delete', record).then(() => {
            removeRecord(record.id);
          });
        }}
      >
        <Button theme="light" type="danger" style={{ marginRight: 1 }}>Delete</Button>
      </Popconfirm>
    </div>)
  }];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [userCount, setUserCount] = useState(ITEMS_PER_PAGE);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState({
    id: undefined
  });
  const [orderBy, setOrderBy] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const setCount = (data) => {
    if (data.length >= (activePage) * ITEMS_PER_PAGE) {
      setUserCount(data.length + 1);
    } else {
      setUserCount(data.length);
    }
  };

  const removeRecord = key => {
    console.log(key);
    let newDataSource = [...users];
    if (key != null) {
      let idx = newDataSource.findIndex(data => data.id === key);

      if (idx > -1) {
        newDataSource.splice(idx, 1);
        setUsers(newDataSource);
      }
    }
  };

  const loadUsers = async (startIdx) => {
    const res = await API.get(`/api/user/?p=${startIdx}&order=${orderBy}`);
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setUsers(data);
        setCount(data);
      } else {
        let newUsers = users;
        newUsers.push(...data);
        setUsers(newUsers);
        setCount(newUsers);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const onPaginationChange = (e, { activePage }) => {
    (async () => {
      if (activePage === Math.ceil(users.length / ITEMS_PER_PAGE) + 1) {
        // In this case we have to load more data and then append them.
        await loadUsers(activePage - 1, orderBy);
      }
      setActivePage(activePage);
    })();
  };

  useEffect(() => {
    loadUsers(0, orderBy)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  }, [orderBy]);

  const manageUser = async (username, action, record) => {
    const res = await API.post('/api/user/manage', {
      username, action
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess('Operation completed successfully!');
      let user = res.data.data;
      let newUsers = [...users];
      if (action === 'delete') {

      } else {
        record.status = user.status;
        record.role = user.role;
      }
      setUsers(newUsers);
    } else {
      showError(message);
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case 1:
        return <Tag size="large">Activated</Tag>;
      case 2:
        return (<Tag size="large" color="red">
          Banned
        </Tag>);
      default:
        return (<Tag size="large" color="grey">
          Unknown Status
        </Tag>);
    }
  };

  const searchUsers = async () => {
    if (searchKeyword === '') {
      // if keyword is blank, load files instead.
      await loadUsers(0);
      setActivePage(1);
      setOrderBy('');
      return;
    }
    setSearching(true);
    const res = await API.get(`/api/user/search?keyword=${searchKeyword}`);
    const { success, message, data } = res.data;
    if (success) {
      setUsers(data);
      setActivePage(1);
    } else {
      showError(message);
    }
    setSearching(false);
  };

  const handleKeywordChange = async (value) => {
    setSearchKeyword(value.trim());
  };

  const sortUser = (key) => {
    if (users.length === 0) return;
    setLoading(true);
    let sortedUsers = [...users];
    sortedUsers.sort((a, b) => {
      return ('' + a[key]).localeCompare(b[key]);
    });
    if (sortedUsers[0].id === users[0].id) {
      sortedUsers.reverse();
    }
    setUsers(sortedUsers);
    setLoading(false);
  };

  const handlePageChange = page => {
    setActivePage(page);
    if (page === Math.ceil(users.length / ITEMS_PER_PAGE) + 1) {
      // In this case we have to load more data and then append them.
      loadUsers(page - 1).then(r => {
      });
    }
  };

  const pageData = users.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

  const closeAddUser = () => {
    setShowAddUser(false);
  };

  const closeEditUser = () => {
    setShowEditUser(false);
    setEditingUser({
      id: undefined
    });
  };

  const refresh = async () => {
    if (searchKeyword === '') {
      await loadUsers(activePage - 1);
    } else {
      await searchUsers();
    }
  };

  const handleOrderByChange = (e, { value }) => {
    setOrderBy(value);
    setActivePage(1);
    setDropdownVisible(false);
  };

  const renderSelectedOption = (orderBy) => {
    switch (orderBy) {
      case 'quota':
        return 'Sort by Remaining Quota';
      case 'used_quota':
        return 'Sort by Used Quota';
      case 'request_count':
        return 'Sort by Request Count';
      default:
        return 'Default Sort';
    }
  };

  return (
    <>
      <AddUser refresh={refresh} visible={showAddUser} handleClose={closeAddUser}></AddUser>
      <EditUser refresh={refresh} visible={showEditUser} handleClose={closeEditUser}
        editingUser={editingUser}></EditUser>
      <Form onSubmit={searchUsers}>
        <Form.Input
          label="Search Keywords"
          icon="search"
          field="keyword"
          iconPosition="left"
          placeholder="Search user ID, username, display name, and email address ..."
          value={searchKeyword}
          loading={searching}
          onChange={value => handleKeywordChange(value)}
        />
      </Form>

      <Table columns={columns} dataSource={pageData} pagination={{
        currentPage: activePage,
        pageSize: ITEMS_PER_PAGE,
        total: userCount,
        pageSizeOpts: [10, 20, 50, 100],
        onPageChange: handlePageChange
      }} loading={loading} />
      <Button theme="light" type="primary" style={{ marginRight: 8 }} onClick={
        () => {
          setShowAddUser(true);
        }
      }>Add User</Button>
      <Dropdown
        trigger="click"
        position="bottomLeft"
        visible={dropdownVisible}
        onVisibleChange={(visible) => setDropdownVisible(visible)}
        render={
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => handleOrderByChange('', { value: '' })}>Default Sort</Dropdown.Item>
            <Dropdown.Item onClick={() => handleOrderByChange('', { value: 'quota' })}>Sort by Remaining Quota</Dropdown.Item>
            <Dropdown.Item onClick={() => handleOrderByChange('', { value: 'used_quota' })}>Sort by Used Quota</Dropdown.Item>
            <Dropdown.Item onClick={() => handleOrderByChange('', { value: 'request_count' })}>Sort by Request Count</Dropdown.Item>
          </Dropdown.Menu>
        }
      >
        <Button style={{ marginLeft: '10px' }}>{renderSelectedOption(orderBy)}</Button>
      </Dropdown>
    </>
  );
};

export default UsersTable;
