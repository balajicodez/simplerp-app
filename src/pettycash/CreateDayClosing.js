import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Sidebar from "../Sidebar";
import PageCard from "../components/PageCard";
import "./CreateDayClosing.css";
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import { DAY_CLOSING_WHATSAPP_NUMBERS_CSV } from "../constants.js";
import { useNavigate } from "react-router-dom";
import Utils from "../Utils";

function CreateDayClosing() {
  const [description, setDescription] = useState("Day Closing");
  const [records, setRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [handloans, setHandloans] = useState([]);
  const [comment, setComment] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [reportMsg, setReportMsg] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  // const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [inward, setInward] = useState("");
  const [outward, setOutward] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  // Simplified denomination state
  const [selectedDenomination, setSelectedDenomination] = useState("");
  const [goodCount, setGoodCount] = useState("");
  const [badCount, setBadCount] = useState("");
  const [denominationEntries, setDenominationEntries] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [balanceError, setBalanceError] = useState("");
  const navigate = useNavigate();

  const currentUser =
    localStorage.getItem("username") || localStorage.getItem("user") || "";
  const createdTime = new Date().toISOString();
  const [fileUploads, setFileUploads] = useState([]); // State for dynamic file uploads
  const [fileDescription, setFileDescription] = useState([]);
  const isAdminRole = Utils.isRoleApplicable("ADMIN");

  // Handle file input change
  const handleFileChange = (index, event) => {
    const updatedFiles = [...fileUploads];
    updatedFiles[index] = event.target.files[0]; // Store the selected file
    setFileUploads(updatedFiles);
  };

  // Handle file description change
  const handleFileDescriptionChange = (index, desc) => {
    const description = [...fileDescription];
    description[index] = desc; // Store the selected file
    setFileDescription(description);
  };

  // Add a new file upload input
  const addFileUpload = () => {
    setFileUploads([...fileUploads, null]); // Add an empty file slot to the array
  };

  // Remove a file upload input
  const removeFileUpload = (index) => {
    const updatedFiles = fileUploads.filter((_, i) => i !== index); // Remove the file input by index
    const updatedDescriptions = fileDescription.filter((_, i) => i !== index);
    setFileDescription(updatedDescriptions);
    setFileUploads(updatedFiles);
  };

  const currentPage = 0;
  const pageSize = 1000;

  const getOrganizationAddressText = () => {
    if (!selectedOrganization?.address) return "";

    const { address, city, pincode } = selectedOrganization.address;

    return [address, city, pincode].filter(Boolean).join(", ");
  };

  const calculateCoinsTotal = () => {
    return (
      (Number(records._1CoinCount) || 0) * 1 +
      (Number(records._5CoinCount) || 0) * 5 +
      (Number(records._10CoinCount) || 0) * 10 +
      (Number(records._20CoinCount) || 0) * 20
    );
  };

  const ensurePageSpace = (doc, y, requiredSpace = 40) => {
    const pageHeight = doc.internal.pageSize.height;
    if (y + requiredSpace > pageHeight - 20) {
      doc.addPage();
      return 20;
    }
    return y;
  };

  const formatDateDDMMYYYY = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "-";

    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  // Safe number formatting function
  const safeToLocaleString = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0.00";
    }
    return Number(value).toFixed(2).toLocaleString();
  };

  const getExpensesForDate = (expensesList, date) => {
    return expensesList.filter((expense) => {
      if (!expense.createdDate && !expense.transactionDate) return false;

      const expenseDateStr = expense.createdDate || expense.transactionDate;
      if (!expenseDateStr) return false;

      try {
        const expenseDate = new Date(expenseDateStr)
          .toISOString()
          .split("T")[0];
        return expenseDate === date;
      } catch (error) {
        console.warn("Invalid date format for expense:", expenseDateStr);
        return false;
      }
    });
  };

  const getIssuedAndPartialLoansByOrg = (handloansData) => {
    if (!organizationId) return [];

    const loanMap = new Map();

    handloansData.forEach((h) => {
      // 🔥 FILTER BY ORGANIZATION
      const loanOrgId =
        h.organizationId ||
        h.organization?.id ||
        h.organization?._links?.self?.href?.split("/").pop();

      if (String(loanOrgId) !== String(organizationId)) return;

      if (!h.handLoanNumber) return;

      const loanAmount = Number(h.loanAmount) || 0;
      const balanceAmount = Number(h.balanceAmount) || 0;
      const recoveredAmount = loanAmount - balanceAmount;

      // ❌ Remove fully recovered loans
      if (balanceAmount === 0) return;

      if (!loanMap.has(h.handLoanNumber)) {
        loanMap.set(h.handLoanNumber, {
          handLoanNumber: h.handLoanNumber,
          partyName: h.partyName || "N/A",
          loanAmount,
          recoveredAmount,
          balanceAmount,
        });
      } else {
        const existing = loanMap.get(h.handLoanNumber);
        existing.balanceAmount = balanceAmount;
        existing.recoveredAmount = loanAmount - balanceAmount;
      }
    });

    return Array.from(loanMap.values()).map((l) => ({
      ...l,
      status: l.recoveredAmount > 0 ? "PARTIALLY RECOVERED" : "ISSUED",
    }));
  };

  const getAllHandloansWithBalances = () => {
    return handloans.map((h) => {
      const loanAmount = Number(h.loanAmount) || 0;
      const balanceAmount = Number(h.balanceAmount) || 0;
      const recoveredAmount = loanAmount - balanceAmount;

      let status = "ISSUED";
      if (balanceAmount === 0 && loanAmount > 0) status = "RECOVERED";
      else if (recoveredAmount > 0 && balanceAmount > 0)
        status = "PARTIALLY RECOVERED";

      return {
        handLoanNumber: h.handLoanNumber || "N/A",
        partyName: h.partyName || "N/A",
        loanAmount,
        recoveredAmount,
        balanceAmount,
        status,
      };
    });
  };
  const categorizeExpenses = (expensesList) => {
    const cashInExpenses = expensesList.filter(
      (expense) => expense.expenseType === "CASH-IN"
    );
    const cashOutExpenses = expensesList.filter(
      (expense) => expense.expenseType === "CASH-OUT"
    );

    return { cashInExpenses, cashOutExpenses };
  };
  const handleGenerateReport = async () => {
    try {
      debugger;
      const bearerToken = localStorage.getItem("token");
      const response = await fetch(
        `${APP_SERVER_URL_PREFIX}/pettyCashDayClosings/search/findByClosingDateAndOrganizationId?closingDate=${date}&organizationId=${organizationId}`,
        {
          headers: { Authorization: `Bearer ${bearerToken}` },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      setRecords(data);

      const expensesResponse = await fetch(
        `${APP_SERVER_URL_PREFIX}/expenses/report?organizationId=${organizationId}&createdDate=${date}`,
        { headers: { Authorization: `Bearer ${bearerToken}` } }
      );
      var expensesData = {};
      if (expensesResponse.ok) {
        expensesData = await expensesResponse.json();
        setExpenses(expensesData.content || expensesData || []);
      } else {
        setExpenses([]);
      }

      // Handloans
      const handloansResponse = await fetch(
        `${APP_SERVER_URL_PREFIX}/handloans/all?page=${currentPage}&size=${pageSize}`,
        { headers: { Authorization: `Bearer ${bearerToken}` } }
      );

      var handloansData = [];
      if (handloansResponse.ok) {
        handloansData = await handloansResponse.json();
        setHandloans(handloansData.content || handloansData || []);
      } else {
        setHandloans([]);
      }

      const filteredRecords = new Array(data);
      const filteredExpenses = getExpensesForDate(expensesData, date);

      // ✅ ALL HANDLOANS (NO DATE FILTER)
      //const filteredHandloans = getAllHandloansWithBalances();
      //const filteredHandloans = getIssuedAndPartialLoans();
      const filteredHandloans = getIssuedAndPartialLoansByOrg(handloansData.content);

      const { cashInExpenses, cashOutExpenses } =
        categorizeExpenses(filteredExpenses);

      if (
        filteredRecords.length === 0 &&
        filteredExpenses.length === 0 &&
        filteredHandloans.length === 0
      ) {
        setReportMsg("No records found");
        return;
      }

      const doc = new jsPDF();
      const selectedRecord = filteredRecords[0];
      const startingBalance = Number(selectedRecord?.openingBalance) || 0;

      /* ================= HEADER ================= */
      doc.setFontSize(26);
      const orgName = selectedOrganization?.name || "Organization";

      doc.text(orgName, 105, 18, { align: "center" });

      const orgAddressText = getOrganizationAddressText();
      doc.setFontSize(13);
      if (orgAddressText) {
        doc.text(orgAddressText, 105, 26, { align: "center" });
      }

      doc.line(20, 32, 190, 32);

      doc.setFontSize(14);
      const formattedDate = new Date(date).toLocaleDateString("en-GB"); // dd/mm/yyyy

      doc.text(
        `Day Closing Report - ${formattedDate.replaceAll("/", "-")}`,
        14,
        40
      );

      doc.setFontSize(13);
      doc.text(
        `Opening Balance: ${safeToLocaleString(startingBalance)}`,
        190,
        40,
        { align: "right" }
      );

      let currentY = 48;

      /* ================= DAY CLOSING ================= */
      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "Closing Date",
            "Description",
            "Cash In",
            "Cash Out",
            "Closing Balance",
          ],
        ],
        body: filteredRecords.map(() => [
          formatDateDDMMYYYY(data.closingDate),
          data.description || "-",
          safeToLocaleString(data.cashIn),
          safeToLocaleString(data.cashOut),
          safeToLocaleString(
            data.openingBalance + data.cashIn - data.cashOut
          ),
        ]),
        theme: "grid",
        styles: { fontSize: 11 },
        columnStyles: {
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
        },
        pageBreak: "auto",
      });

      currentY = doc.lastAutoTable.finalY + 12;

      /* ================= EXPENSES ================= */
      doc.setFontSize(14);
      doc.text("EXPENSES SUMMARY", 105, currentY, { align: "center" });
      currentY += 10;

      currentY = ensurePageSpace(doc, currentY, 60);

      const pageWidth = doc.internal.pageSize.width;
      const margin = 10;
      const colWidth = (pageWidth - 2.2 * margin) / 2;

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
        margin: { left: margin },
        styles: { fontSize: 11, overflow: "linebreak" },
        headStyles: { fillColor: [22, 163, 74], textColor: 255 },
        columnStyles: { 1: { halign: "right" } },
      });

      /* capture Y */
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
        margin: { left: margin + colWidth + margin },
        styles: { fontSize: 11, overflow: "linebreak" },
        headStyles: { fillColor: [185, 28, 28], textColor: 255 },
        columnStyles: { 1: { halign: "right" } },
      });

      currentY = doc.lastAutoTable.finalY + 20;
      const cashOutEndY = doc.lastAutoTable.finalY;

      currentY = Math.max(cashInEndY, cashOutEndY) + 25;
      if (filteredHandloans.length > 0) {
        doc.setFontSize(14);
        doc.text("HANDLOANS DETAILS", 105, currentY, { align: "center" });
        currentY += 8;
        let totalLoanAmount = 0;
        let totalRecoveredAmount = 0;
        let totalBalanceAmount = 0;

        filteredHandloans.forEach((h) => {
          totalLoanAmount += Number(h.loanAmount || 0);
          totalRecoveredAmount += Number(h.recoveredAmount || 0);
          totalBalanceAmount += Number(h.balanceAmount || 0);
        });

        autoTable(doc, {
          startY: currentY,
          head: [
            [
              "Loan ID",
              "Party Name",
              "Total Amount",
              "Recovered Amount",
              "Balance Amount",
            ],
          ],
          body: [
            ...filteredHandloans.map((h) => [
              h.handLoanNumber,
              h.partyName,
              safeToLocaleString(h.loanAmount),
              safeToLocaleString(h.recoveredAmount),
              safeToLocaleString(h.balanceAmount),
            ]),

            // ✅ TOTAL ROW
            [
              "TOTAL",
              "",
              safeToLocaleString(totalLoanAmount),
              safeToLocaleString(totalRecoveredAmount),
              safeToLocaleString(totalBalanceAmount),
            ],
          ],
          theme: "grid",
          styles: { fontSize: 11 },
          headStyles: {
            fillColor: [30, 58, 138],
            textColor: 255,
            fontStyle: "bold",
          },
          didParseCell: function (data) {
            // Style TOTAL row
            if (
              data.row.index === filteredHandloans.length &&
              data.section === "body"
            ) {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.fillColor = [243, 244, 246]; // light gray
            }
          },
           columnStyles: {
             2: { halign: "right" },
             3: { halign: "right" },
             4: { halign: "right" },
           }
        });

        currentY = doc.lastAutoTable.finalY + 14;
      }

      /* ================= DENOMINATION ================= */
      const denominations = [
        {
          label: "500",
          value: 500,
          good: data._500NoteCount,
          soiled: data._500SoiledNoteCount,
        },
        {
          label: "200",
          value: 200,
          good: data._200NoteCount,
          soiled: data._200SoiledNoteCount,
        },
        {
          label: "100",
          value: 100,
          good: data._100NoteCount,
          soiled: data._100SoiledNoteCount,
        },
        {
          label: "50",
          value: 50,
          good: data._50NoteCount,
          soiled: data._50SoiledNoteCount,
        },
        {
          label: "20",
          value: 20,
          good: data._20NoteCount,
          soiled: data._20SoiledNoteCount,
        },
        {
          label: "10",
          value: 10,
          good: data._10NoteCount,
          soiled: data._10SoiledNoteCount,
        },
      ];

      let denominationTotal = 0;

      const denominationRows = denominations
        .filter((d) => Number(d.good) > 0 || Number(d.soiled) > 0)
        .map((d) => {
          const amount = (Number(d.good) - Number(d.soiled)) * d.value;
          denominationTotal += amount;
          return [
            d.label,
            d.good || 0,
            d.soiled || 0,
            safeToLocaleString(amount),
          ];
        });

      const coinsCount =
        (data._1CoinCount || 0) +
        (data._5CoinCount || 0) +
        (data._10CoinCount || 0) +
        (data._20CoinCount || 0);

      if (coinsCount > 0) {
        denominationTotal += coinsCount;
        denominationRows.push([
          "COINS",
          coinsCount,
          0,
          safeToLocaleString(coinsCount),
        ]);
      }

      const coinsTotal = calculateCoinsTotal(); // Use your helper function
      if (coinsTotal > 0) {
        denominationTotal += coinsTotal;

        // Add individual coin rows for clarity
        if (data._1CoinCount > 0) {
          denominationRows.push([
            "₹1 Coin",
            data._1CoinCount || 0,
            0,
            safeToLocaleString((data._1CoinCount || 0) * 1),
          ]);
        }
        if (data._5CoinCount > 0) {
          denominationRows.push([
            "₹5 Coin",
            data._5CoinCount || 0,
            0,
            safeToLocaleString((data._5CoinCount || 0) * 5),
          ]);
        }
        if (data._10CoinCount > 0) {
          denominationRows.push([
            "₹10 Coin",
            data._10CoinCount || 0,
            0,
            safeToLocaleString((data._10CoinCount || 0) * 10),
          ]);
        }
        if (data._20CoinCount > 0) {
          denominationRows.push([
            "₹20 Coin",
            data._20CoinCount || 0,
            0,
            safeToLocaleString((data._20CoinCount || 0) * 20),
          ]);
        }
      }

      if (denominationRows.length > 0) {
        denominationRows.push([
          "TOTAL",
          "",
          "",
          safeToLocaleString(denominationTotal),
        ]);
      }
      autoTable(doc, {
        startY: currentY,
        head: [["Note", "Good", "Soiled", "Amount"]],
        body: denominationRows,
        theme: "grid",
        styles: { fontSize: 11 },
        columnStyles: { 3: { halign: "right" } },
        pageBreak: "auto",
      });

      setPdfUrl(doc.output("bloburl"));
      var base64String = doc.output("datauristring").split(",")[1];
      return base64String;
    } catch (e) {
      console.error("PDF generation error:", e);
      setReportMsg("Failed to generate PDF");
    }
  };

  const getLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getLocalDate());

  // Complete denomination options matching your original structure
  const denominationOptions = [
    { value: 500, label: "₹500 Note", type: "Note" },
    { value: 200, label: "₹200 Note", type: "Note" },
    { value: 100, label: "₹100 Note", type: "Note" },
    { value: 50, label: "₹50 Note", type: "Note" },
    { value: 20, label: "₹20 Note", type: "Note" },
    { value: 10, label: "₹10 Note", type: "Note" },
    { value: 20, label: "20c Coin", type: "Coin" },
    { value: 10, label: "10c Coin", type: "Coin" },
    { value: 5, label: "5c Coin", type: "Coin" },
    { value: 1, label: "1c Coin", type: "Coin" },
  ];

  React.useEffect(() => {
    const bearerToken = localStorage.getItem("token");
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      })
      .catch(() => {});
    if (!isAdminRole) {
      const orgId = localStorage.getItem("organizationId");
      setOrganizationId(orgId);
      setOrganizationName(localStorage.getItem("organizationName") || "");
      setDate(new Date().toISOString().slice(0, 10));
      fetchBalanceData(date, orgId);
    }
  }, []);

  const handleChange = async (e) => {
    const { name, value, type, options } = e.target;
    if (type === "select-one") {
      const selectedOrgId = e.target.value;
      const select = e.target;
      let selectedOrgName = "";
      for (let option of options) {
        if (option.value === value) {
          selectedOrgName = option.text;
          break;
        }
      }
      setOrganizationId(selectedOrgId);
      setOrganizationName(selectedOrgName);

      if (selectedOrgId && date) {
        await fetchBalanceData(date, selectedOrgId);
        const org = organizations.find(
          (o) =>
            String(o.id || o._links?.self?.href?.split("/").pop()) ===
            String(selectedOrgId)
        );

        setSelectedOrganization(org || null);
      }
    } else if (type === "date") {
      const selectedDate = e.target.value;
      setDate(selectedDate);

      if (organizationId && selectedDate) {
        const org = organizations.find(
          (o) =>
            String(o.id || o._links?.self?.href?.split("/").pop()) ===
            String(organizationId)
        );

        setSelectedOrganization(org || null);
        await fetchBalanceData(selectedDate, organizationId);
      }
    }
  };

  const fetchBalanceData = async (closingDate, orgId) => {
    try {
      const bearerToken = localStorage.getItem("token");
      const res = await fetch(
        `${APP_SERVER_URL_PREFIX}/petty-cash/day-closing/init?closingDate=${closingDate}&organizationId=${orgId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearerToken}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setInward(data.cashIn || "0");
        setOutward(data.cashOut || "0");
        setClosingBalance(data.closingBalance || "0");
        setOpeningBalance(data.openingBalance || "0");
      } else {
        setInward("");
        setOutward("");
        setClosingBalance("");
        setOpeningBalance("");
      }
    } catch (error) {
      console.error("Error fetching balance data:", error);
      setInward("");
      setOutward("");
      setClosingBalance("");
      setOpeningBalance("");
    }
  };

  const addDenominationEntry = () => {
    if (!selectedDenomination) {
      setError("Please select a denomination");
      return;
    }

    // Check if this denomination already exists
    const existingEntry = denominationEntries.find(
      (entry) => entry.denomination === parseInt(selectedDenomination)
    );
    if (existingEntry) {
      setError("This denomination has already been added");
      return;
    }

    const denomination = denominationOptions.find(
      (d) => d.value === parseInt(selectedDenomination)
    );
    const good = parseInt(goodCount) || 0;
    const bad = parseInt(badCount) || 0;

    let denominationValue;
    if (denomination.type === "Coin") {
      denominationValue = parseInt(selectedDenomination);
    } else {
      denominationValue = parseInt(selectedDenomination);
    }

    const totalAmount = (good + bad) * denominationValue;

    const newEntry = {
      id: Date.now(),
      denomination: parseInt(selectedDenomination),
      label: denomination.label,
      type: denomination.type,
      good,
      bad,
      totalAmount,
      denominationValue, // Store the actual monetary value
    };

    setDenominationEntries([...denominationEntries, newEntry]);

    // Reset form
    setSelectedDenomination("");
    setGoodCount("");
    setBadCount("");
    setError("");
  };

  const removeDenominationEntry = (id) => {
    setDenominationEntries(
      denominationEntries.filter((entry) => entry.id !== id)
    );
  };

  const getTotalSummary = () => {
    let totalGood = 0;
    let totalBad = 0;
    let totalAmount = 0;

    denominationEntries.forEach((entry) => {
      totalGood += entry.good * entry.denominationValue;
      totalBad += entry.bad * entry.denominationValue;
      totalAmount += entry.totalAmount;
    });

    return { totalGood, totalBad, totalAmount };
  };

  const validateClosingBalance = () => {
    const { totalAmount } = getTotalSummary();
    const apiClosingBalance = parseFloat(closingBalance) || 0;

    if (Math.abs(totalAmount - apiClosingBalance) > 0.01) {
      setBalanceError(
        `Closing balance mismatch! Denomination total: ₹${totalAmount.toFixed(
          2
        )} vs API closing balance: ₹${apiClosingBalance.toFixed(2)}`
      );
      return false;
    }

    setBalanceError("");
    return true;
  };

  // Format denominations for API exactly like your original working code
  const formatDenominationsForAPI = () => {
    const formatted = {
      // Initialize all fields to 0 like your original code
      500: { good: 0, bad: 0 },
      200: { good: 0, bad: 0 },
      100: { good: 0, bad: 0 },
      50: { good: 0, bad: 0 },
      20: { good: 0, bad: 0 },
      10: { good: 0, bad: 0 },
      "20c": { good: 0, bad: 0 },
      "10c": { good: 0, bad: 0 },
      "5c": { good: 0, bad: 0 },
      "1c": { good: 0, bad: 0 },
    };

    // Populate with actual entries
    denominationEntries.forEach((entry) => {
      if (entry.type === "Coin") {
        // Map coin entries to the correct keys
        switch (entry.denomination) {
          case 20:
            formatted["20c"] = { good: entry.good, bad: entry.bad };
            break;
          case 10:
            formatted["10c"] = { good: entry.good, bad: entry.bad };
            break;
          case 5:
            formatted["5c"] = { good: entry.good, bad: entry.bad };
            break;
          case 1:
            formatted["1c"] = { good: entry.good, bad: entry.bad };
            break;
        }
      } else {
        // Map note entries
        formatted[entry.denomination] = { good: entry.good, bad: entry.bad };
      }
    });

    return formatted;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setBalanceError("");

    if (denominationEntries.length === 0) {
      setError("Please add at least one denomination entry");
      setLoading(false);
      return;
    }

    if (!validateClosingBalance()) {
      setLoading(false);
      return;
    }

    try {
      const desc =
        typeof description === "string" && description.trim()
          ? description.trim()
          : "Day Closing";

      const {
        totalGood: cashIn,
        totalBad: cashOut,
        totalAmount: closingBalanceCalc,
      } = getTotalSummary();

      const denominations = formatDenominationsForAPI();

      // Create payload exactly matching your original working structure
      const payload = {
        closingDate: date,
        description: desc,
        createdBy: currentUser,
        comment: comment,
        createdTime,
        organizationId: organizationId || undefined,
        inward: inward ? Number(inward) : 0,
        outward: outward ? Number(outward) : 0,
        closingBalance:
          closingBalanceCalc || (closingBalance ? Number(closingBalance) : 0),
        openingBalance: openingBalance,
        cashIn: inward ? Number(inward) : 0,
        cashOut: outward ? Number(outward) : 0,
        tenNoteCount: denominations[10]?.good || 0,
        twentyNoteCount: denominations[20]?.good || 0,
        fiftyNoteCount: denominations[50]?.good || 0,
        hundredNoteCount: denominations[100]?.good || 0,
        twoHundredNoteCount: denominations[200]?.good || 0,
        fiveHundredNoteCount: denominations[500]?.good || 0,
        tenSoiledNoteCount: denominations[10]?.bad || 0,
        twentySoiledNoteCount: denominations[20]?.bad || 0,
        fiftySoiledNoteCount: denominations[50]?.bad || 0,
        hundredSoiledNoteCount: denominations[100]?.bad || 0,
        twoHundredSoiledNoteCount: denominations[200]?.bad || 0,
        fiveHundredSoiledNoteCount: denominations[500]?.bad || 0,
        oneCoinCount: denominations["1c"]?.good || 0,
        fiveCoinCount: denominations["5c"]?.good || 0,
        tenCoinCount: denominations["10c"]?.good || 0,
        twentyCoinCount: denominations["20c"]?.good || 0,
        denominations: denominations,
      };
      const bearerToken = localStorage.getItem("token");

      const formData = new FormData();
      formData.append(
        "pettycashdayclosing",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );

      fileUploads.forEach((file, idx) => {
        if (file) {
          formData.append(`files`, file);
          formData.append("fileDescriptions", fileDescription[idx] || "");
        }
      });

      const res = await fetch(
        `${APP_SERVER_URL_PREFIX}/petty-cash/day-closing`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${bearerToken}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const data = await res.text();
        setError(data);
      } else {
        const messagePayload = [
          {
            templatename: "day_closing_report",
            mobile: "919740665561",
            medianame: "sample.pdf",
            dvariables: ["var 1", "var 2", "var 3", "var 4", "var 2"],
            media: "",
            // ⚠️ keep full Base64 string here (truncated for readability)
          },
        ];
        const data = await handleGenerateReport();
        console.log("Generated PDF Base64:", data);
        messagePayload[0].media = data;
        messagePayload[0].medianame = `Day_Closing_Report_${date}.pdf`;
        messagePayload[0].mobile = "9706556561";
        messagePayload[0].templatename = "day_closing_report";
        messagePayload[0].dvariables = [{ organizationName }];
        //const res = await fetch(`https://wa.iconicsolution.co.in/wapp/api/v2/send/bytemplate?apikey=8b275f43ccf74564ba0715316533af8a&templatename=day_closing_report&mobile=9740665561,9866472624,9948011234,8985221844&dvariables=RSH,${date},${cashIn},${cashOut},${closingBalance}`, {
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "X-API-KEY": "8b275f43ccf74564ba0715316533af8a",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(messagePayload),
          });

          const result = await response.json();

          console.log("Success:", result);
        } catch (error) {
          console.error("Error:", error);
        }

        setSuccess("Day closing created successfully!");
        setTimeout(() => navigate("/pettycash/day-closing"), 1200);
      }
    } catch (e) {
      setError("Failed to create day closing");
    } finally {
      setLoading(false);
    }
  };

  const url = "http://wa.iconicsolution.co.in/wapp/api/v2/send/bytemplate/json";

  const { totalGood, totalBad, totalAmount } = getTotalSummary();

  React.useEffect(() => {
    if (closingBalance && denominationEntries.length > 0) {
      validateClosingBalance();
    }
  }, [denominationEntries, closingBalance]);

  // Get available denominations (not already added)
  const availableDenominations = denominationOptions.filter(
    (option) =>
      !denominationEntries.some((entry) => entry.denomination === option.value)
  );

  return (
    <div className="day-closing-container">
      <Sidebar isOpen={true} />
      <PageCard title="Create Day Closing Report">
        <form onSubmit={handleSubmit} className="day-closing-form">
          {/* Basic Information Section */}
          <div className="form-section1">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Organization</label>
                <select
                  value={
                    isAdminRole
                      ? organizationId
                      : localStorage.getItem("organizationId")
                  }
                  onChange={handleChange}
                  className="form-select"
                  required
                  disabled={!isAdminRole}
                >
                  <option value="">Select organization</option>
                  {organizations.map((org) => (
                    <option
                      key={
                        org.id ||
                        (org._links && org._links.self && org._links.self.href)
                      }
                      value={
                        org.id ||
                        (org._links &&
                          org._links.self &&
                          org._links.self.href.split("/").pop())
                      }
                    >
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="form-input textarea-input"
                  rows={4}
                  placeholder="Enter your comments here..."
                />
              </div>
            </div>
          </div>

          <div className="form-section1">
            <h3 className="section-title">Balance Summary</h3>
            <div className="balance-grid">
              <div className="balance-card">
                <label className="balance-label">Opening Balance</label>
                <input
                  type="number"
                  value={openingBalance}
                  className="balance-input"
                  min="0"
                  readOnly
                />
              </div>
              <div className="balance-card">
                <label className="balance-label">Inward</label>
                <input
                  type="number"
                  value={inward}
                  onChange={(e) => setInward(e.target.value)}
                  className="balance-input"
                  min="0"
                  readOnly
                />
              </div>

              <div className="balance-card">
                <label className="balance-label">Outward</label>
                <input
                  type="number"
                  value={outward}
                  onChange={(e) => setOutward(e.target.value)}
                  className="balance-input"
                  min="0"
                  readOnly
                />
              </div>

              <div className="balance-card">
                <label className="balance-label">Closing Balance</label>
                <input
                  type="number"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  className="balance-input"
                  min="0"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="form-section1">
            <h3 className="section-title">Attachments </h3>
            <div className="form-section1">
              <div className="file-uploads">
                {/* Dynamically render file upload inputs */}
                {fileUploads.map((file, index) => (
                  <div key={index} className="file-upload-item">
                    <label>Upload Bills/Receipts</label>
                    <input
                      type="file"
                      name="fileUpload"
                      onChange={(e) => handleFileChange(index, e)}
                      accept="image/*,.pdf,.doc,.docx,.xlsx"
                    />

                    <label>Description</label>
                    <input
                      id={`fileDescriptions[${index}]`}
                      type="text"
                      name={`fileDescriptions[${index}]`}
                      value={fileDescription[index] || ""}
                      onChange={(e) =>
                        handleFileDescriptionChange(index, e.target.value)
                      }
                      className="form-input"
                    />

                    <button
                      type="button"
                      onClick={() => removeFileUpload(index)}
                      className="remove-file-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addFileUpload}
                className="btn-primary1 add-file-btn"
              >
                Add File
              </button>
            </div>
          </div>

          <div className="form-section1">
            <h3 className="section-title">Add Denomination</h3>
            <div className="denomination-form">
              <div className="denomination-inputs">
                <div className="form-group">
                  <label className="form-label">Denomination</label>
                  <select
                    value={selectedDenomination}
                    onChange={(e) => setSelectedDenomination(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select denomination</option>
                    {availableDenominations.map((option) => (
                      <option
                        key={`${option.value}-${option.type}`}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Good Count</label>
                  <input
                    type="number"
                    min="0"
                    value={goodCount}
                    onChange={(e) => setGoodCount(e.target.value)}
                    className="form-input"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bad Count</label>
                  <input
                    type="number"
                    min="0"
                    value={badCount}
                    onChange={(e) => setBadCount(e.target.value)}
                    className="form-input"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">&nbsp;</label>
                  <button
                    type="button"
                    onClick={addDenominationEntry}
                    className="add-denomination-btn"
                    disabled={!selectedDenomination}
                  >
                    Add Denomination
                  </button>
                </div>
              </div>
            </div>

            {/* Added Denominations Table */}
            {denominationEntries.length > 0 && (
              <div className="denomination-entries-table">
                <h4 className="entries-title">Added Denominations</h4>
                <div className="denomination-table-container">
                  <table className="denomination-table">
                    <thead>
                      <tr>
                        <th>Denomination</th>
                        <th>Type</th>
                        <th>No (Good)</th>
                        <th>No (Bad)</th>
                        <th>Total Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {denominationEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="denom-value">{entry.label}</td>
                          <td className="denom-type">{entry.type}</td>
                          <td>{entry.good}</td>
                          <td>{entry.bad}</td>
                          <td className="total-amount">
                            ₹{entry.totalAmount.toFixed(2)}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removeDenominationEntry(entry.id)}
                              className=""
                              style={{ color: "red" }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="denomination-total">
                        <td colSpan="2">
                          <strong>Grand Total</strong>
                        </td>
                        <td>
                          <strong>Good: ₹{totalGood.toFixed(2)}</strong>
                        </td>
                        <td>
                          <strong>Bad: ₹{totalBad.toFixed(2)}</strong>
                        </td>
                        <td colSpan="2">
                          <strong>₹{totalAmount.toFixed(2)}</strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Balance Error Message */}
          {balanceError && (
            <div className="message error-message">
              <span className="message-icon">⚠️</span>
              {balanceError}
            </div>
          )}

          <div className="form-actions1">
            <div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                <span className="btn-icon">←</span>
                Back
              </button>
            </div>
            <button
              className={`btn-primary ${loading ? "loading" : ""} ${
                balanceError ? "disabled" : ""
              }`}
              type="submit"
              disabled={
                loading || balanceError || denominationEntries.length === 0
              }
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                " 💾 Save  "
              )}
            </button>
          </div>

          {error && (
            <div className="message error-message">
              <span className="message-icon">⚠️</span>
              {error}
            </div>
          )}
          {success && (
            <div className="message success-message">
              <span className="message-icon">✅</span>
              {success}
            </div>
          )}
        </form>
      </PageCard>
    </div>
  );
}

export default CreateDayClosing;
