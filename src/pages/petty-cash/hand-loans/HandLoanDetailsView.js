// Loan Details Modal Component
import {Card, Descriptions, Empty, Tag, Typography} from "antd";
import {DATE_DISPLAY_FORMAT} from "../../../constants";
import {formatCurrency} from "../../../_utils/CommonUtils";
import React from "react";
import {getHomeLoadStatus} from "./homeLoanUtils";



export default function HandLoanDetailsView({loan, recoveredLoans}) {

    const statusRecord = getHomeLoadStatus(loan.status);

    // Calculate total recovered from all recovery transactions
    const totalRecovered = recoveredLoans.reduce((sum, recovery) => sum + (recovery.loanAmount || 0), 0);

    return (
        <>
            <Descriptions bordered size={'small'}>
                <Descriptions.Item
                    label="Loan ID">{loan.handLoanNumber || `HL${String(loan.id).padStart(4, '0')}`}</Descriptions.Item>
                <Descriptions.Item
                    label="Loan Date">{loan.createdDate.format(DATE_DISPLAY_FORMAT)}</Descriptions.Item>

                <Descriptions.Item label="Branch">{loan.organization?.name || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Party Name">{loan.partyName}</Descriptions.Item>
                <Descriptions.Item label="Phone" span={2}>{loan.phoneNo || 'N/A'}</Descriptions.Item>

                <Descriptions.Item label="Status"><Tag color={statusRecord.color}
                                                       variant={'solid'}>{statusRecord.label || 'N/A'}</Tag></Descriptions.Item>
                <Descriptions.Item label="Loan Amount">{formatCurrency(loan.loanAmount)}</Descriptions.Item>
                <Descriptions.Item label="Pending Balance" styles={{
                    content: {color: 'red'},
                }}>{formatCurrency(loan.balanceAmount)}</Descriptions.Item>


                {(() => {
                    if (loan.narration) return <Descriptions.Item label="Notes"
                                                                          span={3}>{loan.narration}</Descriptions.Item>;
                    return null;
                })()}

            </Descriptions>

            <Typography.Title level={5}>
                Recovery Transactions
            </Typography.Title>
            <Typography.Paragraph>Total
                Recovered: <strong>{formatCurrency(totalRecovered)}</strong> across {recoveredLoans.length} transactions</Typography.Paragraph>

            {(() => {
                if (recoveredLoans.length > 0) return <div>
                    {
                        recoveredLoans.map((recovery, index) => (
                            <Card type="inner" title={`Recovery for ${recovery.handLoanNumber}`}>


                                <Descriptions>
                                    <Descriptions.Item
                                        label="Recovery Date">{recovery.createdDate?.format(DATE_DISPLAY_FORMAT)}</Descriptions.Item>
                                    <Descriptions.Item label="Recovery Amount" styles={{
                                        content: {color: 'green'}
                                    }}>{formatCurrency(recovery.loanAmount)}</Descriptions.Item>
                                </Descriptions>
                            </Card>))
                    }
                </div>;
                return <Empty description={<span>No recovery transactions found</span>}></Empty>;
            })()}
        </>
    );
};