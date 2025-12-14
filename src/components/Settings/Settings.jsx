import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import './Settings.css';

// Emoji picker options
const emojiOptions = ['🍔', '🚗', '🛍️', '🎬', '💡', '💊', '📚', '💰', '💻', '🎁', '🏠', '✈️', '🎮', '📱', '👕', '⛽', '🚌', '📦', '🏦', '💵', '💳'];

export default function Settings() {
    const {
        settings,
        setSettings,
        budgets,
        updateBudget,
        transactions,
        categories,
        addCategory,
        deleteCategory,
        addSubcategory,
        deleteSubcategory,
        paymentModes,
        addPaymentMode,
        deletePaymentMode,
        addTransaction
    } = useApp();

    // Theme state
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('mm_theme') || 'dark';
    });

    // Linked Accounts State
    const [linkedAccounts, setLinkedAccounts] = useState(() => {
        const saved = localStorage.getItem('mm_linked_accounts');
        return saved ? JSON.parse(saved) : {
            upi: { linked: false, id: '' },
            bank: { linked: false, account: '' }
        };
    });

    // Apply theme on mount and change
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mm_theme', theme);
    }, [theme]);

    // Persist linked accounts
    useEffect(() => {
        localStorage.setItem('mm_linked_accounts', JSON.stringify(linkedAccounts));
    }, [linkedAccounts]);

    // Category modal state
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', icon: '📁', type: 'expense' });

    // Subcategory modal state
    const [showAddSubcategory, setShowAddSubcategory] = useState(null);
    const [newSubcategory, setNewSubcategory] = useState({ name: '', icon: '📁' });

    // Payment mode modal state
    const [showAddPaymentMode, setShowAddPaymentMode] = useState(false);
    const [newPaymentMode, setNewPaymentMode] = useState({ name: '', icon: '💳', description: '' });

    // Expanded category for viewing subcategories
    const [expandedCategory, setExpandedCategory] = useState(null);

    // File input ref for import
    const fileInputRef = useRef(null);

    const toggleSetting = (path) => {
        const keys = path.split('.');
        setSettings(prev => {
            const newSettings = { ...prev };
            let current = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = !current[keys[keys.length - 1]];
            return newSettings;
        });
    };

    const handleBudgetChange = (id, value) => {
        const numValue = parseInt(value) || 0;
        updateBudget(id, numValue);
    };

    const handleClearData = () => {
        if (confirm('This will clear all your transaction data. Are you sure?')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    // Toggle theme
    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Export as Excel (CSV format)
    const handleExportExcel = () => {
        const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Mode', 'Status'];
        const rows = transactions.map(t => [
            new Date(t.date).toLocaleDateString('en-IN'),
            t.type,
            t.category,
            t.description,
            t.amount,
            t.paymentMode || 'N/A',
            t.status
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `money-manager-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import Excel/CSV
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result;
                const lines = text.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());

                let imported = 0;
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;

                    const values = lines[i].match(/(".*?"|[^",]+)/g)?.map(v => v.replace(/"/g, '').trim()) || [];
                    if (values.length < 5) continue;

                    const dateIdx = headers.indexOf('date');
                    const typeIdx = headers.indexOf('type');
                    const categoryIdx = headers.indexOf('category');
                    const descIdx = headers.indexOf('description');
                    const amountIdx = headers.indexOf('amount');
                    const paymentIdx = headers.indexOf('payment mode');

                    const dateStr = values[dateIdx] || new Date().toLocaleDateString('en-IN');
                    const dateParts = dateStr.split('/');
                    const date = dateParts.length === 3
                        ? new Date(dateParts[2], dateParts[1] - 1, dateParts[0])
                        : new Date(dateStr);

                    addTransaction({
                        type: values[typeIdx] || 'expense',
                        category: values[categoryIdx] || 'other',
                        description: values[descIdx] || 'Imported',
                        amount: parseFloat(values[amountIdx]) || 0,
                        paymentMode: values[paymentIdx] || 'cash',
                        date: date.toISOString(),
                        source: 'import'
                    });
                    imported++;
                }

                alert(`Successfully imported ${imported} transactions!`);
            } catch (error) {
                alert('Error importing file. Please check the format.');
                console.error(error);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const handleLinkAccount = (type, value) => {
        if (!value.trim()) return;
        setLinkedAccounts(prev => ({
            ...prev,
            [type]: { linked: true, id: value }
        }));
    };

    const handleUnlinkAccount = (type) => {
        if (confirm(`Unlink this ${type.toUpperCase()} account? Auto-tracking will stop.`)) {
            setLinkedAccounts(prev => ({
                ...prev,
                [type]: { linked: false, id: '' }
            }));
        }
    };

    const handleAddCategory = () => {
        if (!newCategory.name.trim()) return;
        addCategory(newCategory);
        setNewCategory({ name: '', icon: '📁', type: 'expense' });
        setShowAddCategory(false);
    };

    const handleAddSubcategory = () => {
        if (!newSubcategory.name.trim() || !showAddSubcategory) return;
        addSubcategory(showAddSubcategory, newSubcategory);
        setNewSubcategory({ name: '', icon: '📁' });
        setShowAddSubcategory(null);
    };

    const handleAddPaymentMode = () => {
        if (!newPaymentMode.name.trim()) return;
        addPaymentMode(newPaymentMode);
        setNewPaymentMode({ name: '', icon: '💳', description: '' });
        setShowAddPaymentMode(false);
    };

    const handleDeleteCategory = (categoryId) => {
        if (confirm('Delete this category and all its subcategories?')) {
            deleteCategory(categoryId);
        }
    };

    const handleDeletePaymentMode = (modeId) => {
        if (confirm('Delete this payment mode?')) {
            deletePaymentMode(modeId);
        }
    };

    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');

    return (
        <div className="settings-container">
            <h2 className="settings-title">⚙️ Settings</h2>

            {/* Theme Toggle */}
            <div className="settings-section">
                <div className="section-header">
                    <span className="section-icon">🎨</span>
                    <span className="section-title">Appearance</span>
                </div>
                <div className="settings-list">
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Theme</span>
                            <span className="setting-description">
                                {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                            </span>
                        </div>
                        <button
                            className={`theme-toggle ${theme}`}
                            onClick={toggleTheme}
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            <span className="theme-toggle-track">
                                <span className="theme-toggle-thumb">
                                    {theme === 'dark' ? '🌙' : '☀️'}
                                </span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bank & UPI Linking */}
            <div className="settings-section">
                <div className="section-header">
                    <span className="section-icon">🏦</span>
                    <span className="section-title">Account Linking</span>
                </div>
                <div className="settings-list">
                    {/* UPI */}
                    <div className="setting-item column">
                        <div className="setting-info">
                            <span className="setting-label">Unified Payments Interface (UPI)</span>
                            <span className="setting-description">
                                Link UPI ID for auto-tracking
                            </span>
                        </div>
                        {linkedAccounts.upi.linked ? (
                            <div className="linked-status">
                                <span className="status-badge success">✅ Connected</span>
                                <span className="linked-id">{linkedAccounts.upi.id}</span>
                                <button
                                    className="unlink-btn"
                                    onClick={() => handleUnlinkAccount('upi')}
                                >
                                    Unlink
                                </button>
                            </div>
                        ) : (
                            <div className="link-input-group">
                                <input
                                    type="text"
                                    placeholder="Enter UPI ID (e.g., name@okicici)"
                                    className="link-input"
                                    onBlur={(e) => handleLinkAccount('upi', e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Bank Account */}
                    <div className="setting-item column">
                        <div className="setting-info">
                            <span className="setting-label">Bank Account</span>
                            <span className="setting-description">
                                Link Bank Account for SMS tracking
                            </span>
                        </div>
                        {linkedAccounts.bank.linked ? (
                            <div className="linked-status">
                                <span className="status-badge success">✅ Connected</span>
                                <span className="linked-id">Account ending in {linkedAccounts.bank.id.slice(-4)}</span>
                                <button
                                    className="unlink-btn"
                                    onClick={() => handleUnlinkAccount('bank')}
                                >
                                    Unlink
                                </button>
                            </div>
                        ) : (
                            <div className="link-input-group">
                                <input
                                    type="text"
                                    placeholder="Enter Account Number"
                                    className="link-input"
                                    onBlur={(e) => handleLinkAccount('bank', e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <div className="settings-section">
                <div className="section-header">
                    <span className="section-icon">🏷️</span>
                    <span className="section-title">Categories</span>
                    <button
                        className="add-category-btn"
                        onClick={() => setShowAddCategory(true)}
                    >
                        + Add
                    </button>
                </div>

                {/* Expense Categories */}
                <div className="category-group">
                    <div className="category-group-title">Expense Categories</div>
                    <div className="category-list-items">
                        {expenseCategories.map(cat => (
                            <div key={cat.id} className="category-card">
                                <div
                                    className="category-card-header"
                                    onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                                >
                                    <span className="category-icon-large">{cat.icon}</span>
                                    <div className="category-card-info">
                                        <span className="category-card-name">{cat.name}</span>
                                        <span className="subcategory-count">
                                            {cat.subcategories?.length || 0} subcategories
                                        </span>
                                    </div>
                                    <div className="category-card-actions">
                                        <button
                                            className="add-sub-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowAddSubcategory(cat.id);
                                                setNewSubcategory({ name: '', icon: cat.icon });
                                            }}
                                            title="Add subcategory"
                                        >
                                            +
                                        </button>
                                        <button
                                            className="delete-cat-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCategory(cat.id);
                                            }}
                                            title="Delete category"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                {/* Subcategories */}
                                {expandedCategory === cat.id && cat.subcategories?.length > 0 && (
                                    <div className="subcategory-list">
                                        {cat.subcategories.map(sub => (
                                            <div key={sub.id} className="subcategory-item">
                                                <span className="subcategory-icon">{sub.icon}</span>
                                                <span className="subcategory-name">{sub.name}</span>
                                                <button
                                                    className="delete-sub-btn"
                                                    onClick={() => deleteSubcategory(cat.id, sub.id)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Income Categories */}
                <div className="category-group">
                    <div className="category-group-title">Income Categories</div>
                    <div className="category-list-items">
                        {incomeCategories.map(cat => (
                            <div key={cat.id} className="category-card income">
                                <div className="category-card-header">
                                    <span className="category-icon-large">{cat.icon}</span>
                                    <div className="category-card-info">
                                        <span className="category-card-name">{cat.name}</span>
                                    </div>
                                    <button
                                        className="delete-cat-btn"
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        title="Delete category"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payment Modes Section */}
            <div className="settings-section">
                <div className="section-header">
                    <span className="section-icon">💳</span>
                    <span className="section-title">Payment Modes</span>
                    <button
                        className="add-category-btn"
                        onClick={() => setShowAddPaymentMode(true)}
                    >
                        + Add
                    </button>
                </div>
                <div className="payment-modes-list">
                    {paymentModes?.map(mode => (
                        <div key={mode.id} className="payment-mode-card">
                            <span className="payment-mode-icon">{mode.icon}</span>
                            <div className="payment-mode-info">
                                <span className="payment-mode-name">{mode.name}</span>
                                <span className="payment-mode-desc">{mode.description}</span>
                            </div>
                            <button
                                className="delete-cat-btn"
                                onClick={() => handleDeletePaymentMode(mode.id)}
                                title="Delete payment mode"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Budget Limits */}
            <div className="settings-section">
                <div className="section-header">
                    <span className="section-icon">💰</span>
                    <span className="section-title">Monthly Budget Limits</span>
                </div>
                <div className="budget-list">
                    {budgets.map(budget => (
                        <div key={budget.id} className="budget-item">
                            <div className="budget-details">
                                <div className="budget-name">{budget.name}</div>
                                <div className="budget-current">
                                    Limit: {formatCurrency(budget.limit)}
                                </div>
                            </div>
                            <div className="budget-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    className="budget-input"
                                    value={budget.limit}
                                    onChange={(e) => handleBudgetChange(budget.id, e.target.value)}
                                    min="0"
                                    step="500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notification Settings */}
            <div className="settings-section">
                <div className="section-header">
                    <span className="section-icon">🔔</span>
                    <span className="section-title">Notifications</span>
                </div>
                <div className="settings-list">
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Budget Alerts</span>
                            <span className="setting-description">Notify when approaching budget limits</span>
                        </div>
                        <button
                            className={`toggle-switch ${settings.notifications?.budgetAlerts ? 'active' : ''}`}
                            onClick={() => toggleSetting('notifications.budgetAlerts')}
                        />
                    </div>
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Daily Summary</span>
                            <span className="setting-description">Daily spending summary notification</span>
                        </div>
                        <button
                            className={`toggle-switch ${settings.notifications?.dailySummary ? 'active' : ''}`}
                            onClick={() => toggleSetting('notifications.dailySummary')}
                        />
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="settings-section">
                <div className="section-header">
                    <span className="section-icon">💾</span>
                    <span className="section-title">Data Management</span>
                </div>
                <div className="settings-list">
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Total Transactions</span>
                            <span className="setting-description">Stored in your browser</span>
                        </div>
                        <span className="text-sky font-semibold">{transactions.length}</span>
                    </div>
                </div>
            </div>

            {/* Hidden file input for import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            {/* Action Buttons */}
            <div className="action-buttons">
                <button className="action-btn secondary" onClick={handleImportClick}>
                    📥 Import Excel/CSV
                </button>
                <button className="action-btn primary" onClick={handleExportExcel}>
                    📊 Export Excel/CSV
                </button>
                <button className="action-btn danger" onClick={handleClearData}>
                    🗑️ Clear All Data
                </button>
            </div>

            {/* Version */}
            <div className="version-info">
                <strong>Money Manager</strong> v1.0.0<br />
                Built with React + Vite<br />
                Premium Financial Tracking
            </div>

            {/* Add Category Modal */}
            {showAddCategory && (
                <div className="modal-overlay" onClick={() => setShowAddCategory(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Category</h3>
                            <button className="modal-close" onClick={() => setShowAddCategory(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Category Type</label>
                                <div className="type-toggle">
                                    <button
                                        className={`type-btn expense ${newCategory.type === 'expense' ? 'active' : ''}`}
                                        onClick={() => setNewCategory({ ...newCategory, type: 'expense' })}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        className={`type-btn income ${newCategory.type === 'income' ? 'active' : ''}`}
                                        onClick={() => setNewCategory({ ...newCategory, type: 'income' })}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Icon</label>
                                <div className="emoji-picker">
                                    {emojiOptions.map(emoji => (
                                        <button
                                            key={emoji}
                                            className={`emoji-option ${newCategory.icon === emoji ? 'selected' : ''}`}
                                            onClick={() => setNewCategory({ ...newCategory, icon: emoji })}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Travel, Education"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                />
                            </div>
                            <button
                                className="submit-btn"
                                onClick={handleAddCategory}
                                disabled={!newCategory.name.trim()}
                            >
                                Add Category
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subcategory Modal */}
            {showAddSubcategory && (
                <div className="modal-overlay" onClick={() => setShowAddSubcategory(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Subcategory</h3>
                            <button className="modal-close" onClick={() => setShowAddSubcategory(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Icon</label>
                                <div className="emoji-picker">
                                    {emojiOptions.map(emoji => (
                                        <button
                                            key={emoji}
                                            className={`emoji-option ${newSubcategory.icon === emoji ? 'selected' : ''}`}
                                            onClick={() => setNewSubcategory({ ...newSubcategory, icon: emoji })}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subcategory Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Coffee, Snacks"
                                    value={newSubcategory.name}
                                    onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                                />
                            </div>
                            <button
                                className="submit-btn"
                                onClick={handleAddSubcategory}
                                disabled={!newSubcategory.name.trim()}
                            >
                                Add Subcategory
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Payment Mode Modal */}
            {showAddPaymentMode && (
                <div className="modal-overlay" onClick={() => setShowAddPaymentMode(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Payment Mode</h3>
                            <button className="modal-close" onClick={() => setShowAddPaymentMode(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Icon</label>
                                <div className="emoji-picker">
                                    {emojiOptions.map(emoji => (
                                        <button
                                            key={emoji}
                                            className={`emoji-option ${newPaymentMode.icon === emoji ? 'selected' : ''}`}
                                            onClick={() => setNewPaymentMode({ ...newPaymentMode, icon: emoji })}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Mode Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., PhonePe, Google Pay"
                                    value={newPaymentMode.name}
                                    onChange={(e) => setNewPaymentMode({ ...newPaymentMode, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Primary UPI app"
                                    value={newPaymentMode.description}
                                    onChange={(e) => setNewPaymentMode({ ...newPaymentMode, description: e.target.value })}
                                />
                            </div>
                            <button
                                className="submit-btn"
                                onClick={handleAddPaymentMode}
                                disabled={!newPaymentMode.name.trim()}
                            >
                                Add Payment Mode
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
