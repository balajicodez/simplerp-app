import React, { useState } from "react";
import "./CreateDayClosing.css";
import {APP_SERVER_URL_PREFIX, DATE_DISPLAY_FORMAT} from "../../../constants.js";
import { DAY_CLOSING_WHATSAPP_NUMBERS_CSV } from "../../../constants.js";
import { useNavigate } from "react-router-dom";
import Utils from "../../../Utils";
import {PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {App as AntApp, Button, Spin, Typography} from "antd";
import {LeftOutlined} from "@ant-design/icons";
import createDayClosingReportPDF from "../../reports/day-closing/createDayClosingReportPDF";
import {getOrganizationAddressText} from "../../reports/day-closing/utils";
import {
  fetchDayClosingData,
  fetchExpenseReportData,
  fetchHandLoans
} from "../../reports/day-closing/dayClosingReportApiService";
import dayjs from "dayjs";
import {fetchInitBalanceDate, postDayClosingFormData, postWhatsappReport} from "./DayClosingDataSource";
import FormUtils from "../../../_utils/FormUtils";

export default function CreateDayClosingFormPage() {
  const [description, setDescription] = useState("Day Closing");
  const [comment, setComment] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [organizationName, setOrganizationName] = useState("");
  const [balanceData, setBalanceData] = useState(null);

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
  const isAdmin = Utils.isRoleApplicable("ADMIN");

  const formUtils = new FormUtils(AntApp.useApp());

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



  const handleGenerateReport = async () => {
    try {

      const dayClosingData = await fetchDayClosingData(organizationId, date);

      // Expenses
      const expensesData = await fetchExpenseReportData(organizationId, date) || [];

      // Hand loans
      const handLoansData = await fetchHandLoans(0, 1000, ['ISSUED,PARTIALLY_RECOVERED'], organizationId);
      const handLoans = handLoansData.content || handLoansData || [];
      handLoans?.forEach(loan => loan.recoveredAmount = (loan.loanAmount || 0) - (loan.balanceAmount || 0));

      if (!dayClosingData &&
          expensesData.length === 0 &&
          handLoans.length === 0
      ) {
        return;
      }

      const cashInExpenses = expensesData.filter(
          (expense) => expense.expenseType === "CASH-IN"
      );
      const cashOutExpenses = expensesData.filter(
          (expense) => expense.expenseType === "CASH-OUT"
      );

      const doc = createDayClosingReportPDF({
        closingDate: dayjs(date).format(DATE_DISPLAY_FORMAT),
        organizationName: selectedOrganization?.name,
        organizationAddress: getOrganizationAddressText(selectedOrganization),
        cashInExpenses,
        cashOutExpenses,
        dayClosingData,
        handLoans,
      });

      return doc.output("datauristring").split(",")[1];
    } catch (e) {
      console.error("PDF generation error:", e);
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
    if (!isAdmin) {
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
        const balanceData = await fetchInitBalanceDate(closingDate, orgId);
      setBalanceData(balanceData);
    } catch (error) {
      console.error("Error fetching balance data:", error);
      setBalanceData(null);
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
    const apiClosingBalance = balanceData.closingBalance;

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
        inward: balanceData.inward,
        outward: balanceData.outward,
        closingBalance:
          closingBalanceCalc || (balanceData.closingBalance ? Number(balanceData.closingBalance) : 0),
        openingBalance: balanceData.openingBalance,
        cashIn: balanceData.cashIn,
        cashOut: balanceData.cashOut,
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

      await postDayClosingFormData(formData);

      // Send PDF report to WhatsApp
      try {
        const pdfReportBase64 = await handleGenerateReport();
        const messagePayload = {};
        messagePayload.media = pdfReportBase64;
        messagePayload.medianame = `Day_Closing_Report_${date}.pdf`;
        messagePayload.mobile = DAY_CLOSING_WHATSAPP_NUMBERS_CSV;
        messagePayload.templatename = "day_closing_report";
        messagePayload.dvariables = [organizationName , date, balanceData.cashIn, balanceData.cashOut, balanceData.closingBalance];
        await postWhatsappReport([messagePayload]);
      } catch (error) {
        console.error("Error:", error);
      }

      formUtils.showSuccessNotification("Day closing created successfully!");
      navigate(-1); // Previous page
    } catch (e) {
      formUtils.showErrorNotification("Failed to create day closing");
    } finally {
      setLoading(false);
    }
  };

  const url = APP_SERVER_URL_PREFIX+"/wapp/api/v2/send/bytemplate/json";

  const { totalGood, totalBad, totalAmount } = getTotalSummary();

  React.useEffect(() => {
    if (balanceData && balanceData.closingBalance && denominationEntries.length > 0) {
      validateClosingBalance();
    }
  }, [denominationEntries, balanceData]);

  // Get available denominations (not already added)
  const availableDenominations = denominationOptions.filter(
    (option) =>
      !denominationEntries.some((entry) => entry.denomination === option.value)
  );

  return (
      <DefaultAppSidebarLayout pageTitle={PRETTY_CASE_PAGE_TITLE}>

        <div className="form-page">

          <Button variant="filled"
                  color={'default'}
                  icon={<LeftOutlined/>}
                  size={'large'}
                  iconPlacement={'left'}
                  onClick={() => {
                    navigate(-1);
                  }}>
            Back
          </Button>

          <Spin spinning={loading} tip="Loading..." size={'large'}>

            <div
               // form={form}
                noValidate={true}
             //   onValuesChange={handleValueChange}
             //   onFinish={handleAntSubmit}
             //   onFinishFailed={onFinishFailed}
                className="form-page"
                encType="multipart/form-data"
                layout="vertical">

              <div className='form-page-header'>


                <div className={'page-title-section'}>


                  <Typography.Title className='page-title' level={2}>
                    Create Day Closing Report
                  </Typography.Title>
                </div>


                <div className={'page-actions'}></div>
              </div>



        <form onSubmit={handleSubmit} className="day-closing-form">
          {/* Basic Information Section */}
          <div className="form-section1">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Organization</label>
                <select
                  value={
                    isAdmin
                      ? organizationId
                      : localStorage.getItem("organizationId")
                  }
                  onChange={handleChange}
                  className="form-select"
                  required
                  disabled={!isAdmin}
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
                  value={balanceData?.openingBalance}
                  className="balance-input"
                  readOnly
                />
              </div>
              <div className="balance-card">
                <label className="balance-label">Inward</label>
                <input
                  type="number"
                  value={balanceData?.cashIn}
                  className="balance-input"
                  readOnly
                />
              </div>

              <div className="balance-card">
                <label className="balance-label">Outward</label>
                <input
                  type="number"
                  value={balanceData?.cashOut}
                  className="balance-input"
                  readOnly
                />
              </div>

              <div className="balance-card">
                <label className="balance-label">Closing Balance</label>
                <input
                  type="number"
                  value={balanceData?.closingBalance}
                  className="balance-input"
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
            </div>
          </Spin>
        </div>
      </DefaultAppSidebarLayout>
  );
}