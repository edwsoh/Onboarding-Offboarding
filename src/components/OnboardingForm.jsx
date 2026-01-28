import { useState } from 'react';
import './OnboardingForm.css';

const M365_LICENSES = [
    {
        id: 'm365-e3',
        name: 'Microsoft 365 E3',
        description: 'Core productivity suite with Office apps, email, and collaboration tools',
        category: 'Enterprise'
    },
    {
        id: 'm365-e5',
        name: 'Microsoft 365 E5',
        description: 'Advanced security, compliance, analytics, and voice capabilities',
        category: 'Enterprise'
    },
    {
        id: 'm365-f3',
        name: 'Microsoft 365 F3',
        description: 'Designed for frontline workers with essential productivity tools',
        category: 'Frontline'
    },
    {
        id: 'o365-e1',
        name: 'Office 365 E1',
        description: 'Web-based Office apps and business services',
        category: 'Enterprise'
    },
    {
        id: 'exchange-p1',
        name: 'Exchange Online Plan 1',
        description: 'Business email with 50 GB mailbox',
        category: 'Add-on'
    },
    {
        id: 'project-p3',
        name: 'Project Plan 3',
        description: 'Project management with desktop client and online access',
        category: 'Add-on'
    },
    {
        id: 'visio-p2',
        name: 'Visio Plan 2',
        description: 'Professional diagramming with desktop and web app',
        category: 'Add-on'
    },
    {
        id: 'powerbi-pro',
        name: 'Power BI Pro',
        description: 'Business analytics and interactive visualizations',
        category: 'Add-on'
    }
];

const D365_PERMISSIONS = [
    {
        id: 'd365-team',
        name: 'Team Member',
        description: 'Basic read access to D365 F&O modules',
        level: 'Basic'
    },
    {
        id: 'd365-operations',
        name: 'Operations',
        description: 'Standard user access to operational modules (Sales, Inventory, Procurement)',
        level: 'Standard'
    },
    {
        id: 'd365-finance',
        name: 'Finance',
        description: 'Access to financial modules (GL, AP, AR, Fixed Assets, Budgeting)',
        level: 'Standard'
    },
    {
        id: 'd365-hr',
        name: 'Human Resources',
        description: 'Access to HR modules (Personnel, Benefits, Leave, Performance)',
        level: 'Standard'
    },
    {
        id: 'd365-admin',
        name: 'Administrator',
        description: 'Full system access including configuration and user management',
        level: 'Admin'
    },
    {
        id: 'd365-developer',
        name: 'Developer',
        description: 'Development environment access with X++ and extension capabilities',
        level: 'Admin'
    }
];

const DEPARTMENTS = [
    'Finance',
    'Human Resources',
    'Information Technology',
    'Marketing',
    'Operations',
    'Sales',
    'Supply Chain',
    'Manufacturing',
    'Customer Service',
    'Legal'
];

