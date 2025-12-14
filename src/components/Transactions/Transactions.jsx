import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
    formatCurrency,
    formatDate,
    formatTime,
    categoryIcons,
    getMonthName
} from '../../utils/helpers';
import './Transactions.css';

export default function Transactions() {
    const {
        selectedMonth,
        selectedYear,
        getMonthTransactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        categories,
        paymentModes
    } = useApp();

    const [filter, setFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // New transaction form state
    const [newTx, setNewTx] = useState({
        type: 'expense',
        amount: '',
        category: 'food',
        subcategory: '',
        description: '',
        paymentMode: 'cash',
        source: 'manual',
        date: new Date().toISOString().split('T')[0] // Default to today YYYY-MM-DD
    });

    const monthTransactions = getMonthTransactions();

    // Get filtered categories based on selected type
    const filteredCategories = categories?.filter(c => c.type === newTx.type) || [];

    // Get subcategories for selected category
    const currentCategory = categories?.find(c => c.name.toLowerCase().replace(/\s+/g, '_') === newTx.category);
    const subcategories = currentCategory?.subcategories || [];

    // Filter and search
    const filteredTransactions = useMemo(() => {
        return monthTransactions
            .filter(t => {
                if (filter === 'income' && t.type !== 'income') return false;
                if (filter === 'expense' && t.type !== 'expense') return false;
                if (filter === 'pending' && t.status !== 'pending') return false;
                if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    return t.description.toLowerCase().includes(query) ||
                        t.category.toLowerCase().includes(query) ||
                        (t.subcategory && t.subcategory.toLowerCase().includes(query));
                }
                return true;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [monthTransactions, filter, sourceFilter, searchQuery]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newTx.amount || !newTx.description) return;

        // Construct date with current time
        const now = new Date();
        const selectedDate = new Date(newTx.date);
        selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        const txData = {
            ...newTx,
            amount: parseFloat(newTx.amount),
            date: selectedDate.toISOString()
        };

        if (editingTransaction) {
            updateTransaction(editingTransaction.id, txData);
            setEditingTransaction(null);
        } else {
            addTransaction(txData);
        }

        resetForm();
        setShowModal(false);
    };

    const resetForm = () => {
        setNewTx({
            type: 'expense',
            amount: '',
            category: 'food',
            subcategory: '',
            description: '',
            paymentMode: 'cash',
            source: 'manual',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        const date = new Date(transaction.date);
        setNewTx({
            type: transaction.type,
            amount: transaction.amount.toString(),
            category: transaction.category,
            subcategory: transaction.subcategory || '',
            description: transaction.description,
            paymentMode: transaction.paymentMode || 'cash',
            source: transaction.source || 'manual',
            date: date.toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (confirm('Delete this transaction?')) {
            deleteTransaction(id);
        }
    };

    // Handle type change - reset category to first in new type
    const handleTypeChange = (type) => {
        const newCategories = categories?.filter(c => c.type === type) || [];
        const firstCategory = newCategories[0]?.name.toLowerCase().replace(/\s+/g, '_') || 'other';
        const firstCatObj = newCategories[0];
        const firstSub = firstCatObj?.subcategories?.[0]?.name || '';

        setNewTx({
            ...newTx,
            type,
            category: firstCategory,
            subcategory: firstSub
        });
    };

    const handleCategoryChange = (val) => {
        const catObj = categories?.find(c => c.name.toLowerCase().replace(/\s+/g, '_') === val);
        const firstSub = catObj?.subcategories?.[0]?.name || '';
        setNewTx({ ...newTx, category: val, subcategory: firstSub });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTransaction(null);
        resetForm();
    };

    return (
        <div className="transactions-container">
            {/* Header */}
            <div className="transactions-header">
                <h2 className="transactions-title">
                    💳 Transactions
                    <span className="text-secondary" style={{ fontSize: '0.9rem', fontWeight: 400, marginLeft: '8px' }}>
                        {getMonthName(selectedMonth)}
                    </span>
                </h2>
                <button className="add-transaction-btn" onClick={() => setShowModal(true)}>
                    <span>+</span> Add New
                </button>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({monthTransactions.length})
                </button>
                <button
                    className={`filter-btn ${filter === 'income' ? 'active' : ''}`}
                    onClick={() => setFilter('income')}
                >
                    Income
                </button>
                <button
                    className={`filter-btn ${filter === 'expense' ? 'active' : ''}`}
                    onClick={() => setFilter('expense')}
                >
                    Expense
                </button>
                <button
                    className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pending
                </button>
            </div>

            <div className="filters-section">
                <button
                    className={`filter-btn ${sourceFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setSourceFilter('all')}
                >
                    All Sources
                </button>
                <button
                    className={`filter-btn ${sourceFilter === 'upi' ? 'active' : ''}`}
                    onClick={() => setSourceFilter('upi')}
                >
                    UPI
                </button>
                <button
                    className={`filter-btn ${sourceFilter === 'sms' ? 'active' : ''}`}
                    onClick={() => setSourceFilter('sms')}
                >
                    Bank SMS
                </button>
                <button
                    className={`filter-btn ${sourceFilter === 'manual' ? 'active' : ''}`}
                    onClick={() => setSourceFilter('manual')}
                >
                    Manual
                </button>
                <input
                    type="text"
                    className="search-input"
                    placeholder="🔍 Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Transaction List */}
            <div className="transactions-list">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(t => (
                        <div key={t.id} className={`transaction-card ${t.status === 'pending' ? 'pending' : ''}`}>
                            <span className="tx-icon">{categoryIcons[t.category] || '📦'}</span>
                            <div className="tx-content">
                                <div className="tx-title">
                                    {t.description}
                                    {t.subcategory && <span className="tx-subcategory"> • {t.subcategory}</span>}
                                </div>
                                <div className="tx-meta">
                                    <span>{formatDate(t.date)} • {formatTime(t.date)}</span>
                                    <span className="tx-category">{t.category}</span>
                                    {t.paymentMode && (
                                        <span className="tx-payment-mode">{t.paymentMode}</span>
                                    )}
                                    {t.status === 'pending' && (
                                        <span className="tx-status pending">Pending</span>
                                    )}
                                </div>
                            </div>
                            <span className={`tx-amount ${t.type}`}>
                                {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                            </span>
                            <div className="tx-actions">
                                <button
                                    className="tx-action-btn edit"
                                    onClick={() => handleEdit(t)}
                                    title="Edit"
                                >
                                    ✏️
                                </button>
                                <button
                                    className="tx-action-btn"
                                    onClick={() => handleDelete(t.id)}
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results">
                        <div className="no-results-icon">📭</div>
                        <p>No transactions found</p>
                        <p className="text-muted">Try adjusting your filters</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Transaction Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                            </h3>
                            <button className="modal-close" onClick={handleCloseModal}>×</button>
                        </div>
                        <form className="modal-body" onSubmit={handleSubmit}>
                            {/* Type Toggle */}
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <div className="type-toggle">
                                    <button
                                        type="button"
                                        className={`type-btn expense ${newTx.type === 'expense' ? 'active' : ''}`}
                                        onClick={() => handleTypeChange('expense')}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        className={`type-btn income ${newTx.type === 'income' ? 'active' : ''}`}
                                        onClick={() => handleTypeChange('income')}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>

                            {/* Date Picker */}
                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={newTx.date}
                                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Amount */}
                            <div className="form-group">
                                <label className="form-label">Amount (₹)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Enter amount"
                                    value={newTx.amount}
                                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="What was this for?"
                                    value={newTx.description}
                                    onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Category - Filtered by type */}
                            <div className="form-group">
                                <label className="form-label">
                                    Category ({newTx.type === 'income' ? '💰 Income' : '💳 Expense'})
                                </label>
                                <select
                                    className="form-input"
                                    value={newTx.category}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                >
                                    {filteredCategories.map(cat => (
                                        <option key={cat.id} value={cat.name.toLowerCase().replace(/\s+/g, '_')}>
                                            {cat.icon} {cat.name}
                                        </option>
                                    ))}
                                    {filteredCategories.length === 0 && (
                                        <option value="other">📦 Other</option>
                                    )}
                                </select>
                            </div>

                            {/* Subcategory Dropdown - Only if subcategories exist */}
                            {subcategories.length > 0 && (
                                <div className="form-group">
                                    <label className="form-label">Subcategory</label>
                                    <select
                                        className="form-input"
                                        value={newTx.subcategory}
                                        onChange={(e) => setNewTx({ ...newTx, subcategory: e.target.value })}
                                    >
                                        <option value="">Select Subcategory</option>
                                        {subcategories.map(sub => (
                                            <option key={sub.id} value={sub.name}>
                                                {sub.icon} {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Payment Mode */}
                            <div className="form-group">
                                <label className="form-label">💳 Payment Mode</label>
                                <select
                                    className="form-input"
                                    value={newTx.paymentMode}
                                    onChange={(e) => setNewTx({ ...newTx, paymentMode: e.target.value })}
                                >
                                    {paymentModes?.map(mode => (
                                        <option key={mode.id} value={mode.name.toLowerCase().replace(/\s+/g, '_')}>
                                            {mode.icon} {mode.name}
                                        </option>
                                    ))}
                                    {(!paymentModes || paymentModes.length === 0) && (
                                        <>
                                            <option value="cash">💵 Cash</option>
                                            <option value="upi">📱 UPI</option>
                                            <option value="bank">🏦 Bank Account</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <button type="submit" className="submit-btn">
                                {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
