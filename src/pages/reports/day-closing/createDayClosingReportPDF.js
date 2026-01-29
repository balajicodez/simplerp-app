import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {convertDenominationsToRecords, safeToLocaleString} from "./utils";

export default function createDayClosingReportPDF({
    closingDate,
    organizationName,
    organizationAddress,
    cashInExpenses,
    cashOutExpenses,
    dayClosingData,
    filteredHandLoans
                                                  }) {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    const spacingBase = 2;
    const pagePadding = 6;
    let currentY = 0;

    /* ================= HEADER ================= */
    doc.setFontSize(28);
    currentY += (doc.getLineHeight() / doc.internal.scaleFactor) + spacingBase; // current font-size + spacing
    doc.text(organizationName || "Organization", centerX, currentY, {align: "center"});


    const orgAddressText = organizationAddress;
    if (orgAddressText) {
        doc.setFontSize(12);
        currentY += (doc.getLineHeight() / doc.internal.scaleFactor) + spacingBase; // current font-size + spacing
        doc.text(orgAddressText, centerX, currentY, {align: "center"});
    }


    currentY += spacingBase * 2; // spacing
    doc.line(pagePadding, currentY, pageWidth - pagePadding, currentY);


    doc.setFontSize(13);
    currentY += (doc.getLineHeight() / doc.internal.scaleFactor) + spacingBase; // current font-size + spacing
    doc.text(
        `Day Closing Report - ${closingDate}`,
        pagePadding,
        currentY
    );
    doc.text(
        `Opening Balance: ${safeToLocaleString(dayClosingData.openingBalance)}`,
        pageWidth - pagePadding,
        currentY,
        {align: "right"}
    );



    /* ================= DAY CLOSING ================= */
    currentY += spacingBase * 4;
    autoTable(doc, {
        startY: currentY,
        head: [["Closing Date", "Description", "Cash In", "Cash Out", "Closing Balance"]],
        body: [[
            closingDate,
            dayClosingData.description || "-",
            safeToLocaleString(dayClosingData.cashIn),
            safeToLocaleString(dayClosingData.cashOut),
            safeToLocaleString(dayClosingData.closingBalance),
        ]],
        theme: "grid",
        styles: {fontSize: 11},
        columnStyles: {
            2: {halign: "right"},
            3: {halign: "right"},
            4: {halign: "right"}
        },
        pageBreak: "auto",
    });



    /* ================= EXPENSES ================= */
    currentY = doc.lastAutoTable.finalY;
    doc.setFontSize(14);
    currentY += (doc.getLineHeight() / doc.internal.scaleFactor) + (spacingBase * 4); // current font-size + spacing
    doc.text("EXPENSES SUMMARY", centerX, currentY, {align: "center"});


    currentY += (spacingBase * 3);

    const colWidth = (pageWidth - (2 * pagePadding) - spacingBase) / 2;

    /* CASH IN */
    autoTable(doc, {
        startY: currentY,
        head: [["Category", "Amount", "Description"]],
        body: cashInExpenses.map((e) => [
            e.expenseSubType || "-",
            safeToLocaleString(e.amount),
            e.description || "General",
        ]),
        tableWidth: colWidth,
        margin: {left: pagePadding},
        styles: {fontSize: 11, overflow: "linebreak"},
        headStyles: {fillColor: [22, 163, 74], textColor: 255},
        columnStyles: {1: {halign: "center"}},
    });

    const cashInEndY = doc.lastAutoTable.finalY;

    /* CASH OUT */
    autoTable(doc, {
        startY: currentY,
        head: [["Category", "Amount", "Description"]],
        body: cashOutExpenses.map((e) => [
            e.expenseSubType || "-",
            safeToLocaleString(e.amount),
            e.description || "General",
        ]),
        tableWidth: colWidth,
        margin: {left: pagePadding + colWidth + (2*spacingBase)},
        styles: {fontSize: 11, overflow: "linebreak"},
        headStyles: {fillColor: [185, 28, 28], textColor: 255},
        columnStyles: {1: {halign: "right"}},
    });

    const cashOutEndY = doc.lastAutoTable.finalY;

    currentY = Math.max(cashInEndY, cashOutEndY);

    /* Hand Loans */
    if (filteredHandLoans.length > 0) {
        doc.setFontSize(14);
        currentY += (doc.getLineHeight() / doc.internal.scaleFactor) + (spacingBase * 4);
        doc.text("HANDLOANS DETAILS", centerX, currentY, {align: "center"});


        let totalLoanAmount = 0;
        let totalRecoveredAmount = 0;
        let totalBalanceAmount = 0;

        filteredHandLoans.forEach((h) => {
            totalLoanAmount += Number(h.loanAmount || 0);
            totalRecoveredAmount += Number(h.recoveredAmount || 0);
            totalBalanceAmount += Number(h.balanceAmount || 0);
        });

        currentY += (spacingBase * 3);
        autoTable(doc, {
            startY: currentY,
            head: [
                [
                    "Loan ID",
                    "Party Name",
                    "Total Amount",
                    "Narration",
                    "Recovered Amount",
                    "Balance Amount",
                ],
            ],
            body: [
                ...filteredHandLoans.map((h) => [
                    h.handLoanNumber,
                    h.partyName,
                    safeToLocaleString(h.loanAmount),
                    h.narration,
                    safeToLocaleString(h.recoveredAmount),
                    safeToLocaleString(h.balanceAmount)
                ]),

                // ✅ TOTAL ROW
                [
                    "TOTAL",
                    "",
                    safeToLocaleString(totalLoanAmount),
                    "",
                    safeToLocaleString(totalRecoveredAmount),
                    safeToLocaleString(totalBalanceAmount),
                ],
            ],
            theme: "grid",
            tableWidth: (pageWidth - (2 * pagePadding)),
            margin: {left: pagePadding},
            styles: {fontSize: 11},
            headStyles: {
                fillColor: [30, 58, 138],
                textColor: 255,
                fontStyle: "bold",
            },
            didParseCell: function (data) {
                // Style TOTAL row
                if (
                    data.row.index === filteredHandLoans.length &&
                    data.section === "body"
                ) {
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fillColor = [243, 244, 246]; // light gray
                }
            },
            columnStyles: {
                2: {halign: "right"},
                3: {halign: "right"},
                4: {halign: "right"},
                5: {halign: "right"}
            },
        });

        currentY = doc.lastAutoTable.finalY;
    }

    doc.setFontSize(14);
    currentY += (doc.getLineHeight() / doc.internal.scaleFactor) + (spacingBase * 4);
    doc.text("CASH DENOMINATION SUMMARY", centerX, currentY, {align: "center"});

    /* ================= DENOMINATION ================= */

    const cashDenominationRecords = convertDenominationsToRecords(dayClosingData);
    const denominationTotal = cashDenominationRecords.reduce((acc, curr) => acc + curr.amount, 0);
    const denominationRows = cashDenominationRecords.map((d) => {
        return [
            d.type === 'coin' ? d.denomination + ' (Coin)' : d.denomination,
            d.goodNotes,
            d.soiledNotes,
            safeToLocaleString(d.amount)
        ];
    });
    if (denominationRows.length > 0) {
        denominationRows.push([
            "TOTAL",
            "",
            "",
            safeToLocaleString(denominationTotal),
        ]);
    }

    currentY += (spacingBase * 3);
    autoTable(doc, {
        startY: currentY,
        head: [["Note", "Good", "Soiled", "Amount"]],
        body: denominationRows,
        theme: "grid",
        styles: {fontSize: 11},
        columnStyles: {3: {halign: "right"}},
        pageBreak: "auto",
    });

    return doc;
}