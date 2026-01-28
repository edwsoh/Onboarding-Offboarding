import { useState, useEffect } from 'react';
import './OffboardingForm.css';

const M365_LICENSES = [
    { id: 'm365-e3', name: 'Microsoft 365 E3' },
    { id: 'm365-e5', name: 'Microsoft 365 E5' },
    { id: 'm365-f3', name: 'Microsoft 365 F3' },
    { id: 'o365-e1', name: 'Office 365 E1' },
    { id: 'exchange-p1', name: 'Exchange Online Plan 1' },
    { id: 'project-p3', name: 'Project Plan 3' },
    { id: 'visio-p2', name: 'Visio Plan 2' },
    { id: 'powerbi-pro', name: 'Power BI Pro' }
];

const D365_PERMISSIONS = [
    { id: 'd365-team', name: 'Team Member' },
    { id: 'd365-operations', name: 'Operations' },
    { id: 'd365-finance', name: 'Finance' },
    { id: 'd365-hr', name: 'Human Resources' },
    { id: 'd365-admin', name: 'Administrator' },
    { id: 'd365-developer', name: 'Developer' }
];

const EQUIPMENT_ITEMS = [
    { id: 'laptop', name: 'Laptop/Computer', icon: '💻' },
    { id: 'mobile', name: 'Mobile Phone', icon: '📱' },
    { id: 'badge', name: 'Access Badge/ID Card', icon: '🪪' },
    { id: 'keys', name: 'Office Keys', icon: '🔑' },
    { id: 'monitor', name: 'Monitor(s)', icon: '🖥️' },
    { id: 'keyboard', name: 'Keyboard & Mouse', icon: '⌨️' },
    { id: 'headset', name: 'Headset', icon: '🎧' },
    { id: 'other', name: 'Other Equipment', icon: '📦' }
];

const OFFBOARDING_REASONS = [
    'Resignation',
    'Retirement',
    'Contract End',
    'Termination',
    'Transfer to Another Entity',
    'Layoff',
    'Other'
];

