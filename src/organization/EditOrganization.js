import React, { useState, useEffect } from "react";
import Sidebar from "../_components/sidebar/Sidebar";
import PageCard from "../_components/PageCard";
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import { useNavigate, useParams } from "react-router-dom";
import "./Organization.css";

function EditOrganization() {
  const { id } = useParams();
  const navigate = useNavigate();

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
    address: "",
    city: "",
    pincode: "",
  });

  const [parentOrganizationId, setParentOrganizationId] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ LOAD EXISTING ORG
  useEffect(() => {
    const token = localStorage.getItem("token");

    // Fetch All Branches for parent dropdown
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      })
      .catch(() => {})
      .finally(() => setFetching(false));

    // Fetch current organization data
    fetch(`${APP_SERVER_URL_PREFIX}/organizations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load organization");
        return res.json();
      })
      .then((org) => {
        setForm({
          name: org.name || "",
          registrationNo: org.registrationNo || "",
          gstn: org.gstn || "",
          pan: org.pan || "",
          contact: org.contact || "",
          fax: org.fax || "",
          email: org.email || "",
          website: org.website || "",
          status: org.status || "Active",
          address: org.address?.address || "",
          city: org.address?.city || "",
          pincode: org.address?.pincode || "",
        });

        // Set parent organization if exists
        if (org.parentOrganizationId) {
          setParentOrganizationId(String(org.parentOrganizationId));
        }
      })
      .catch(() => setError("Failed to load organization"))
      .finally(() => setFetching(false));
  }, [id]);

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

    // Validation
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

      // Add parent organization if selected
      if (parentOrganizationId) {
        payload.parentOrganizationId = Number(parentOrganizationId);
      } else {
        // If no parent selected, ensure we don't send parentOrganizationId
        // or set it to null if your backend expects it
        payload.parentOrganizationId = null;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/organizations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update organization");
      }

      setSuccess("Organization updated successfully!");
      setTimeout(() => {
        navigate("/organization");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to update organization");
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

  const handleCancel = () => {
    navigate("/organization");
  };

  if (fetching) {
    return (
      <div className="page-container">
        <Sidebar isOpen={true} />
        <PageCard title="Edit Organization">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading organization data...</p>
          </div>
        </PageCard>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title="Edit Organization">
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        <div className="create-org-form">
          <form onSubmit={handleSubmit}>
            <div className="form-sections">
              {/* ================= SECTION 1 ================= */}
              <div className="form-section">
                <h3 className="section-title">🏢 Organization Details</h3>
                <div className="form-grid enhanced-grid">
                  <div className="form-group">
                    <label className="form-label required">
                      Organization Name
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="form-input"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Parent Organization</label>
                    <select
                      value={parentOrganizationId}
                      onChange={(e) => setParentOrganizationId(e.target.value)}
                      className="form-select"
                      disabled={loading}
                    >
                      <option value="">No Parent Organization</option>
                      {organizations
                        .filter((org) => {
                          const orgId = getOrganizationId(org);
                          return orgId && orgId !== id; // Don't allow self as parent
                        })
                        .map((org) => {
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
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">PAN Number</label>
                    <input
                      name="pan"
                      value={form.pan}
                      onChange={handleChange}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Address</label>
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pin Code</label>
                    <input
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      className="form-input"
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fax</label>
                    <input
                      name="fax"
                      value={form.fax}
                      onChange={handleChange}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions1">
              <button
                type="button"
                className="btn-outline"
                onClick={handleCancel}
                disabled={loading}
              >
                ← Cancel
              </button>
              <button type="submit" className="btn-primary2" disabled={loading}>
                {loading ? "Updating..." : "Update Organization"}
              </button>
            </div>
          </form>
        </div>
      </PageCard>
    </div>
  );
}

export default EditOrganization;
