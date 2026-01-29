import {Card, Statistic} from "antd";
import React from "react";

export default function DayClosingSummaryCards({ reportData }) {
    return <div className={'summary-container'}>
        <Card>
            <Statistic
                size={'small'}
                title="Opening Balance"
                value={reportData.openingBalance}
                precision={2}
                prefix={'₹'}
            />
        </Card>

        <Card>
            <Statistic
                title="Total Cash-In"
                value={reportData.cashIn}
                precision={2}
                prefix={'₹'}
            />
        </Card>

        <Card>
            <Statistic
                styles={{
                    content: {color: 'red'},
                }}
                title={"Total Cash-Out"}
                value={reportData.cashOut}
                precision={2}
                prefix={'₹'}
            />
        </Card>

        <Card>
            <Statistic
                styles={{
                    content: {color: 'green'},
                }}
                title={"Closing Balance"}
                value={reportData.closingBalance}
                precision={2}
                prefix={'₹'}
            />
        </Card>
    </div>
}