function OffboardingForm() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [employeeSearchError, setEmployeeSearchError] = useState(null);
    const [formData, setFormData] = useState({
        lastWorkingDay: '',
        offboardingReason: '',
        licensesToRevoke: [],
        permissionsToRemove: [],
        equipmentToReturn: [],
        forwardEmailTo: '',
        revokeVPN: true,
        revokeBuilding: true,
        archiveMailbox: true,
        notes: ''
    });

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbycAepzas1nrNReDAMkHSUR3wv45KXay-cFWVfTMu7f0z2UQnpPJyn5qVE7pXfWPxpmhQ/exec';

    // Fetch employees from Google Sheets when search term changes
    useEffect(() => {
        const fetchEmployees = async () => {
            if (searchTerm.length < 3) {
                setEmployees([]);
                return;
            }

            setLoadingEmployees(true);
            setEmployeeSearchError(null);

            try {
                const response = await fetch(`${WEBHOOK_URL}?action=searchEmployees&query=${encodeURIComponent(searchTerm)}`);

                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }

                const data = await response.json();

                if (data.status === 'success') {
                    setEmployees(data.employees || []);
                } else {
                    setEmployeeSearchError(`Google Script Error: ${data.message || 'Unknown error'}`);
                    setEmployees([]);
                }
            } catch (err) {
                console.error('Fetch Error:', err);
                if (err.name === 'SyntaxError') {
                    setEmployeeSearchError('Received invalid data from Google Sheets. Ensure the script is deployed as a Web App returning JSON.');
                } else {
                    setEmployeeSearchError('Unable to connect to Google Sheets. Check your network, firewall, or if "Who has access" is set to "Anyone" in the script deployment.');
                }
                setEmployees([]);
            } finally {
                setLoadingEmployees(false);
            }
        };

        // Debounce the search
        const timeoutId = setTimeout(() => {
            fetchEmployees();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, WEBHOOK_URL]);

    const filteredEmployees = employees;

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCheckboxArrayChange = (arrayName, itemId) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].includes(itemId)
                ? prev[arrayName].filter(id => id !== itemId)
                : [...prev[arrayName], itemId]
        }));
    };

    const selectAllLicenses = () => {
        setFormData(prev => ({
            ...prev,
            licensesToRevoke: M365_LICENSES.map(l => l.id)
        }));
    };

    const selectAllPermissions = () => {
        setFormData(prev => ({
            ...prev,
            permissionsToRemove: D365_PERMISSIONS.map(p => p.id)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Get license names
            const licenseNames = formData.licensesToRevoke
                .map(id => M365_LICENSES.find(l => l.id === id)?.name)
                .filter(Boolean)
                .join(', ');

            // Get permission names
            const permissionNames = formData.permissionsToRemove
                .map(id => D365_PERMISSIONS.find(p => p.id === id)?.name)
                .filter(Boolean)
                .join(', ');

            // Get equipment names
            const equipmentNames = formData.equipmentToReturn
                .map(id => EQUIPMENT_ITEMS.find(e => e.id === id)?.name)
                .filter(Boolean)
                .join(', ');

            // Prepare data for Google Sheets
            const submissionData = {
                formType: 'Offboarding',
                timestamp: new Date().toISOString(),
                employeeName: selectedEmployee?.name,
                employeeEmail: selectedEmployee?.email,
                employeeDepartment: selectedEmployee?.department,
                employeeTitle: selectedEmployee?.title,
                lastWorkingDay: formData.lastWorkingDay,
                offboardingReason: formData.offboardingReason,
                forwardEmailTo: formData.forwardEmailTo,
                licensesToRevoke: licenseNames,
                permissionsToRemove: permissionNames,
                equipmentToReturn: equipmentNames,
                revokeVPN: formData.revokeVPN ? 'Yes' : 'No',
                revokeBuilding: formData.revokeBuilding ? 'Yes' : 'No',
                archiveMailbox: formData.archiveMailbox ? 'Yes' : 'No',
                notes: formData.notes
            };

            console.log('Submitting to Google Sheets:', submissionData);

            // Send to Google Sheets webhook
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors', // Required for Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData)
            });

            // Note: With no-cors mode, we can't read the response
            // We'll assume success if no error is thrown
            console.log('Offboarding submitted successfully');
            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting form:', err);
            setError('Failed to submit the form. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="card fade-in">
                <div className="success-message offboarding-success">
                    <div className="success-icon warning">⚠</div>
                    <h2>Offboarding Request Submitted</h2>
                    <p>
                        The offboarding request for <strong>{selectedEmployee?.name}</strong> has been submitted for processing.
                    </p>
                    <div className="success-details">
                        <div className="detail-item">
                            <span className="detail-label">Employee:</span>
                            <span className="detail-value">{selectedEmployee?.name}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Email:</span>
                            <span className="detail-value">{selectedEmployee?.email}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Last Working Day:</span>
                            <span className="detail-value">{formData.lastWorkingDay}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Reason:</span>
                            <span className="detail-value">{formData.offboardingReason}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Licenses to Revoke:</span>
                            <span className="detail-value">{formData.licensesToRevoke.length}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Permissions to Remove:</span>
                            <span className="detail-value">{formData.permissionsToRemove.length}</span>
                        </div>
                    </div>
                    <button
                        className="btn btn-primary btn-lg mt-4"
                        onClick={() => {
                            setSubmitted(false);
                            setSelectedEmployee(null);
                            setSearchTerm('');
                            setFormData({
                                lastWorkingDay: '',
                                offboardingReason: '',
                                licensesToRevoke: [],
                                permissionsToRemove: [],
                                equipmentToReturn: [],
                                forwardEmailTo: '',
                                revokeVPN: true,
                                revokeBuilding: true,
                                archiveMailbox: true,
                                notes: ''
                            });
                        }}
                    >
                        Process Another Offboarding
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="offboarding-form">
            {/* Employee Selection */}
            <div className="card fade-in">
                <div className="card-header">
                    <h3 className="card-title">🔍 Select Employee</h3>
                    <p className="card-subtitle">Search and select the employee to offboard</p>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="employeeSearch">Search Employee by Email</label>
                    <input
                        type="email"
                        id="employeeSearch"
                        className="form-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Enter employee email address (e.g., john.doe@hunterdouglas.com)"
                    />
                    <small style={{ color: '#666', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                        💡 Type the employee's email address to search
                    </small>
                </div>

                {searchTerm && !selectedEmployee && (
                    <div className="employee-results">
                        {loadingEmployees ? (
                            <div className="loading-message" style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#666'
                            }}>
                                🔄 Searching employees...
                            </div>
                        ) : employeeSearchError ? (
                            <div className="error-message" style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#c33',
                                backgroundColor: '#fee',
                                borderRadius: '8px',
                                border: '1px solid #fcc'
                            }}>
                                ⚠️ {employeeSearchError}
                            </div>
                        ) : searchTerm.length < 3 ? (
                            <div className="hint-message" style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#666',
                                fontSize: '14px'
                            }}>
                                💡 Type at least 3 characters of the email address to search
                            </div>
                        ) : filteredEmployees.length > 0 ? (
                            filteredEmployees.map(emp => (
                                <div
                                    key={emp.id}
                                    className="employee-result-item"
                                    onClick={() => {
                                        setSelectedEmployee(emp);
                                        setSearchTerm('');
                                        setEmployees([]);
                                    }}
                                >
                                    <div className="employee-avatar">
                                        {emp.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="employee-info">
                                        <span className="employee-name">{emp.name}</span>
                                        <span className="employee-details">{emp.title} • {emp.department}</span>
                                        <span className="employee-email">{emp.email}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results" style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#666'
                            }}>
                                No employees found matching "{searchTerm}"
                                <div style={{ fontSize: '14px', marginTop: '8px', color: '#999' }}>
                                    Make sure the employee has been onboarded first
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {selectedEmployee && (
                    <div className="selected-employee">
                        <div className="selected-employee-card">
                            <div className="employee-avatar large">
                                {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="employee-info">
                                <span className="employee-name">{selectedEmployee.name}</span>
                                <span className="employee-details">{selectedEmployee.title} • {selectedEmployee.department}</span>
                                <span className="employee-email">{selectedEmployee.email}</span>
                            </div>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setSelectedEmployee(null)}
                            >
                                Change
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selectedEmployee && (
                <>
                    {/* Offboarding Details */}
                    <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="card-header">
                            <h3 className="card-title">📅 Offboarding Details</h3>
                            <p className="card-subtitle">Enter the offboarding information</p>
                        </div>

                        <div className="grid grid-cols-2">
                            <div className="form-group">
                                <label className="form-label" htmlFor="lastWorkingDay">Last Working Day *</label>
                                <input
                                    type="date"
                                    id="lastWorkingDay"
                                    name="lastWorkingDay"
                                    className="form-input"
                                    value={formData.lastWorkingDay}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="offboardingReason">Reason for Leaving *</label>
                                <select
                                    id="offboardingReason"
                                    name="offboardingReason"
                                    className="form-select"
                                    value={formData.offboardingReason}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select reason</option>
                                    {OFFBOARDING_REASONS.map(reason => (
                                        <option key={reason} value={reason}>{reason}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group grid-span-2">
                                <label className="form-label" htmlFor="forwardEmailTo">Forward Emails To</label>
                                <input
                                    type="email"
                                    id="forwardEmailTo"
                                    name="forwardEmailTo"
                                    className="form-input"
                                    value={formData.forwardEmailTo}
                                    onChange={handleInputChange}
                                    placeholder="manager@hunterdouglas.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* License Revocation */}
                    <div className="card fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="card-header">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="card-title">📧 Revoke Microsoft 365 Licenses</h3>
                                    <p className="card-subtitle">Select licenses to revoke</p>
                                </div>
                                <button type="button" className="btn btn-outline btn-sm" onClick={selectAllLicenses}>
                                    Select All
                                </button>
                            </div>
                        </div>

                        <div className="revoke-grid">
                            {M365_LICENSES.map(license => (
                                <label key={license.id} className="revoke-item">
                                    <input
                                        type="checkbox"
                                        className="checkbox-input"
                                        checked={formData.licensesToRevoke.includes(license.id)}
                                        onChange={() => handleCheckboxArrayChange('licensesToRevoke', license.id)}
                                    />
                                    <span className="revoke-label">{license.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Permission Removal */}
                    <div className="card fade-in" style={{ animationDelay: '0.3s' }}>
                        <div className="card-header">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="card-title">⚙️ Remove D365 F&O Permissions</h3>
                                    <p className="card-subtitle">Select permissions to remove</p>
                                </div>
                                <button type="button" className="btn btn-outline btn-sm" onClick={selectAllPermissions}>
                                    Select All
                                </button>
                            </div>
                        </div>

                        <div className="revoke-grid">
                            {D365_PERMISSIONS.map(permission => (
                                <label key={permission.id} className="revoke-item">
                                    <input
                                        type="checkbox"
                                        className="checkbox-input"
                                        checked={formData.permissionsToRemove.includes(permission.id)}
                                        onChange={() => handleCheckboxArrayChange('permissionsToRemove', permission.id)}
                                    />
                                    <span className="revoke-label">{permission.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Equipment Return */}
                    <div className="card fade-in" style={{ animationDelay: '0.4s' }}>
                        <div className="card-header">
                            <h3 className="card-title">📦 Equipment Return Checklist</h3>
                            <p className="card-subtitle">Track equipment to be returned</p>
                        </div>

                        <div className="equipment-grid">
                            {EQUIPMENT_ITEMS.map(item => (
                                <label key={item.id} className={`equipment-item ${formData.equipmentToReturn.includes(item.id) ? 'checked' : ''}`}>
                                    <input
                                        type="checkbox"
                                        className="checkbox-input"
                                        checked={formData.equipmentToReturn.includes(item.id)}
                                        onChange={() => handleCheckboxArrayChange('equipmentToReturn', item.id)}
                                    />
                                    <span className="equipment-icon">{item.icon}</span>
                                    <span className="equipment-name">{item.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Access Revocation */}
                    <div className="card fade-in" style={{ animationDelay: '0.5s' }}>
                        <div className="card-header">
                            <h3 className="card-title">🔐 Access Revocation</h3>
                            <p className="card-subtitle">Additional access controls to revoke</p>
                        </div>

                        <div className="access-options">
                            <label className="access-option">
                                <input
                                    type="checkbox"
                                    name="revokeVPN"
                                    className="checkbox-input"
                                    checked={formData.revokeVPN}
                                    onChange={handleInputChange}
                                />
                                <div className="access-content">
                                    <span className="access-name">🌐 VPN Access</span>
                                    <span className="access-description">Revoke remote network access</span>
                                </div>
                            </label>

                            <label className="access-option">
                                <input
                                    type="checkbox"
                                    name="revokeBuilding"
                                    className="checkbox-input"
                                    checked={formData.revokeBuilding}
                                    onChange={handleInputChange}
                                />
                                <div className="access-content">
                                    <span className="access-name">🏢 Building Access</span>
                                    <span className="access-description">Disable badge/keycard access</span>
                                </div>
                            </label>

                            <label className="access-option">
                                <input
                                    type="checkbox"
                                    name="archiveMailbox"
                                    className="checkbox-input"
                                    checked={formData.archiveMailbox}
                                    onChange={handleInputChange}
                                />
                                <div className="access-content">
                                    <span className="access-name">📁 Archive Mailbox</span>
                                    <span className="access-description">Archive and preserve email data</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="card fade-in" style={{ animationDelay: '0.6s' }}>
                        <div className="card-header">
                            <h3 className="card-title">📝 Additional Notes</h3>
                            <p className="card-subtitle">Any additional offboarding instructions</p>
                        </div>

                        <div className="form-group mb-0">
                            <textarea
                                id="notes"
                                name="notes"
                                className="form-textarea"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Enter any additional notes or special instructions..."
                                rows={4}
                            />
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        {error && (
                            <div style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: '#fee',
                                border: '1px solid #fcc',
                                borderRadius: '8px',
                                color: '#c33',
                                marginBottom: '16px'
                            }}>
                                {error}
                            </div>
                        )}
                        <button type="button" className="btn btn-secondary" disabled={loading}>
                            Save as Draft
                        </button>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Offboarding Request'}
                        </button>
                    </div>
                </>
            )}
        </form>
    );
}

export default OffboardingForm;
