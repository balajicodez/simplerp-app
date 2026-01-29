import {Card, Statistic} from "antd";
import React from "react";

export default function DayClosingSummaryCardsSection({ openingBalance, cashIn, cashOut, closingBalance }) {
    return <div className={'summary-container'}>
        <Card>
            <Statistic
                size={'small'}
                title="Opening Balance"
                value={openingBalance}
                precision={2}
                prefix={'₹'}
            />
        </Card>

        <Card>
            <Statistic
                title="Total Cash-In"
                value={cashIn}
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
                value={cashOut}
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
                value={closingBalance}
                precision={2}
                prefix={'₹'}
            />
        </Card>
    </div>
}