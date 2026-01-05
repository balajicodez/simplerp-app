import React, { useState, useEffect } from "react";
import Sidebar from "../_components/sidebar/Sidebar";
import PageCard from "../_components/PageCard";
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import { useNavigate } from "react-router-dom";
import "../pages/user-administration/organizations/Organization.css";
import {PRETTY_CASE_PAGE_TITLE} from "../pages/petty-cash/PrettyCaseConstants";
import DefaultAppSidebarLayout from "../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";

function CreateOrganization({ onCreated }) {
  const [form, setForm] = useState({
    name: "",
    registrationNo: "",
    gstn: "",
    pan: "",
    contact: "",
    fax: "",
    email: "",
    website: "",
    status: "Active",

    // Address
    address: "",
    city: "",
    pincode: "",
  });

  const [parentOrganizationId, setParentOrganizationId] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
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
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Organization name is required");
      setLoading(false);
      return;
    }

    if (!form.contact.trim()) {
      setError("Contact information is required");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: form.name,
        registrationNo: form.registrationNo,
        gstn: form.gstn,
        pan: form.pan,
        contact: form.contact,
        fax: form.fax,
        email: form.email,
        website: form.website,
        status: form.status,

        address: {
          address: form.address,
          city: form.city,
          pincode: form.pincode,
        },
      };

      if (parentOrganizationId) {
        payload.parentOrganizationId = Number(parentOrganizationId);
      }

      const bearerToken = localStorage.getItem("token");
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create organization");
      }

      setSuccess("Organization created successfully!");
      setTimeout(() => {
        if (onCreated) onCreated();
        navigate("/organization");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  const getOrganizationId = (org) => {
    if (org.id) return org.id;
    if (org._links?.self?.href) {
      const parts = org._links.self.href.split("/");
      return parts[parts.length - 1];
    }
    return null;
  };

  return (
    <DefaultAppSidebarLayout pageTitle={"User Administration"}>
      <PageCard title="Create Organization">
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        <div className="create-org-form">
          <form onSubmit={handleSubmit}>
            <div className="form-sections">
              {/* ================= SECTION 1 ================= */}
              <div className="form-section">
                <h3 className="section-title">🏢 Branch Details</h3>
                <div className="form-grid enhanced-grid">
                  <div className="form-group">
                    <label className="form-label required">
                      Branch Name
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Parent Branch</label>
                    <select
                      value={parentOrganizationId}
                      onChange={(e) => setParentOrganizationId(e.target.value)}
                      className="form-select"
                    >
                      <option value="">No Parent Organization</option>
                      {organizations.map((org) => {
                        const id = getOrganizationId(org);
                        return id ? (
                          <option key={id} value={id}>
                            {org.name}
                          </option>
                        ) : null;
                      })}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Registration Number</label>
                    <input
                      name="registrationNo"
                      value={form.registrationNo}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">GST Number</label>
                    <input
                      name="gstn"
                      value={form.gstn}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">PAN Number</label>
                    <input
                      name="pan"
                      value={form.pan}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Address</label>
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pin Code</label>
                    <input
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* ================= SECTION 2 ================= */}
              <div className="form-section">
                <h3 className="section-title">📞 Contact Information</h3>
                <div className="form-grid enhanced-grid">
                  <div className="form-group">
                    <label className="form-label required">
                      Contact Number
                    </label>
                    <input
                      name="contact"
                      value={form.contact}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fax</label>
                    <input
                      name="fax"
                      value={form.fax}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions1">
              <button
                type="button"
                className="btn-outline"
                onClick={() => navigate("/organization")}
              >
                ← Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Creating..." : "  💾 Save"}
              </button>
            </div>
          </form>
        </div>
      </PageCard>
    </DefaultAppSidebarLayout>
  );
}

export default CreateOrganization;
