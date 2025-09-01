import React from 'react';
import SystemSetting from '../../components/SystemSetting';
import {isRoot} from '../../helpers';
import OtherSetting from '../../components/OtherSetting';
import PersonalSetting from '../../components/PersonalSetting';
import OperationSetting from '../../components/OperationSetting';
import {Layout, TabPane, Tabs} from "@douyinfe/semi-ui";

const Setting = () => {
    let panes = [
        {
            tab: 'Personal Settings',
            content: <PersonalSetting/>,
            itemKey: '1'
        }
    ];

    if (isRoot()) {
        panes.push({
            tab: 'Operation Settings',
            content: <OperationSetting/>,
            itemKey: '2'
        });
        panes.push({
            tab: 'System Settings',
            content: <SystemSetting/>,
            itemKey: '3'
        });
        panes.push({
            tab: 'Other Settings',
            content: <OtherSetting/>,
            itemKey: '4'
        });
    }

    return (
        <div>
            <Layout>
                <Layout.Content>
                    <Tabs type="line" defaultActiveKey="1">
                        {panes.map(pane => (
                            <TabPane itemKey={pane.itemKey} tab={pane.tab}>
                                {pane.content}
                            </TabPane>
                        ))}
                    </Tabs>
                </Layout.Content>
            </Layout>
        </div>
    );
};

export default Setting;