function OnboardingForm() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        jobTitle: '',
        manager: '',
        startDate: '',
        employeeType: 'full-time',
        workLocation: '',
        selectedLicenses: [],
        selectedPermissions: [],
        notes: ''
    });

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbycAepzas1nrNReDAMkHSUR3wv45KXay-cFWVfTMu7f0z2UQnpPJyn5qVE7pXfWPxpmhQ/exec';

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLicenseToggle = (licenseId) => {
        setFormData(prev => ({
            ...prev,
            selectedLicenses: prev.selectedLicenses.includes(licenseId)
                ? prev.selectedLicenses.filter(id => id !== licenseId)
                : [...prev.selectedLicenses, licenseId]
        }));
    };

    const handlePermissionToggle = (permissionId) => {
        setFormData(prev => ({
            ...prev,
            selectedPermissions: prev.selectedPermissions.includes(permissionId)
                ? prev.selectedPermissions.filter(id => id !== permissionId)
                : [...prev.selectedPermissions, permissionId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Get license names
            const licenseNames = formData.selectedLicenses
                .map(id => M365_LICENSES.find(l => l.id === id)?.name)
                .filter(Boolean)
                .join(', ');

            // Get permission names
            const permissionNames = formData.selectedPermissions
                .map(id => D365_PERMISSIONS.find(p => p.id === id)?.name)
                .filter(Boolean)
                .join(', ');

            // Prepare data for Google Sheets
            const submissionData = {
                formType: 'Onboarding',
                timestamp: new Date().toISOString(),
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                department: formData.department,
                jobTitle: formData.jobTitle,
                manager: formData.manager,
                startDate: formData.startDate,
                employeeType: formData.employeeType,
                workLocation: formData.workLocation,
                licenses: licenseNames,
                permissions: permissionNames,
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
            console.log('Onboarding submitted successfully');
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
                <div className="success-message">
                    <div className="success-icon">✓</div>
                    <h2>Onboarding Request Submitted!</h2>
                    <p>
                        The onboarding request for <strong>{formData.firstName} {formData.lastName}</strong> has been submitted successfully.
                    </p>
                    <div className="success-details">
                        <div className="detail-item">
                            <span className="detail-label">Email:</span>
                            <span className="detail-value">{formData.email}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Department:</span>
                            <span className="detail-value">{formData.department}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Start Date:</span>
                            <span className="detail-value">{formData.startDate}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Licenses:</span>
                            <span className="detail-value">{formData.selectedLicenses.length} selected</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">D365 Permissions:</span>
                            <span className="detail-value">{formData.selectedPermissions.length} selected</span>
                        </div>
                    </div>
                    <button
                        className="btn btn-primary btn-lg mt-4"
                        onClick={() => {
                            setSubmitted(false);
                            setFormData({
                                firstName: '',
                                lastName: '',
                                email: '',
                                department: '',
                                jobTitle: '',
                                manager: '',
                                startDate: '',
                                employeeType: 'full-time',
                                workLocation: '',
                                selectedLicenses: [],
                                selectedPermissions: [],
                                notes: ''
                            });
                        }}
                    >
                        Submit Another Request
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="onboarding-form">
            {/* Employee Details Section */}
            <div className="card fade-in">
                <div className="card-header">
                    <h3 className="card-title">👤 Employee Details</h3>
                    <p className="card-subtitle">Enter the new employee's basic information</p>
                </div>

                <div className="grid grid-cols-2">
                    <div className="form-group">
                        <label className="form-label" htmlFor="firstName">First Name *</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            className="form-input"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            placeholder="Enter first name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="lastName">Last Name *</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            className="form-input"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Enter last name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Work Email *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="name@hunterdouglas.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="department">Department *</label>
                        <select
                            id="department"
                            name="department"
                            className="form-select"
                            value={formData.department}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select department</option>
                            {DEPARTMENTS.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="jobTitle">Job Title *</label>
                        <input
                            type="text"
                            id="jobTitle"
                            name="jobTitle"
                            className="form-input"
                            value={formData.jobTitle}
                            onChange={handleInputChange}
                            placeholder="Enter job title"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="manager">Reporting Manager *</label>
                        <input
                            type="text"
                            id="manager"
                            name="manager"
                            className="form-input"
                            value={formData.manager}
                            onChange={handleInputChange}
                            placeholder="Manager's name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="startDate">Start Date *</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            className="form-input"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="employeeType">Employee Type *</label>
                        <select
                            id="employeeType"
                            name="employeeType"
                            className="form-select"
                            value={formData.employeeType}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="full-time">Full-Time</option>
                            <option value="part-time">Part-Time</option>
                            <option value="contractor">Contractor</option>
                            <option value="intern">Intern</option>
                        </select>
                    </div>

                    <div className="form-group grid-span-2">
                        <label className="form-label" htmlFor="workLocation">Work Location</label>
                        <input
                            type="text"
                            id="workLocation"
                            name="workLocation"
                            className="form-input"
                            value={formData.workLocation}
                            onChange={handleInputChange}
                            placeholder="Office location or Remote"
                        />
                    </div>
                </div>
            </div>

            {/* Microsoft 365 Licenses Section */}
            <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="card-header">
                    <h3 className="card-title">📧 Microsoft 365 Licenses</h3>
                    <p className="card-subtitle">Select the required Microsoft 365 licenses for this employee</p>
                </div>

                <div className="license-grid">
                    {M365_LICENSES.map(license => (
                        <div
                            key={license.id}
                            className={`license-card ${formData.selectedLicenses.includes(license.id) ? 'selected' : ''}`}
                            onClick={() => handleLicenseToggle(license.id)}
                        >
                            <div className="license-card-header">
                                <input
                                    type="checkbox"
                                    className="checkbox-input"
                                    checked={formData.selectedLicenses.includes(license.id)}
                                    onChange={() => handleLicenseToggle(license.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <span className="license-card-title">{license.name}</span>
                                <span className={`badge badge-${license.category === 'Enterprise' ? 'info' : license.category === 'Frontline' ? 'warning' : 'success'}`}>
                                    {license.category}
                                </span>
                            </div>
                            <p className="license-card-description">{license.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* D365 F&O Permissions Section */}
            <div className="card fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="card-header">
                    <h3 className="card-title">⚙️ Dynamics 365 F&O Permissions</h3>
                    <p className="card-subtitle">Assign D365 Finance & Operations permission levels</p>
                </div>

                <div className="permissions-grid">
                    {D365_PERMISSIONS.map(permission => (
                        <label
                            key={permission.id}
                            className={`permission-card ${formData.selectedPermissions.includes(permission.id) ? 'selected' : ''}`}
                        >
                            <input
                                type="checkbox"
                                className="checkbox-input"
                                checked={formData.selectedPermissions.includes(permission.id)}
                                onChange={() => handlePermissionToggle(permission.id)}
                            />
                            <div className="permission-content">
                                <div className="permission-header">
                                    <span className="permission-name">{permission.name}</span>
                                    <span className={`badge badge-${permission.level === 'Basic' ? 'success' : permission.level === 'Standard' ? 'info' : 'warning'}`}>
                                        {permission.level}
                                    </span>
                                </div>
                                <p className="permission-description">{permission.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Additional Notes Section */}
            <div className="card fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="card-header">
                    <h3 className="card-title">📝 Additional Notes</h3>
                    <p className="card-subtitle">Any additional information or special requirements</p>
                </div>

                <div className="form-group mb-0">
                    <textarea
                        id="notes"
                        name="notes"
                        className="form-textarea"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Enter any additional notes, special access requirements, or equipment needs..."
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
                    {loading ? 'Submitting...' : 'Submit Onboarding Request'}
                </button>
            </div>
        </form>
    );
}

export default OnboardingForm;
