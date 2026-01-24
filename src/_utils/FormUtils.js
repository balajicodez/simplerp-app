import {ArrowLeftOutlined, ArrowRightOutlined, ExclamationCircleFilled} from "@ant-design/icons";
import React from "react";
import {Button} from "antd";

export default class FormUtils {

    static LIST_DEFAULT_PAGE_SIZE = 10;

    constructor(app) {
        const {notification, modal} = app;
        this._notification = notification;
        this._modal = modal;
    }

    showSuccessNotification(message) {
        this._notification.success({
            message: message,
            placement: 'top',
        });
    }

    showErrorNotification(title, description) {
        this._notification.error({
            title: title,
            description: description,
            placement: 'top',
        });
    }

    async confirmDelete(content) {
        return this._modal.confirm({
            icon: <ExclamationCircleFilled/>,
            title: 'Delete',
            content: content,
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
        });
    }

    static searchListByFields(list, fieldNames, searchTerm) {
        if (!searchTerm) return list;
        return list.filter(item => fieldNames.some(fieldName => item[fieldName]?.toLowerCase().includes(searchTerm.toLowerCase())));
    }


    static listPaginationItemRender(_, type, originalElement) {
        if (type === 'next') {
            return (
                <Button type="default" icon={<ArrowRightOutlined />} iconPlacement="end">
                    Next
                </Button>
            );
        }
        if (type === 'prev') {
            return (
                <Button type="default" icon={<ArrowLeftOutlined />}>
                    Previous
                </Button>
            );
        }
        return originalElement;
    }

    static listPaginationShowTotal(total, range) {
        return `${range[0]}-${range[1]} of ${total} items`
    }
}